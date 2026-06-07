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

  // If we have a Discord Webhook, upload it there to get a true public CDN URL!
  if (process.env.PERSONAL_DISCORD_WEBHOOK) {
    if (fs.existsSync(imagePath) && !dryRun) {
      try {
        console.log(`🚀 Uploading image to Discord CDN for public hosting...`);
        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', blob, filename);

        const webhookUrl = process.env.PERSONAL_DISCORD_WEBHOOK + '?wait=true';
        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.attachments && data.attachments.length > 0) {
            publicUrl = data.attachments[0].url;
            console.log(`✅ Hosted on Discord CDN successfully: ${publicUrl}`);
          } else {
            publicUrl += ` (Discord Success but no attachments returned)`;
          }
        } else {
          const errText = await response.text();
          console.warn(`⚠️ Failed to upload to Discord: ${response.status} ${errText}`);
          publicUrl += ` (Discord HTTP Error: ${response.status} ${errText})`;
        }
      } catch (err) {
        console.error(`⚠️ Discord upload error:`, err.message);
        publicUrl += ` (Discord Upload Exception: ${err.message})`;
      }
    } else if (!fs.existsSync(imagePath)) {
      publicUrl += ` (Error: Image file not found locally before upload)`;
    }
  } else {
    publicUrl += ` (Error: PERSONAL_DISCORD_WEBHOOK secret is missing or empty in the action environment)`;
  }

  const markdownStr = `\n\n${publicUrl}`;

  if (dryRun) {
    console.log(`🚫 [DRY RUN] Bypassing git push for image: ${filename}`);
    return markdownStr;
  }

  try {
    console.log(`📡 Auto-committing generated image to GitHub...`);
    // Note: We use relative path from BS-Pod directory to the Image-Gen directory
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
