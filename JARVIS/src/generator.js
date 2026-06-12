/**
 * generator.js — AI Commentary Generation Engine
 *
 * Integrates the Google Gemini API with Sleeper and Dynasty-Evaluator data.
 * Resolves trade math by POSTing to the local Dynasty-Evaluator REST server,
 * then generates Ringer-style columns based on prompt templates.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const path = require('path');
const { SYSTEM_INSTRUCTIONS, getTradePrompt, getRecapPrompt, getWaiverPrompt } = require('./promptTemplates');

const { evaluate } = require('./evaluator');

// Cheapest model — used for yes/no classifier calls (news relevance, fallen
// legend check). These don't need the persona or the pricier flash model.
const CLASSIFIER_MODEL = 'gemini-2.5-flash-lite';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Helper to get the Dynasty-Evaluator evaluation for a trade natively
 */
async function fetchTradeEvaluation(sideAPlayerIds, sideAPicks, sideBPlayerIds, sideBPicks, modeA = 'neutral', modeB = 'neutral') {
  try {
    const payload = {
      sideA: {
        players: sideAPlayerIds,
        picks: sideAPicks
      },
      sideB: {
        players: sideBPlayerIds,
        picks: sideBPicks
      },
      settings: {
        team_1_mode: modeA,
        team_2_mode: modeB
      }
    };

    console.log(`📡 Evaluating trade natively using internal Dynasty-Evaluator logic...`);
    return evaluate(payload);
  } catch (err) {
    console.error('⚠️ Native Evaluation failed:', err.message);
    // Return a mock/empty evaluation so generation can still try to continue
    return {
      sideA_raw_value: 0,
      sideA_adjusted_value: 0,
      sideB_raw_value: 0,
      sideB_adjusted_value: 0,
      roster_tax_applied: 0,
      final_sideA_total: 0,
      final_sideB_total: 0,
      fairness_ratio: 1.0,
      winner: 'even',
      margin_description: 'Evaluator failed. Value calculations unavailable.'
    };
  }
}

/**
 * Main generator class wrapper
 */
