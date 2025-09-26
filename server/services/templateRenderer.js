const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const DEFAULT_DEVICE = 'iPhone';

const FONT_MAPPING = {
  Farro: 'Farro',
  'Headland One': 'Headland One',
  Inter: 'Inter',
  Lato: 'Lato',
  Montserrat: 'Montserrat',
  Nexa: 'Nexa-Font-Family',
  'Open Sans': 'Open_Sans',
  Roboto: 'Roboto',
};

const DEVICE_CONFIGS = {
  iPhone: {
    frameWidth: 1293,
    frameHeight: 2656,
    screenWidth: 1183,
    screenHeight: 2556,
    screenX: (1293 - 1183) / 2,
    screenY: (2656 - 2556) / 2,
    cornerRadius: 70,
    framePath: path.join(__dirname, '../assets/images/iphone_15_frame.png'),
  },
  iPad: {
    frameWidth: 1145,
    frameHeight: 1494,
    screenWidth: 1036,
    screenHeight: 1383,
    screenX: (1145 - 1036) / 2,
    screenY: (1494 - 1383) / 2,
    cornerRadius: 36,
    framePath: path.join(__dirname, '../assets/images/iPad Pro 13 Frame.png'),
  },
};

const registeredFontKeys = new Set();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  if (!hex) return null;
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized;
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = clamp(percent, 0, 100) / 100;
  return rgbToHex({
    r: rgb.r + (255 - rgb.r) * amount,
    g: rgb.g + (255 - rgb.g) * amount,
    b: rgb.b + (255 - rgb.b) * amount,
  });
};

const darkenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = clamp(percent, 0, 100) / 100;
  return rgbToHex({
    r: rgb.r * (1 - amount),
    g: rgb.g * (1 - amount),
    b: rgb.b * (1 - amount),
  });
};

const toRgbaString = (color, alpha = 1) => {
  if (!color) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
    if (match) {
      const [, r, g, b, existingAlpha] = match;
      const finalAlpha = alpha * parseFloat(existingAlpha);
      return `rgba(${r}, ${g}, ${b}, ${clamp(finalAlpha, 0, 1)})`;
    }
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
    }
  }

  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
};

const interpretWeight = (weight) => {
  if (!weight) return 'regular';
  if (typeof weight === 'number') {
    return weight >= 600 ? 'bold' : 'regular';
  }
  const normalized = weight.toString().toLowerCase();
  if (normalized.includes('bold') || ['600', '700', '800', '900'].includes(normalized)) {
    return 'bold';
  }
  return 'regular';
};

