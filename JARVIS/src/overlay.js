/**
 * overlay.js — SVG & Sharp-based Image Overlay Engine
 * 
 * Uses dynamic SVGs layered via sharp.composite() to draw complex, beautifully styled 
 * text onto generated images without requiring system-level canvas dependencies.
 */

const sharp = require('sharp');
const fs = require('fs');

/**
 * Utility to wrap text into multiple lines for SVG since <text> doesn't auto-wrap.
 */
function wrapText(text, maxCharsPerLine) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    if ((currentLine + words[i]).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = words[i] + ' ';
    } else {
      currentLine += words[i] + ' ';
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

/**
 * Applies a styled SVG overlay onto a base image buffer.
 * 
 * @param {Buffer} baseImageBuffer - The original JPG/PNG from Imagen 3.
 * @param {string} style - The overlay style ('sports-illustrated', 'ringer', 'retro-comic', 'none').
 * @param {Object} textData - Configuration for the text.
 * @param {string} outputPath - Where to save the resulting image.
 */
async function applyOverlay(baseImageBuffer, style, textData, outputPath) {
  // Pass-through if no style requested
  if (!style || style === 'none' || style === 'mascot') {
    await sharp(baseImageBuffer).jpeg({ quality: 95 }).toFile(outputPath);
    return;
  }

  // Determine base image dimensions
  const metadata = await sharp(baseImageBuffer).metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Ensure title/headline fallbacks
  const title = (textData.title || '').toUpperCase();
  const mainHeadline = (textData.mainHeadline || '').toUpperCase();
  const subHeadline = textData.subHeadline || '';
  const badgeText = (textData.badgeText || '').toUpperCase();
  
  let svgContent = '';

  if (style === 'sports-illustrated' || style === 'si') {
    // -----------------------------------------------------
    // SPORTS ILLUSTRATED STYLE
    // -----------------------------------------------------
    svgContent = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
        <filter id="heavy-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.9"/>
        </filter>
      </defs>
      
      <!-- Top Title Bar -->
      <text x="50%" y="12%" font-family="Impact, Arial Black, sans-serif" font-size="${Math.floor(width * 0.12)}" font-weight="900" fill="#e61e25" text-anchor="middle" filter="url(#drop-shadow)" letter-spacing="2">
        ${title || 'SPORTS ILLUSTRATED'}
      </text>

      <!-- Main Headline (Bottom Left Aligned) -->
      <text x="5%" y="78%" font-family="Impact, sans-serif" font-size="${Math.floor(width * 0.08)}" font-weight="900" fill="#ffffff" filter="url(#heavy-shadow)">
        ${wrapText(mainHeadline, 20).map((line, i) => `<tspan x="5%" dy="${i === 0 ? 0 : '1em'}">${line}</tspan>`).join('')}
      </text>

      <!-- Sub Headline -->
      <text x="5%" y="86%" font-family="Georgia, serif" font-size="${Math.floor(width * 0.04)}" font-weight="bold" fill="#ffd700" filter="url(#drop-shadow)">
        ${wrapText(subHeadline, 45).map((line, i) => `<tspan x="5%" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`).join('')}
      </text>
      
      <!-- Issue Date/Badge -->
      ${badgeText ? `
      <rect x="5%" y="3%" width="${Math.floor(width * 0.15)}" height="${Math.floor(width * 0.05)}" fill="#e61e25" />
      <text x="${5 + (width * 0.075)}%" y="6%" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.025)}" font-weight="bold" fill="white" text-anchor="middle">
        ${badgeText}
      </text>
      ` : ''}
    </svg>`;

  } else if (style === 'ringer') {
    // -----------------------------------------------------
    // THE RINGER STYLE
    // -----------------------------------------------------
    svgContent = `
    <svg width="${width}" height="${height}">
      <!-- Header Banner Box -->
      <rect x="0" y="0" width="${width}" height="${Math.floor(height * 0.15)}" fill="#1d1d1d" fill-opacity="0.95" />
      
      <!-- Green Underline Accent -->
      <rect x="0" y="${Math.floor(height * 0.15)}" width="${width}" height="8" fill="#14ff00" />
      
      <!-- Logo/Title Text -->
      <text x="50%" y="10%" font-family="Trebuchet MS, Arial, sans-serif" font-size="${Math.floor(width * 0.08)}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
        ${title || 'THE RINGER'}
      </text>

      <!-- Main Headline Banner (Bottom) -->
      <rect x="5%" y="75%" width="90%" height="${Math.floor(height * 0.18)}" fill="#ffffff" fill-opacity="0.95" rx="8" />
      
      <text x="50%" y="83%" font-family="Arial Black, sans-serif" font-size="${Math.floor(width * 0.065)}" font-weight="900" fill="#1d1d1d" text-anchor="middle">
        ${wrapText(mainHeadline, 25).map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : '1em'}">${line}</tspan>`).join('')}
      </text>
      
      <text x="50%" y="90%" font-family="Trebuchet MS, Arial, sans-serif" font-size="${Math.floor(width * 0.032)}" fill="#555555" font-weight="bold" text-anchor="middle">
        ${wrapText(subHeadline, 55).map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`).join('')}
      </text>
    </svg>`;

  } else if (style === 'retro-comic') {
    // -----------------------------------------------------
    // RETRO COMIC BOOK STYLE
    // -----------------------------------------------------
    svgContent = `
    <svg width="${width}" height="${height}">
      <defs>
        <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#000000" fill-opacity="0.1"/>
        </pattern>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#halftone)" />
      
      <rect x="0" y="0" width="${width}" height="${Math.floor(height * 0.18)}" fill="#ffe500" stroke="#000000" stroke-width="6"/>
      
      <text x="50%" y="12%" font-family="Comic Sans MS, Impact, sans-serif" font-size="${Math.floor(width * 0.1)}" font-weight="900" fill="#e61e25" text-anchor="middle" stroke="#000000" stroke-width="3">
        ${title || 'DFL COMICS'}
      </text>
      
      ${badgeText ? `
      <circle cx="${Math.floor(width * 0.1)}" cy="${Math.floor(height * 0.09)}" r="${Math.floor(width * 0.07)}" fill="#ffffff" stroke="#000000" stroke-width="4"/>
      <text x="${Math.floor(width * 0.1)}" y="${Math.floor(height * 0.10)}" font-family="Arial Black, sans-serif" font-size="${Math.floor(width * 0.04)}" font-weight="900" fill="#000000" text-anchor="middle">
        ${badgeText}
      </text>
      ` : ''}

      <g transform="translate(${Math.floor(width * 0.5)}, ${Math.floor(height * 0.8)}) rotate(-5)">
        <ellipse cx="0" cy="0" rx="${Math.floor(width * 0.45)}" ry="${Math.floor(height * 0.15)}" fill="#ffffff" stroke="#000000" stroke-width="8"/>
        <text x="0" y="-3%" font-family="Impact, Comic Sans MS, sans-serif" font-size="${Math.floor(width * 0.08)}" font-weight="900" fill="#e61e25" text-anchor="middle" stroke="#000000" stroke-width="2">
          ${wrapText(mainHeadline, 20).map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : '1em'}">${line}</tspan>`).join('')}
        </text>
        <text x="0" y="8%" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.035)}" font-weight="bold" fill="#000000" text-anchor="middle">
          ${wrapText(subHeadline, 45).map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`).join('')}
        </text>
      </g>
    </svg>`;
  }

  const svgBuffer = Buffer.from(svgContent);

  await sharp(baseImageBuffer)
    .composite([
      { input: svgBuffer, top: 0, left: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(outputPath);
}

module.exports = {
  applyOverlay
};