class CommentaryGenerator {
  constructor(apiKey, modelName = 'gemini-2.5-flash') {
    if (!apiKey) {
      throw new Error('Missing Gemini API Key. Verify your config.json settings.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  /**
   * Execute a commentary generation. On a transient 503 (model busy) it retries
   * the SAME model after a short backoff rather than escalating to gemini-2.5-pro
   * — Pro costs ~4x more and has a tiny free tier, so the old fallback was the
   * main driver of both API cost and instant free-tier limits. If it still fails,
   * it throws so the caller can defer and retry on the next poll.
   */
  async executeWithFallback(prompt, context) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_INSTRUCTIONS
    });
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🤖 Generating ${context} via Gemini API (${this.modelName})${attempt > 1 ? ` [retry ${attempt - 1}]` : ''}...`);
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        const transient = err.message && (err.message.includes('503') || err.message.includes('overloaded'));
        if (transient && attempt < maxAttempts) {
          console.warn(`⚠️ ${this.modelName} busy (503). Retrying in ${attempt * 2}s...`);
          await sleep(attempt * 2000);
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Generates a column reacting to a trade transaction.
   */
  async generateTradeCommentary(tradeData) {
    const {
      managerA,
      teamNameA,
      managerALore,
      managerAMode,
      managerB,
      teamNameB,
      managerBLore,
      managerBMode,
      sideAPlayerIds,
      sideAPlayerNames,
      sideAPicks,
      sideBPlayerIds,
      sideBPlayerNames,
      sideBPicks
    } = tradeData;

    // 1. Fetch evaluator math
    const evaluation = await fetchTradeEvaluation(
      sideAPlayerIds,
      sideAPicks,
      sideBPlayerIds,
      sideBPicks,
      managerAMode,
      managerBMode
    );

    // Combine player names and picks for prompt readability
    const sideAAssets = [...sideAPlayerNames, ...sideAPicks];
    const sideBAssets = [...sideBPlayerNames, ...sideBPicks];

    // 2. Build trade prompt
    const prompt = getTradePrompt({
      managerA,
      teamNameA,
      managerALore,
      managerAMode,
      managerB,
      teamNameB,
      managerBLore,
      managerBMode,
      sideAAssets,
      sideBAssets,
      evaluation
    });

    // 3. Call Gemini
    return this.executeWithFallback(prompt, 'Trade column');
  }

  /**
   * Generates a weekly matchup recap column.
   */
  async generateWeeklyRecap(recapData) {
    const prompt = getRecapPrompt(recapData);
    return this.executeWithFallback(prompt, 'Weekly Recap column');
  }

  /**
   * Generates a waiver transaction summary.
   */
  async generateWaiverCommentary(waiverData) {
    const prompt = getWaiverPrompt(waiverData);
    return this.executeWithFallback(prompt, 'Waiver review column');
  }

  /**
   * AI Bouncer: Checks if a dropped player is a true fantasy legend.
   */
  async checkIsFallenLegend(playerName) {
    const prompt = `Is the NFL player ${playerName} a widely recognized former fantasy football stud, legend, or someone whose star "burned very bright" for at least one or two amazing seasons (like David Johnson, Todd Gurley, Nick Chubb, Julio Jones, etc.)? Answer ONLY with the word YES or NO. Do not include any other text.`;
    console.log(`🤖 AI Bouncer: Checking if ${playerName} is a Fallen Legend...`);
    
    try {
      // Cheapest model, no persona — it's a YES/NO classifier.
      const model = this.genAI.getGenerativeModel({ model: CLASSIFIER_MODEL });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim().toUpperCase();
      return answer.includes('YES');
    } catch (err) {
      // A failed legend check just means "not a legend" for this drop — no Pro fallback.
      console.error('⚠️ AI Bouncer (Fallen Legend) failed:', err.message);
      return false;
    }
  }

  /**
   * Generates a Celebration of Life tribute for a fallen legend.
   */
  async generateFallenLegendCommentary(data) {
    const prompt = require('./promptTemplates').getFallenLegendPrompt(data);
    return this.executeWithFallback(prompt, 'Fallen Legend Tribute');
  }

  /**
   * Bouncer for Breaking News: Checks if an ESPN news headline/description indicates 
   * a fantasy-relevant injury, suspension, or major event.
   * If yes, returns the player's full name. If no, returns null.
   */
  async checkNewsRelevance(headline, description) {
    const prompt = `
You are a fantasy football news analyzer.
Headline: "${headline}"
Description: "${description}"

Does this news involve a specific NFL player at a fantasy-relevant position (QB, RB, WR, TE)?
If YES, reply ONLY with the player's full name (e.g. "Saquon Barkley").
If NO, or if it's strictly about a coach or team as a whole, reply ONLY with "NONE".
Do not include any other text or punctuation.`;
    try {
      // Lean classifier call: cheapest model, NO persona/system instruction.
      // This runs on every news article, so the ~2k-token persona was pure waste.
      const model = this.genAI.getGenerativeModel({ model: CLASSIFIER_MODEL });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/\.$/, '');
      if (text !== 'NONE' && text.length > 2) {
        return text;
      }
      return null;
    } catch (e) {
      console.error('Bouncer Error on News:', e.message);
      // Rethrow so the caller can leave the article unprocessed and retry next poll.
      // Returning null here made API outages indistinguishable from "not relevant",
      // permanently skipping articles that failed during a Gemini hiccup.
      throw e;
    }
  }

  /**
   * Generates breaking news commentary roasting/consoling a manager.
   */
  async generateNewsCommentary(data) {
    const prompt = require('./promptTemplates').getBreakingNewsPrompt(data);
    return await this.executeWithFallback(prompt, 'Breaking News Commentary');
  }

  /**
   * Generates FAAB waiver spend commentary.
   */
  async generateFAABCommentary(data) {
    const prompt = require('./promptTemplates').getFAABPrompt(data);
    return await this.executeWithFallback(prompt, 'FAAB Waiver Spend Commentary');
  }

  /**
   * Generates Matchup of the Week preview.
   */
  async generateMatchupOfTheWeekCommentary(data) {
    const prompt = require('./promptTemplates').getMatchupOfTheWeekPrompt(data);
    return await this.executeWithFallback(prompt, 'Matchup of the Week Preview');
  }

  /**
   * Generates Monday Night Miracle preview.
   */
  async generateMondayNightMiracleCommentary(data) {
    const prompt = require('./promptTemplates').getMondayNightMiraclePrompt(data);
    return await this.executeWithFallback(prompt, 'Monday Night Miracle Preview');
  }
}

module.exports = CommentaryGenerator;