const findFontFile = (fontDir, family, weight) => {
  if (!fs.existsSync(fontDir)) {
    return null;
  }
  const files = fs.readdirSync(fontDir);
  const lowerFamily = family.toLowerCase().replace(/\s+/g, '');
  const normalizedWeight = interpretWeight(weight);

  const patterns = [
    new RegExp(`^${lowerFamily}[-_]?${normalizedWeight}.*\.(ttf|otf)$`, 'i'),
    new RegExp(`^${lowerFamily}.*${normalizedWeight}.*\.(ttf|otf)$`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = files.find((file) => pattern.test(file));
    if (match) {
      return match;
    }
  }

  if (normalizedWeight === 'bold') {
    const boldFallback = files.find((file) => /bold/i.test(file) && !/italic/i.test(file));
    if (boldFallback) return boldFallback;
  }

  const regularFallback =
    files.find((file) => /regular/i.test(file) && !/italic/i.test(file)) ||
    files.find((file) => /book/i.test(file) && !/italic/i.test(file)) ||
    files.find((file) => file.match(/\.(ttf|otf)$/i));

  return regularFallback || null;
};

const ensureFontRegistered = (family, weight = 'regular') => {
  if (!family) return;

  const normalizedFamily = family.toString();
  const normalizedWeight = interpretWeight(weight);
  const registryKey = `${normalizedFamily.toLowerCase()}-${normalizedWeight}`;

  if (registeredFontKeys.has(registryKey)) {
    return;
  }

  const mappedDirName = FONT_MAPPING[normalizedFamily] || FONT_MAPPING[family] || family;
  const fontDir = path.join(__dirname, `../assets/fonts/${mappedDirName}`);
  const fontFile = findFontFile(fontDir, normalizedFamily, normalizedWeight);

  if (!fontFile) {
    console.warn(`TemplateRenderer: Unable to locate font file for ${family} (${normalizedWeight}) in ${fontDir}`);
    return;
  }

  try {
    registerFont(path.join(fontDir, fontFile), {
      family: normalizedFamily,
      weight: normalizedWeight === 'bold' ? 'bold' : 'normal',
    });
    registeredFontKeys.add(registryKey);
  } catch (error) {
    if (!error.message?.includes('Font is already registered')) {
      console.warn(`TemplateRenderer: Failed to register font ${family} (${normalizedWeight}):`, error.message);
    }
  }
};

const resolveColorToken = (token, accentColor, overrides = {}) => {
  if (!token) {
    return accentColor;
  }

  const trimmed = token.toString().trim();

  if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  if (lower === 'accent' || lower === '{{accentcolor}}') {
    return accentColor;
  }

  if (lower === '{{headingcolor}}') {
    return overrides.colors?.heading || accentColor;
  }

  if (lower === '{{subheadingcolor}}') {
    return overrides.colors?.subheading || accentColor;
  }

  if (lower === '{{backgroundcolor}}') {
    return overrides.colors?.background || accentColor;
  }

  if (lower.startsWith('accentlighten(')) {
    const percent = parseFloat(lower.replace('accentlighten(', '').replace(')', '')) || 45;
    return lightenColor(accentColor, percent);
  }

  if (lower.startsWith('accentdarken(')) {
    const percent = parseFloat(lower.replace('accentdarken(', '').replace(')', '')) || 25;
    return darkenColor(accentColor, percent);
  }

  if (lower.startsWith('accentalpha(')) {
    const percent = parseFloat(lower.replace('accentalpha(', '').replace(')', '')) || 0.35;
    return toRgbaString(accentColor, clamp(percent, 0, 1));
  }

  return trimmed;
};

const parsePositionValue = (value, dimension) => {
  if (value === undefined || value === null) {
    return dimension / 2;
  }

  if (typeof value === 'string') {
    if (value.endsWith('%')) {
      return (parseFloat(value) / 100) * dimension;
    }
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed <= 1 && parsed >= 0 ? parsed * dimension : parsed;
    }
  }

  if (typeof value === 'number') {
    return value <= 1 && value >= 0 ? value * dimension : value;
  }

  return dimension / 2;
};

const parseRatioValue = (value, dimension) => {
  if (value === undefined || value === null) {
    return dimension;
  }

  if (typeof value === 'string' && value.endsWith('%')) {
    return (parseFloat(value) / 100) * dimension;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric <= 1 && numeric > 0 ? numeric * dimension : numeric;
  }

  return dimension;
};

const resolveFontFamily = (fontFamily, fonts, fallbackKey) => {
  if (!fontFamily) {
    return fonts[fallbackKey]?.family || fonts.heading.family;
  }

  if (fontFamily === '{{headingFont}}') {
    return fonts.heading.family;
  }

  if (fontFamily === '{{subheadingFont}}') {
    return fonts.subheading.family;
  }

  return fontFamily;
};

