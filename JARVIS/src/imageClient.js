const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const IMAGE_GEN_URL = 'http://localhost:5001/api/generate';

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
 * Uploads the generated image to catbox.moe, then returns a public URL string.
 * @param {string} filename 
 * @param {boolean} dryRun 
 * @returns {string} Public image URL
 */
async function pushAndGetMarkdown(filename, dryRun) {
  if (!filename) return '';

  const imagePath = path.join(__dirname, '..', '..', 'Image-Gen', 'images', filename);

  if (dryRun) {
    console.log(`🚫 [DRY RUN] Bypassing upload for image: ${filename}`);
    return `\n\nhttps://files.catbox.moe/dummy.jpg`;
  }

  try {
    console.log(`📡 Uploading generated image to catbox.moe...`);
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(imagePath));

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });
    
    const publicUrl = response.data;
    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return `\n\n${publicUrl}`;
  } catch (err) {
    console.error(`⚠️ Failed to upload image to catbox.moe:`, err.message);
  }

  return '';
}

module.exports = {
  generateImage,
  pushAndGetMarkdown
};
