/**
 * imageClient.js — Generates images via Imagen 3 & overlays via sharp.
 * Uploads to catbox.moe for Sleeper embedding.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const { applyOverlay } = require('./overlay');

const OUTPUT_DIR = path.join(__dirname, '..', 'images');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Ensure the root config.json is reachable
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');
let config = {};
try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Failed to read config.json:', err.message);
}

const API_KEY = process.env.GEMINI_API_KEY || config.gemini_api_key;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates an image and applies overlays locally.
 * @param {Object} payload 
 * @returns {string|null} The generated filename, or null if failed.
 */
async function generateImage(payload) {
  try {
    const { prompt, style = 'none', aspectRatio, overlayText = {}, filename } = payload;

    if (!prompt) {
      throw new Error("Missing required parameter 'prompt'");
    }

    console.log(`\n🎨 Starting internal Image-Gen...`);
    console.log(`   Style: ${style}`);

    let finalAspectRatio = aspectRatio;
    if (!finalAspectRatio) {
      if (style === 'sports-illustrated' || style === 'ringer' || style === 'retro-comic') {
        finalAspectRatio = '3:4';
      } else {
        finalAspectRatio = '16:9';
      }
    }

    console.log(`   Calling Imagen 3 via Gemini API...`);

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: finalAspectRatio,
        outputMimeType: 'image/jpeg'
      }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No images returned from API.");
    }

    const imgBase64 = response.generatedImages[0].image.imageBytes;
    const baseBuffer = Buffer.from(imgBase64, 'base64');
    
    const safeFilename = filename ? `${filename}.jpg` : `img_${Date.now()}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, safeFilename);

    console.log(`   Applying overlay style "${style}" and saving to disk...`);
    await applyOverlay(baseBuffer, style, overlayText, outputPath);

    console.log(`✅ Successfully generated image: ${safeFilename}`);
    return safeFilename;

  } catch (err) {
    console.error(`⚠️ Failed to generate image:`, err.message);
    return null;
  }
}

/**
 * Commits the generated image to the public GitHub repository and returns the raw GitHub URL.
 * @param {string} filename 
 * @param {boolean} dryRun 
 * @returns {string} Public image URL
 */
async function pushAndGetMarkdown(filename, dryRun) {
  if (!filename) return '';

  const imagePath = path.join(OUTPUT_DIR, filename);
  const publicUrl = `https://raw.githubusercontent.com/SpeedyMc5peeder/fantasy-football-suite/main/JARVIS/images/${filename}`;
  const markdownStr = `\n\n${publicUrl}`;
  
  if (dryRun) {
    console.log(`🚫 [DRY RUN] Bypassing git push for image: ${filename}`);
    return markdownStr;
  }

  try {
    console.log(`📡 Auto-committing generated image to GitHub...`);
    const { execSync } = require('child_process');
    
    execSync(`git config --global user.name "github-actions[bot]"`);
    execSync(`git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"`);
    // Add the image file explicitly (using path relative to JARVIS dir)
    execSync(`git add images/${filename}`);
    execSync(`git commit -m "feat: generate image ${filename} [skip ci]"`);
    execSync(`git push`);
    console.log(`✅ Image pushed to GitHub successfully: ${publicUrl}`);
    
    return markdownStr;
  } catch (err) {
    console.error(`⚠️ Failed to push image to GitHub:`, err.message);
    return ''; // Return empty string so we don't post a broken link
  }
}

module.exports = {
  generateImage,
  pushAndGetMarkdown
};
