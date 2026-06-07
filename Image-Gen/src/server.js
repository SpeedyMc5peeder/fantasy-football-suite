/**
 * server.js — Image-Gen Express REST API
 * 
 * Exposes endpoints to generate Imagen 3 graphics and apply dynamic text overlays.
 */

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
const fs = require('fs');
const { applyOverlay } = require('./overlay');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Set up Output Directory
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
if (!API_KEY) {
  console.error("❌ No Gemini API key provided. Image generation will fail.");
}

// Initialize the Google Gen AI client
// Note: SDK will default to using process.env.GEMINI_API_KEY, but we can explicitly pass it.
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * POST /api/generate
 * 
 * Body Parameters:
 * - prompt: The image generation prompt string
 * - style: 'sports-illustrated', 'ringer', 'retro-comic', or 'none' (default 'none')
 * - aspectRatio: '1:1', '3:4', '4:3', '9:16', '16:9' (default based on style)
 * - overlayText: { title, mainHeadline, subHeadline, badgeText }
 * - filename: Optional custom filename without extension (e.g., 'dfl_recap_week_5')
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style = 'none', aspectRatio, overlayText = {}, filename } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing required parameter 'prompt'" });
    }

    console.log(`\n🎨 Starting new Image-Gen Request...`);
    console.log(`   Prompt: "${prompt}"`);
    console.log(`   Style: ${style}`);

    // Determine implicit aspect ratio if not explicitly provided
    let finalAspectRatio = aspectRatio;
    if (!finalAspectRatio) {
      if (style === 'sports-illustrated' || style === 'ringer' || style === 'retro-comic') {
        finalAspectRatio = '3:4'; // Portrait magazine covers
      } else {
        finalAspectRatio = '16:9'; // Mascot landscape default
      }
    }

    console.log(`   Aspect Ratio: ${finalAspectRatio}`);
    console.log(`   Calling Imagen 3 via Gemini API...`);

    // Call the Imagen model
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
    
    // Generate safe filename
    const safeFilename = filename ? `${filename}.jpg` : `img_${Date.now()}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, safeFilename);

    console.log(`   Applying overlay style "${style}" and saving to disk...`);
    
    // Apply SVG overlay and composite
    await applyOverlay(baseBuffer, style, overlayText, outputPath);

    console.log(`✅ Successfully generated and saved image: ${safeFilename}`);

    res.json({
      success: true,
      filename: safeFilename,
      filepath: outputPath,
      urlPath: `/images/${safeFilename}`
    });

  } catch (error) {
    console.error(`❌ Error in /api/generate:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Expose static images
app.use('/images', express.static(OUTPUT_DIR));

app.listen(PORT, () => {
  console.log(`🖼️  Image-Gen Server is running on http://localhost:${PORT}`);
  console.log(`   Available endpoints: POST /api/generate`);
});
