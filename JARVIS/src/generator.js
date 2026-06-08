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
   * Helper to execute Gemini call with 503 fallback to gemini-2.5-pro
   */
  async executeWithFallback(prompt, context) {
    try {
      console.log(`🤖 Generating ${context} via Gemini API (${this.modelName})...`);
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: SYSTEM_INSTRUCTIONS
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (err.message && err.message.includes('503') && this.modelName !== 'gemini-2.5-pro') {
        console.warn(`⚠️ 503 Service Unavailable with ${this.modelName}. Auto-falling back to gemini-2.5-pro...`);
        const fallbackModel = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
          systemInstruction: SYSTEM_INSTRUCTIONS
        });
        const result = await fallbackModel.generateContent(prompt);
        return result.response.text();
      }
      throw err;
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
    try {
      const prompt = `Is the NFL player ${playerName} considered a widely recognized former fantasy football stud/legend (like Nick Chubb, Julio Jones, Derrick Henry, etc.)? Answer ONLY with the word YES or NO. Do not include any other text.`;
      console.log(`🤖 AI Bouncer: Checking if ${playerName} is a Fallen Legend...`);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim().toUpperCase();
      return answer.includes('YES');
    } catch (err) {
      console.error('⚠️ AI Bouncer failed:', err.message);
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
}

module.exports = CommentaryGenerator;