const resolveFontSize = (fontSize, fonts, fallbackKey) => {
  const fallback = fonts[fallbackKey]?.size || fonts.heading.size;
  if (fontSize === undefined || fontSize === null) {
    return fallback;
  }
  const numeric = Number(fontSize);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const resolveFontWeight = (fontWeight, fonts, fallbackKey) => {
  return fontWeight || fonts[fallbackKey]?.weight || fonts.heading.weight || '700';
};

const applyShadow = (ctx, shadow, accentColor, overrides) => {
  if (!shadow) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    return;
  }

  ctx.shadowColor = resolveColorToken(shadow.color || 'rgba(15, 15, 15, 0.22)', accentColor, overrides);
  ctx.shadowBlur = shadow.blur || 0;
  ctx.shadowOffsetX = shadow.offsetX || 0;
  ctx.shadowOffsetY = shadow.offsetY || 0;
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const normalizedRadius = Array.isArray(radius)
    ? radius
    : [radius, radius, radius, radius].map((val) => clamp(val, 0, Math.min(width, height) / 2));
  const [r1, r2, r3, r4] = normalizedRadius;

  ctx.beginPath();
  ctx.moveTo(x + r1, y);
  ctx.lineTo(x + width - r2, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r2);
  ctx.lineTo(x + width, y + height - r3);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r3, y + height);
  ctx.lineTo(x + r4, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r4);
  ctx.lineTo(x, y + r1);
  ctx.quadraticCurveTo(x, y, x + r1, y);
  ctx.closePath();
};

const drawTextWithSpacing = (ctx, text, x, y, align, letterSpacing) => {
  if (!letterSpacing) {
    ctx.fillText(text, x, y);
    return;
  }

  const characters = [...text];
  const totalWidth = characters.reduce((acc, char) => acc + ctx.measureText(char).width, 0) + (characters.length - 1) * letterSpacing;

  let cursorX = x;
  if (align === 'center') {
    cursorX = x - totalWidth / 2;
  } else if (align === 'right') {
    cursorX = x - totalWidth;
  }

  characters.forEach((char) => {
    ctx.fillText(char, cursorX, y);
    cursorX += ctx.measureText(char).width + letterSpacing;
  });
};

const wrapTextLines = (ctx, text, maxWidth) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  lines.push(currentLine);
  return lines;
};

const renderTextLayer = (ctx, layer, text, context) => {
  if (!text) {
    return;
  }

  const fallbackKey = layer.type === 'heading' ? 'heading' : 'subheading';
  const fontFamily = resolveFontFamily(layer.font?.family, context.fonts, fallbackKey);
  const fontSize = resolveFontSize(layer.font?.size, context.fonts, fallbackKey);
  const fontWeight = resolveFontWeight(layer.font?.weight, context.fonts, fallbackKey);
  const letterSpacing = Number(layer.font?.letterSpacing) || 0;
  const align = layer.textAlign || 'center';
  const verticalAlign = layer.verticalAlign || 'top';
  const lineHeightMultiplier = layer.lineHeight || (fallbackKey === 'heading' ? 1.05 : 1.2);
  const baseline = layer.baseline || 'alphabetic';

  ensureFontRegistered(fontFamily, fontWeight);

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  const maxWidthRatio = layer.maxWidthRatio || (fallbackKey === 'heading' ? 0.78 : 0.74);
  const maxWidth = context.width * clamp(maxWidthRatio, 0.1, 1);

  const position = layer.position || {};
  const baseX = parsePositionValue(position.x ?? 0.5, context.width);
  const baseY = parsePositionValue(position.y ?? 0.2, context.height);

  const offsets = context.overrides?.offsets?.[fallbackKey] || { x: 0, y: 0 };
  const x = baseX + (offsets.x || 0);
  const y = baseY + (offsets.y || 0);

  const resolvedColor = resolveColorToken(layer.color, context.accentColor, context.overrides);
  const opacity = layer.opacity !== undefined ? clamp(layer.opacity, 0, 1) : 1;

  let content = text;
  switch (layer.font?.transform) {
    case 'uppercase':
      content = text.toUpperCase();
      break;
    case 'lowercase':
      content = text.toLowerCase();
      break;
    case 'capitalize':
      content = text.replace(/\b\w/g, (char) => char.toUpperCase());
      break;
    default:
      break;
  }

  const lines = wrapTextLines(ctx, content, maxWidth);
  const lineHeight = fontSize * lineHeightMultiplier;
  const totalHeight = lines.length * lineHeight;

  let initialY = y;
  if (verticalAlign === 'middle') {
    initialY = y - totalHeight / 2 + lineHeight / 2;
  } else if (verticalAlign === 'bottom') {
    initialY = y - totalHeight + lineHeight;
  }

  applyShadow(ctx, layer.shadow, context.accentColor, context.overrides);
  ctx.fillStyle = toRgbaString(resolvedColor, opacity);

  lines.forEach((line, index) => {
    const lineY = initialY + index * lineHeight;
    drawTextWithSpacing(ctx, line, x, lineY, align, letterSpacing);
  });

  ctx.restore();
};

