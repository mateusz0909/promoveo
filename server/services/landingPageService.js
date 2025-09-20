const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { createZip } = require('./zipService');
const { downloadFileToTemp } = require('./storageService');
const { generateLandingPageContent } = require('./landingPageAIService');

const templateDir = path.join(__dirname, '..', 'assets', 'landing-page-template');
// Use the system's temporary directory to avoid nodemon restarts
const tempDir = path.join(os.tmpdir(), 'appstorefire');

/**
 * Generates a landing page package for a project.
 * @param {object} project - The project data.
 * @param {Array<object>} generatedImages - The generated images for the project.
 * @returns {string} The path to the generated zip file.
 */
async function generateLandingPage(project, generatedImages) {
  const templatePath = path.join(__dirname, '..', 'templates', 'landing-page.ejs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Generate AI content for the landing page
  const aiContent = await generateLandingPageContent(
    project.inputAppName,
    project.inputAppDescription,
    project.generatedAsoText
  );

  // Find a suitable screenshot
  const screenshot = generatedImages.find(img => img.generatedImageUrl)?.generatedImageUrl;

  const data = {
    appName: project.inputAppName,
    headline: aiContent.headline,
    subheadline: aiContent.subheadline,
    features: aiContent.features,
    callToAction: aiContent.callToAction,
    screenshotUrl: 'images/appmockup.png', // Placeholder for now
  };

  const renderedHtml = ejs.render(templateContent, data);

  const uniqueId = `landing-page-${project.id}-${Date.now()}`;
  const outputDir = path.join(tempDir, uniqueId);
  await fs.ensureDir(outputDir);

  // Copy all template assets to the output directory first
  await fs.copy(templateDir, outputDir);

  // Overwrite with the rendered HTML
  await fs.writeFile(path.join(outputDir, 'index.html'), renderedHtml);

  // If there's a screenshot, download it and replace the placeholder
  if (screenshot) {
    try {
      const tempScreenshotPath = await downloadFileToTemp(screenshot);
      const finalScreenshotPath = path.join(outputDir, 'images', 'appmockup.png');
      await fs.move(tempScreenshotPath, finalScreenshotPath, { overwrite: true });
    } catch (error) {
      console.error('Could not process screenshot for landing page:', error);
      // The placeholder from the template is already there, so no need for else block.
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
