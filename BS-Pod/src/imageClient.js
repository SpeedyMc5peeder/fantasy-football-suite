/**
 * imageClient.js — Utility to call Image-Gen and handle Git Auto-Commits
 */

const axios = require('axios');
const { execSync } = require('child_process');
const path = require('path');

const IMAGE_GEN_URL = 'http://localhost:5001/api/generate';
const RAW_GITHUB_BASE = 'https://raw.githubusercontent.com/SpeedyMc5peeder/fantasy-football-suite/main/Image-Gen/images/';

const fs = require('fs');

/**
 * Requests an image from the local Image-Gen server.
 * @param {Object} payload 
 * @returns {string|null} The generated filename, or null if failed.
 */
async function generateImage(payload) {
  try {
    console.log(`🖼️  Requesting Image from local Image-Gen API...`);
    const response = await axios.post(IMAGE_GEN_URL, payload);
    if (response.data && response.data.success) {
      return response.data.filename;
    }
  } catch (err) {
    console.error(`⚠️ Failed to generate image via API:`, err.message);
  }
  return null;
}

/**
 * Commits and pushes the generated image to GitHub, then returns a public URL string.
 * @param {string} filename 
 * @param {boolean} dryRun 
 * @returns {string} Public image URL
 */
async function pushAndGetMarkdown(filename, dryRun) {
  if (!filename) return '';

  const imagePath = path.join(__dirname, '..', '..', 'Image-Gen', 'images', filename);
  let publicUrl = `${RAW_GITHUB_BASE}${filename}`;

  const markdownStr = `\n\n${publicUrl}`;

  if (dryRun) {
    console.log(`🚫 [DRY RUN] Bypassing git push for image: ${filename}`);
    return markdownStr;
  }

  try {
    console.log(`📡 Auto-committing generated image to GitHub...`);
    const imageRelPath = `../Image-Gen/images/${filename}`;
    
    execSync(`git config --global user.name "github-actions[bot]"`);
    execSync(`git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"`);
    execSync(`git add ${imageRelPath}`);
    execSync(`git commit -m "feat: generate image ${filename} [skip ci]"`);
    execSync(`git push`);
    console.log(`✅ Image pushed to GitHub successfully.`);
  } catch (err) {
    console.error(`⚠️ Failed to push image to GitHub:`, err.message);
  }

  return markdownStr;
}

module.exports = {
  generateImage,
  pushAndGetMarkdown
};