const renderAccentShape = (ctx, layer, context) => {
  const position = layer.position || {};
  const size = layer.size || {};
  const width = parseRatioValue(size.widthRatio ?? 0.6, context.width);
  const height = parseRatioValue(size.heightRatio ?? 0.4, context.height);
  const x = parsePositionValue(position.x ?? 0.5, context.width);
  const y = parsePositionValue(position.y ?? 0.6, context.height);
  const rotation = ((layer.rotation || 0) * Math.PI) / 180;
  const opacity = layer.opacity !== undefined ? clamp(layer.opacity, 0, 1) : 1;

  const color = resolveColorToken(layer.color, context.accentColor, context.overrides);

  ctx.save();
  ctx.translate(x, y);
  if (rotation) {
    ctx.rotate(rotation);
  }

  applyShadow(ctx, layer.shadow, context.accentColor, context.overrides);
  ctx.fillStyle = toRgbaString(color, opacity);

  const drawShape = () => {
    const shape = layer.shape || 'rounded-rect';
    const cornerRadiusRatio = layer.cornerRadiusRatio || (shape === 'capsule' ? 0.5 : 0.18);
    const radius = cornerRadiusRatio * Math.min(width, height);

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'capsule':
        drawRoundedRect(ctx, -width / 2, -height / 2, width, height, height / 2);
        ctx.fill();
        break;
      case 'rounded-rect':
      default:
        drawRoundedRect(ctx, -width / 2, -height / 2, width, height, radius);
        ctx.fill();
        break;
    }
  };

  ctx.globalAlpha = opacity;
  drawShape();
  ctx.restore();
};

const renderBadgeLayer = (ctx, layer, context) => {
  const text = layer.text;
  if (!text) return;

  const position = layer.position || {};
  const padding = layer.padding || { x: 28, y: 14 };
  const fontFamily = resolveFontFamily(layer.font?.family, context.fonts, 'subheading');
  const fontSize = resolveFontSize(layer.font?.size || 32, context.fonts, 'subheading');
  const fontWeight = resolveFontWeight(layer.font?.weight || '600', context.fonts, 'subheading');
  const letterSpacing = Number(layer.font?.letterSpacing) || 0;

  ensureFontRegistered(fontFamily, fontWeight);

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const x = parsePositionValue(position.x ?? 0.5, context.width);
  const y = parsePositionValue(position.y ?? 0.4, context.height);

  const textWidth = ctx.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
  const badgeWidth = textWidth + 2 * padding.x;
  const badgeHeight = fontSize + 2 * padding.y;

  const backgroundColor = resolveColorToken(layer.backgroundColor || 'accentLighten(52)', context.accentColor, context.overrides);
  const textColor = resolveColorToken(layer.color || '#0f172a', context.accentColor, context.overrides);
  const borderRadius = layer.borderRadius !== undefined
    ? layer.borderRadius
    : badgeHeight / 2;
  const opacity = layer.opacity !== undefined ? clamp(layer.opacity, 0, 1) : 1;

  ctx.translate(x, y);
  applyShadow(ctx, layer.shadow, context.accentColor, context.overrides);
  ctx.fillStyle = toRgbaString(backgroundColor, opacity);
  drawRoundedRect(ctx, -badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, borderRadius);
  ctx.fill();

  ctx.fillStyle = toRgbaString(textColor, opacity);
  drawTextWithSpacing(ctx, text, 0, 0, 'center', letterSpacing);
  ctx.restore();
};

