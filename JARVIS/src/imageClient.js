/**
 * imageClient.js — Generates images via Imagen 3 & overlays via sharp.
 * Uploads to catbox.moe and returns the direct URL for Sleeper embedding.
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
      model: 'imagen-3.0-generate-002',
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

    // Guard against empty payloads — when Imagen is overloaded (503) or the prompt
    // is safety-blocked, it can still return a generatedImages entry with no bytes.
    // Without this check, Buffer.from(undefined) yields an empty buffer and sharp
    // throws the cryptic "Input buffer is empty" downstream.
    const imgBase64 = response.generatedImages[0]?.image?.imageBytes;
    if (!imgBase64) {
      throw new Error("API returned an image with no data (likely 503/quota or a safety block).");
    }
    const baseBuffer = Buffer.from(imgBase64, 'base64');
    if (baseBuffer.length === 0) {
      throw new Error("Decoded image buffer is empty.");
    }

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
 * Uploads the generated image to catbox.moe and returns its direct URL as markdown.
 * Catbox is anonymous (no auth), returns a permanent direct-file URL that Sleeper
 * renders inline. This replaces the old git-commit-and-push hosting, which spawned
 * Git Credential Manager popups, raced the GitHub Actions runner's pushes, and reset
 * the machine's global git identity on every image.
 * @param {string} filename
 * @param {boolean} dryRun
 * @returns {string} Markdown-ready image URL, or '' on failure (so we never post a broken link)
 */
async function pushAndGetMarkdown(filename, dryRun) {
  if (!filename) return '';

  const imagePath = path.join(OUTPUT_DIR, filename);

  if (dryRun) {
    console.log(`🚫 [DRY RUN] Bypassing image upload for: ${filename}`);
    return `\n\n[DRY RUN IMAGE: ${filename}]`;
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`⚠️ Image file not found, cannot upload: ${imagePath}`);
    return '';
  }

  try {
    console.log(`📡 Uploading image to catbox.moe...`);
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(imagePath));

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const publicUrl = typeof res.data === 'string' ? res.data.trim() : '';
    if (!publicUrl.startsWith('http')) {
      throw new Error(`Unexpected catbox response: ${publicUrl || '(empty)'}`);
    }

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return `\n\n${publicUrl}`;
  } catch (err) {
    console.error(`⚠️ Failed to upload image to catbox:`, err.message);
    return ''; // Return empty string so we don't post a broken link
  }
}

module.exports = {
  generateImage,
  pushAndGetMarkdown
};
