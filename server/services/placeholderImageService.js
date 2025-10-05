// server/services/placeholderImageService.js
const { createCanvas, registerFont } = require('canvas');
const path = require('path');

// Register fonts (same as imageGenerationService)
const fontsDir = path.join(__dirname, '../assets/fonts');

try {
  // Register Inter font family
  registerFont(path.join(fontsDir, 'Inter/Inter-Regular.ttf'), { family: 'Inter', weight: 'normal' });
  registerFont(path.join(fontsDir, 'Inter/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
  console.log('PlaceholderImageService: Fonts registered successfully');
} catch (error) {
  console.error('PlaceholderImageService: Error registering fonts:', error);
}

/**
 * Generates a placeholder screenshot image with gradient background
 * @param {Object} options - Configuration options
 * @param {number} options.width - Canvas width (default: 1200)
 * @param {number} options.height - Canvas height (default: 2600)
 * @param {string} options.text - Main text to display (default: 'New Screenshot')
 * @param {string} options.device - Device name to display (default: 'iPhone 15 Pro')
 * @returns {Promise<Buffer>} - PNG image buffer
 */
async function generatePlaceholderImage(options = {}) {
  const {
    width = 1200,
    height = 2600,
    text = 'New Screenshot',
    device = 'iPhone 15 Pro'
  } = options;

  console.log(`PlaceholderImageService: Generating placeholder image (${width}×${height})`);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw gradient background (default AppStoreFire gradient)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle pattern overlay for visual interest
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 100 + 50;
    
    const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    circleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    circleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = circleGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Draw main text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  ctx.fillText(text, width / 2, height / 2 - 40);

  // Draw device info
  ctx.font = '32px Inter';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(device, width / 2, height / 2 + 40);

  // Draw helper text
  ctx.font = '24px Inter';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('Click to edit and customize', width / 2, height / 2 + 100);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add corner watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '20px Inter';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('AppStoreFire', width - 40, height - 40);

  console.log('PlaceholderImageService: Placeholder image generated successfully');

  // Return PNG buffer
  return canvas.toBuffer('image/png');
}

module.exports = { generatePlaceholderImage };
