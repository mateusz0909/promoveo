const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { createZip } = require('./zipService');
const { downloadFileToTemp } = require('./storageService');
const { generateLandingPageContent } = require('./landingPageAIService');
const { generateDeviceMockupBuffer } = require('./imageGenerationService');

const templateDir = path.join(__dirname, '..', 'templates', 'template_1');
// Use the system's temporary directory to avoid nodemon restarts
const tempDir = path.join(os.tmpdir(), 'appstorefire');

/**
 * Generates a landing page package for a project.
 * @param {object} project - The project data.
 * @param {Array<object>} generatedImages - The generated images for the project.
 * @param {object} customData - Custom form data (appStoreId, selectedImage, logoFile).
 * @returns {string} The path to the generated zip file.
 */
async function generateLandingPage(project, generatedImages, customData = {}) {
  // Use the new EJS template (landing-page.ejs) in template_1
  const templatePath = path.join(__dirname, '..', 'templates', 'landing-page.ejs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Generate AI content for the landing page
  const aiContent = await generateLandingPageContent(
    project.inputAppName,
    project.inputAppDescription,
    project.generatedAsoText,
    project.language // Pass the project language to the AI service
  );

  const selectedImage = customData.selectedImage || generatedImages?.[0];
  const candidateScreenshotUrl = selectedImage?.sourceScreenshotUrl || selectedImage?.generatedImageUrl || null;

  // Generate App Store URL if appStoreId is provided
  let appStoreUrl = '';
  if (customData.appStoreId) {
    appStoreUrl = `https://apps.apple.com/app/id${customData.appStoreId}`;
  }

  const data = {
    appName: project.inputAppName,
    headline: aiContent.headline,
    subheadline: aiContent.subheadline,
    aboutHeader: aiContent.aboutHeader,
    aboutDescription: aiContent.aboutDescription,
    featuresHeader: aiContent.featuresHeader,
    featuresDescription: aiContent.featuresDescription,
    features: aiContent.features,
    callToAction: aiContent.callToAction,
    staticText: aiContent.staticText,
    screenshotUrl: 'images/appmockup.png', // Will be replaced with actual image
    appStoreUrl: appStoreUrl,
    hasCustomLogo: !!customData.logoFile,
    logoFilename: null,
  };

  const renderedHtml = ejs.render(templateContent, data);

  const uniqueId = `landing-page-${project.id}-${Date.now()}`;
  const outputDir = path.join(tempDir, uniqueId);
  await fs.ensureDir(outputDir);

  // Copy all files from template_1 (including styles.css, script.js, etc.) to the output directory
  await fs.copy(templateDir, outputDir);

  // Overwrite with the rendered HTML
  await fs.writeFile(path.join(outputDir, 'index.html'), renderedHtml);

  const imagesDir = path.join(outputDir, 'images');
  await fs.ensureDir(imagesDir);

  if (candidateScreenshotUrl) {
    try {
      const tempScreenshotPath = await downloadFileToTemp(candidateScreenshotUrl);
      const screenshotBuffer = await fs.readFile(tempScreenshotPath);
      await fs.remove(tempScreenshotPath).catch(() => {});

      let mockupBuffer = screenshotBuffer;
      try {
        const deviceType = (project.device && project.device.toLowerCase().includes('ipad')) ? 'iPad' : 'iPhone';
        mockupBuffer = await generateDeviceMockupBuffer(screenshotBuffer, deviceType);
      } catch (mockupError) {
        console.error('Could not generate framed mockup, falling back to raw screenshot:', mockupError);
      }

      const finalScreenshotPath = path.join(imagesDir, 'appmockup.png');
      await fs.writeFile(finalScreenshotPath, mockupBuffer);
    } catch (error) {
      console.error('Could not process screenshot for landing page:', error);
    }
  }

  // If there's a custom logo, save it
  if (customData.logoFile) {
    try {
      const logoExtension = path.extname(customData.logoFile.originalname);
      const logoFilename = `logo${logoExtension}`;
      const logoPath = path.join(imagesDir, logoFilename);
      await fs.writeFile(logoPath, customData.logoFile.buffer);
      
      // Re-render the HTML with logo information
      const updatedData = { ...data, hasCustomLogo: true, logoFilename };
      const updatedHtml = ejs.render(templateContent, updatedData);
      await fs.writeFile(path.join(outputDir, 'index.html'), updatedHtml);
    } catch (error) {
      console.error('Could not process logo for landing page:', error);
    }
  }

  // Create a zip file
  const zipFilePath = path.join(tempDir, `${uniqueId}.zip`);
  await createZip(outputDir, zipFilePath);

  // Clean up the temporary directory
  await fs.remove(outputDir);

  return zipFilePath;
}

module.exports = { generateLandingPage };