const generateMockupCanvas = async (screenshotInput, device = DEFAULT_DEVICE) => {
  const config = DEVICE_CONFIGS[device] || DEVICE_CONFIGS[DEFAULT_DEVICE];
  if (!config) {
    throw new Error(`Unsupported device ${device}`);
  }

  const canvas = createCanvas(config.frameWidth, config.frameHeight);
  const ctx = canvas.getContext('2d');

  const [screenshot, frame] = await Promise.all([
    loadImage(screenshotInput),
    loadImage(config.framePath),
  ]);

  ctx.save();
  drawRoundedRect(
    ctx,
    config.screenX,
    config.screenY,
    config.screenWidth,
    config.screenHeight,
    config.cornerRadius
  );
  ctx.clip();

  const aspectRatio = screenshot.width / screenshot.height;
  let drawWidth = config.screenWidth + 6;
  let drawHeight = drawWidth / aspectRatio;

  if (drawHeight < config.screenHeight + 6) {
    drawHeight = config.screenHeight + 6;
    drawWidth = drawHeight * aspectRatio;
  }

  const drawX = config.screenX - 2;
  const drawY = config.screenY - 2;

  ctx.drawImage(screenshot, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  ctx.drawImage(frame, 0, 0, config.frameWidth, config.frameHeight);
  return canvas;
};

const renderMockupLayer = async (ctx, layer, context) => {
  const mockupCanvas = await generateMockupCanvas(context.screenshotInput, context.device);

  const size = layer.size || {};
  const desiredScale = Number(size.scale) || 0.9;

  const maxWidth = size.maxWidthRatio ? context.width * size.maxWidthRatio : context.width;
  const maxHeight = size.maxHeightRatio ? context.height * size.maxHeightRatio : context.height;

  const baseWidth = mockupCanvas.width * desiredScale;
  const baseHeight = mockupCanvas.height * desiredScale;

  const widthScale = maxWidth / baseWidth;
  const heightScale = maxHeight / baseHeight;
  const limitingScale = Math.min(1, widthScale, heightScale);
  const finalScale = desiredScale * limitingScale;

  const drawWidth = mockupCanvas.width * finalScale;
  const drawHeight = mockupCanvas.height * finalScale;

  const position = layer.position || {};
  const baseX = parsePositionValue(position.x ?? 0.5, context.width);
  const baseY = parsePositionValue(position.y ?? 0.65, context.height);

  const offsets = context.overrides?.offsets?.mockup || { x: 0, y: 0 };
  const x = baseX + (offsets.x || 0);
  const y = baseY + (offsets.y || 0);
  const rotation = ((layer.rotation || 0) * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  if (rotation) {
    ctx.rotate(rotation);
  }

  applyShadow(ctx, layer.shadow, context.accentColor, context.overrides);
  ctx.globalAlpha = layer.opacity !== undefined ? clamp(layer.opacity, 0, 1) : 1;
  ctx.drawImage(mockupCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
};

const applyBackground = (ctx, backgroundSpec, width, height, accentColor, overrides) => {
  if (!backgroundSpec) {
    const fallback = lightenColor(accentColor, 70);
    ctx.fillStyle = toRgbaString(fallback, 1);
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (backgroundSpec.type === 'gradient') {
    let gradient;
    const direction = (backgroundSpec.direction || 'vertical').toLowerCase();

    switch (direction) {
      case 'horizontal':
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'diagonal-bottom-left':
        gradient = ctx.createLinearGradient(width, 0, 0, height);
        break;
      case 'diagonal-right':
      case 'diagonal':
        gradient = ctx.createLinearGradient(0, 0, width, height);
        break;
      case 'radial': {
        const gradientRadius = Math.sqrt(width ** 2 + height ** 2) / 2;
        gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, gradientRadius);
        break;
      }
      case 'vertical':
      default:
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        break;
    }

    const stops = backgroundSpec.stops || [];
    if (stops.length === 0) {
      const fallback = lightenColor(accentColor, 65);
      gradient.addColorStop(0, fallback);
      gradient.addColorStop(1, '#ffffff');
    } else {
      stops.forEach((stop, index) => {
        const offset = stop.offset !== undefined ? clamp(stop.offset, 0, 1) : index / Math.max(stops.length - 1, 1);
        const color = resolveColorToken(stop.color, accentColor, overrides);
        gradient.addColorStop(offset, color);
      });
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (backgroundSpec.type === 'solid') {
    const color = resolveColorToken(backgroundSpec.color, accentColor, overrides);
    ctx.fillStyle = toRgbaString(color, backgroundSpec.opacity ?? 1);
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const fallback = resolveColorToken(backgroundSpec.color, accentColor, overrides) || lightenColor(accentColor, 70);
  ctx.fillStyle = toRgbaString(fallback, backgroundSpec.opacity ?? 1);
  ctx.fillRect(0, 0, width, height);
};

const ensureTemplateFonts = (templateSchema, fonts) => {
  ensureFontRegistered(fonts.heading.family, fonts.heading.weight);
  ensureFontRegistered(fonts.subheading.family, fonts.subheading.weight);

  const layers = templateSchema.layers || [];
  layers.forEach((layer) => {
    if (!['heading', 'subheading', 'badge'].includes(layer.type)) {
      return;
    }
    const key = layer.type === 'heading' ? 'heading' : 'subheading';
    const family = resolveFontFamily(layer.font?.family, fonts, key);
    const weight = resolveFontWeight(layer.font?.weight, fonts, key);
    ensureFontRegistered(family, weight);
  });
};

const getDeviceDefinition = (templateSchema, device = DEFAULT_DEVICE) => {
  const devices = templateSchema?.canvas?.devices || {};
  const defaultDevice = templateSchema?.canvas?.defaultDevice || DEFAULT_DEVICE;
  return (
    devices[device] ||
    devices[defaultDevice] ||
    Object.values(devices)[0] || {
      width: 1284,
      height: 2778,
      background: {
        type: 'gradient',
        direction: 'vertical',
        stops: [
          { offset: 0, color: 'accentLighten(62)' },
          { offset: 1, color: '#f8fafc' },
        ],
      },
    }
  );
};

const renderLayer = async (ctx, layer, context) => {
  switch (layer.type) {
    case 'heading':
      renderTextLayer(ctx, layer, context.heading, context);
      break;
    case 'subheading':
      renderTextLayer(ctx, layer, context.subheading, context);
      break;
    case 'accentShape':
      renderAccentShape(ctx, layer, context);
      break;
    case 'badge':
      renderBadgeLayer(ctx, layer, context);
      break;
    case 'mockup':
      await renderMockupLayer(ctx, layer, context);
      break;
    default:
      break;
  }
};

const renderTemplateToCanvas = async ({
  templateSchema,
  device = DEFAULT_DEVICE,
  heading,
  subheading,
  screenshotInput,
  fonts,
  accentColor,
  overrides = {},
}) => {
  if (!templateSchema) {
    throw new Error('Template schema is required for rendering');
  }

  const deviceDefinition = getDeviceDefinition(templateSchema, device);
  const canvas = createCanvas(deviceDefinition.width, deviceDefinition.height);
  const ctx = canvas.getContext('2d');

  ensureTemplateFonts(templateSchema, fonts);
  applyBackground(ctx, deviceDefinition.background || templateSchema.canvas?.background, deviceDefinition.width, deviceDefinition.height, accentColor, overrides);

  const renderContext = {
    ctx,
    canvas,
    width: deviceDefinition.width,
    height: deviceDefinition.height,
    accentColor,
    heading,
    subheading,
    screenshotInput,
    device,
    fonts,
    overrides,
  };

  for (const layer of templateSchema.layers || []) {
    await renderLayer(ctx, layer, renderContext);
  }

  return { canvas };
};

module.exports = {
  renderTemplateToCanvas,
  generateMockupCanvas,
  ensureFontRegistered,
  lightenColor,
  darkenColor,
  FONT_MAPPING,
};
