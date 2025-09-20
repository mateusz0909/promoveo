const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const { Vibrant } = require('node-vibrant/node');

console.log('Initializing Image Generation service...');

async function analyzeImageColors(imageBuffer) {
  try {
    console.log('ImageGenerationService: Starting color analysis...');
    const palette = await Vibrant.from(imageBuffer).getPalette();
    
    // Log all available colors for debugging
    console.log('ImageGenerationService: Color palette found:', {
      Vibrant: palette.Vibrant?.hex,
      LightVibrant: palette.LightVibrant?.hex,
      DarkVibrant: palette.DarkVibrant?.hex,
      Muted: palette.Muted?.hex,
      LightMuted: palette.LightMuted?.hex,
      DarkMuted: palette.DarkMuted?.hex
    });
    
    // Try multiple fallback options for better color selection
    // Prioritize vibrant colors, but avoid pure black/white
    let accentColor = palette.Vibrant?.hex || palette.LightVibrant?.hex || palette.DarkVibrant?.hex;
    
    // If no vibrant colors, try muted colors
    if (!accentColor || accentColor === '#000000' || accentColor === '#ffffff') {
      accentColor = palette.Muted?.hex || palette.LightMuted?.hex || palette.DarkMuted?.hex;
    }
    
    // If still black/white/null, use attractive defaults
    if (!accentColor || accentColor === '#000000' || accentColor === '#ffffff') {
      // Use a nice blue as the final fallback
      accentColor = '#4F46E5';
    }
    
    console.log(`ImageGenerationService: Selected accent color: ${accentColor}`);
    return { accentColor };
  } catch (error) {
    console.error('Error analyzing image colors:', error);
    return { accentColor: '#4F46E5' }; // Use a nice blue instead of black
  }
}

function lightenColor(hex, percent) {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, r + (255 - r) * (percent / 100));
  const newG = Math.min(255, g + (255 - g) * (percent / 100));
  const newB = Math.min(255, b + (255 - b) * (percent / 100));

  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, currentY);
  return currentY + lineHeight; // Return the Y position after the last line
}

async function generateMockupImage(screenshotBuffer, device = 'iPhone') {
    console.log(`ImageGenerationService: generating mockup image for ${device}...`);

    const deviceConfigs = {
        iPhone: {
            frameWidth: 1293,
            frameHeight: 2656,
            screenWidth: 1179 + 4,
            screenHeight: 2552 + 4,
            cornerRadius: 70,
            framePath: path.join(__dirname, '../assets/images/iphone_15_frame.png'),
        },
        iPad: {
            frameWidth: 1145,
            frameHeight: 1494,
            screenWidth: 1038 - 2,
            screenHeight: 1385 - 2,
            cornerRadius: 20, // Example value, adjust if needed
            framePath: path.join(__dirname, '../assets/images/iPad Pro 13 Frame.png'),
        }
    };

    const config = deviceConfigs[device] || deviceConfigs.iPhone;
    const { frameWidth, frameHeight, screenWidth, screenHeight, cornerRadius, framePath } = config;

    const canvas = createCanvas(frameWidth, frameHeight);
    const context = canvas.getContext('2d');
    
    console.log(`ImageGenerationService: Mockup canvas created - ${frameWidth}x${frameHeight}`);

    try {
        const screenshot = await loadImage(screenshotBuffer);
        const frame = await loadImage(framePath);
        
        console.log(`ImageGenerationService: Loaded screenshot (${screenshot.width}x${screenshot.height}) and frame (${frame.width}x${frame.height})`);

        const screenX = (frameWidth - screenWidth) / 2;
        const screenY = (frameHeight - screenHeight) / 2;

        // --- Clipping Path for the screen ---
        context.save();
        context.beginPath();
        
        // Use arc-based rounded rectangle for better compatibility
        const x = screenX;
        const y = screenY;
        const w = screenWidth;
        const h = screenHeight;
        const r = cornerRadius;
        
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
        context.clip();

        // --- Draw screenshot ---
        const screenshotAspectRatio = screenshot.width / screenshot.height;
        let screenshotDrawWidth = screenWidth + 6;
        let screenshotDrawHeight = screenshotDrawWidth / screenshotAspectRatio;
        if (screenshotDrawHeight < screenHeight + 6) {
            screenshotDrawHeight = screenHeight + 6;
            screenshotDrawWidth = screenshotDrawHeight * screenshotAspectRatio;
        }
        const screenshotDrawX = screenX - 2;
        const screenshotDrawY = screenY - 2;

        console.log(`ImageGenerationService: Drawing screenshot at (${screenshotDrawX}, ${screenshotDrawY}) size ${screenshotDrawWidth}x${screenshotDrawHeight}`);
        context.drawImage(screenshot, screenshotDrawX, screenshotDrawY, screenshotDrawWidth, screenshotDrawHeight);
        
        context.restore(); // remove clipping path

        // --- Draw frame ---
        console.log(`ImageGenerationService: Drawing frame at (0, 0) size ${frameWidth}x${frameHeight}`);
        context.drawImage(frame, 0, 0, frameWidth, frameHeight);
        
        console.log(`ImageGenerationService: Mockup generation completed successfully`);
    } catch (error) {
        console.error(`Error generating mockup image for ${device}:`, error);
        console.error(`Error details:`, {
            framePath: framePath,
            frameExists: fs.existsSync(framePath),
            screenshotBufferSize: screenshotBuffer ? screenshotBuffer.length : 'null'
        });
        throw error; // Re-throw the error to be caught by the caller
    }
    return canvas;
}

// Find a font file in a directory based on family, weight, and other keywords
function findFontFile(fontDir, family, weight) {
  const files = fs.readdirSync(fontDir);
  const lowerFamily = family.toLowerCase();
  const lowerWeight = weight.toLowerCase();

  // Search patterns:
  // 1. Exact match (e.g., "Nexa-Bold.ttf")
  // 2. With underscore (e.g., "OpenSans_Bold.ttf")
  // 3. With weight in the middle (e.g., "Inter_18pt-Bold.ttf")
  // 4. Fallback to regular/book if weight not found
  const patterns = [
    new RegExp(`^${lowerFamily}[-_]${lowerWeight}\\.(ttf|otf)`, 'i'),
    new RegExp(`^${lowerFamily}.*${lowerWeight}\\.(ttf|otf)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = files.find(f => pattern.test(f));
    if (match) return match;
  }

  // Fallback for bold
  if (lowerWeight === 'bold') {
    const boldFallback = files.find(f => /bold/i.test(f) && !/italic/i.test(f));
    if (boldFallback) return boldFallback;
  }
  
  // Fallback for regular
  const regularFallback = files.find(f => /regular/i.test(f) && !/italic/i.test(f)) || files.find(f => /book/i.test(f) && !/italic/i.test(f));
  if (regularFallback) return regularFallback;

  // Last resort: find any non-italic ttf/otf
  return files.find(f => f.match(/\.(ttf|otf)$/i) && !/italic/i.test(f));
}


async function generateAppStoreImage(heading, subheading, screenshotBuffer, headingFontFamily = 'Farro', subheadingFontFamily = 'Headland One', headingFontSize = 120, subheadingFontSize = 80, device = 'iPhone') {
  console.log(`ImageGenerationService: generating App Store image with fonts ${headingFontFamily}/${subheadingFontFamily} for ${device}`);

  // Font mapping - from display name to folder name
  const fontMapping = {
    'Farro': 'Farro',
    'Headland One': 'Headland One', 
    'Inter': 'Inter',
    'Lato': 'Lato',
    'Montserrat': 'Montserrat',
    'Nexa': 'Nexa-Font-Family',
    'Open Sans': 'Open_Sans',
    'Roboto': 'Roboto'
  };

  const isIPad = device === 'iPad';
  const width = isIPad ? 2048 : 1284;
  const height = isIPad ? 2732 : 2778;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  console.log(`ImageGenerationService: Canvas created - ${width}x${height}, context type: ${context.constructor.name}`);

  // Dynamically register fonts with proper mapping
  try {
    // Register heading font
    const headingFontDir = fontMapping[headingFontFamily] || 'Farro';
    const headingFontPath = path.join(__dirname, `../assets/fonts/${headingFontDir}`);
    const headingFontFile = findFontFile(headingFontPath, headingFontFamily, 'bold');
    if (headingFontFile) {
      registerFont(path.join(headingFontPath, headingFontFile), { family: headingFontFamily, weight: 'bold' });
      console.log(`Font ${headingFontFamily} (bold) registered from ${headingFontDir}/${headingFontFile}`);
    } else {
      throw new Error(`No bold font file found for font ${headingFontFamily} in ${headingFontDir}`);
    }

    // Register subheading font
    const subheadingFontDir = fontMapping[subheadingFontFamily] || 'Headland One';
    const subheadingFontPath = path.join(__dirname, `../assets/fonts/${subheadingFontDir}`);
    const subheadingFontFile = findFontFile(subheadingFontPath, subheadingFontFamily, 'regular');
    if (subheadingFontFile) {
      registerFont(path.join(subheadingFontPath, subheadingFontFile), { family: subheadingFontFamily, weight: 'regular' });
      console.log(`Font ${subheadingFontFamily} (regular) registered from ${subheadingFontDir}/${subheadingFontFile}`);
    } else {
      throw new Error(`No regular font file found for font ${subheadingFontFamily} in ${subheadingFontDir}`);
    }
  } catch (error) {
    console.error(`Error registering fonts:`, error);
    // Fallback to Farro and Headland One
    headingFontFamily = 'Farro';
    subheadingFontFamily = 'Headland One';
    registerFont(path.join(__dirname, '../assets/fonts/Farro/Farro-Bold.ttf'), { family: 'Farro', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Headland One/HeadlandOne-Regular.ttf'), { family: 'Headland One' });
  }

  const { accentColor } = await analyzeImageColors(screenshotBuffer);

  const backgroundColor = lightenColor(accentColor, 80); // 80% lighter
  const headingColor = '#1a1a1a'; // Almost black

  // background
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, backgroundColor);
  gradient.addColorStop(1, '#f0f0f0'); // Almost white

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Heading
  context.font = `bold ${headingFontSize}px "${headingFontFamily}"`;
  context.fillStyle = headingColor;
  context.textAlign = 'center';
  const headingY = wrapText(context, heading, width / 2, 200, width - 100, headingFontSize * 1.1);

  // Subheading
  context.font = `${subheadingFontSize}px "${subheadingFontFamily}"`;
  context.fillStyle = '#383838ff';
  context.textAlign = 'center';
  wrapText(context, subheading, width / 2, headingY, width - 100, subheadingFontSize * 1.2);

  // Mockup
  try {
    console.log(`ImageGenerationService: generating mockup for screenshot from buffer`);
    const mockupCanvas = await generateMockupImage(screenshotBuffer, device);
    
    const textHeight = 500; // Fixed height for the text area
    const remainingHeight = height - textHeight;
    
    const mockupAspectRatio = mockupCanvas.width / mockupCanvas.height;
    let mockupDrawHeight = remainingHeight * 0.9; // Make it 90% of the available height
    let mockupDrawWidth = mockupDrawHeight * mockupAspectRatio;

    if (mockupDrawWidth > width * 0.9) { // Also reduce max width to have side margins
        mockupDrawWidth = width * 0.9;
        mockupDrawHeight = mockupDrawWidth / mockupAspectRatio;
    }

    const x = (width - mockupDrawWidth) / 2;
    const y = textHeight + (remainingHeight - mockupDrawHeight) / 2; // Center it vertically in the remaining space

    console.log('ImageGenerationService: drawing mockup.');
    context.drawImage(mockupCanvas, x, y, mockupDrawWidth, mockupDrawHeight);
  } catch (error) {
    console.error('Error drawing mockup:', error);
  }


  console.log('ImageGenerationService: App Store image generation complete.');
  
  try {
    const imageBuffer = canvas.toBuffer('image/jpeg', { quality: 0.55 });
    console.log(`ImageGenerationService: JPEG buffer generated - size: ${imageBuffer.length} bytes, quality: 55%`);
    
    if (imageBuffer.length < 1000) {
      console.error(`ImageGenerationService: WARNING - Generated image buffer is very small (${imageBuffer.length} bytes), likely corrupted`);
    }
    
    return { imageBuffer, accentColor };
  } catch (error) {
    console.error('ImageGenerationService: Error converting canvas to buffer:', error);
    throw error;
  }
}

console.log('ImageGenerationService initialized.');

module.exports = { generateAppStoreImage };