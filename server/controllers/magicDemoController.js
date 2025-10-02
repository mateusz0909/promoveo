const imageGenerationService = require('../services/imageGenerationService');
const { generateImageHeadingSubheading } = require('../services/imageDescriptionService');
const tmpService = require('../services/tmpService');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { imageThemes } = require('../constants/themes');

// Predefined demo configurations for three different styles
// Text content will be AI-generated, these define visual styling only
const DEMO_CONFIGS = [
  {
    themeId: 'neon-gradient',
    headingFont: 'Montserrat',
    subheadingFont: 'Open Sans',
    headingFontSize: 110,
    subheadingFontSize: 65,
    style: 'concise', // For AI text generation style
  },
  {
    themeId: 'accent',
    headingFont: 'Farro',
    subheadingFont: 'Headland One',
    headingFontSize: 120,
    subheadingFontSize: 69,
    style: 'detailed', // For AI text generation style
  },
  {
    themeId: 'prism-burst',
    headingFont: 'Lato',
    subheadingFont: 'Inter',
    headingFontSize: 115,
    subheadingFontSize: 70,
    style: 'concise', // For AI text generation style
  },
];

const magicDemoController = {
  async processDemoImage(req, res) {
    try {
      console.log('magic-demo: Received demo request');

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Get the uploaded image buffer
      const uploadedBuffer = req.file.buffer;
      
      // Save the uploaded screenshot temporarily
      await tmpService.ensureTmpDir();
      const timestamp = Date.now();
      const screenshotFilename = `demo-screenshot-${timestamp}.png`;
      const screenshotPath = tmpService.getTmpDirPath(screenshotFilename);
      fs.writeFileSync(screenshotPath, uploadedBuffer);

      console.log('magic-demo: Analyzing screenshot with AI to generate content...');

      // Generate AI-powered heading and subheading based on screenshot content
      // Use a generic app context since this is a demo
      const aiContent = await generateImageHeadingSubheading(
        screenshotPath,
        'Your App', // Generic app name for demo
        'An amazing mobile application', // Generic description for demo
        null, // No current heading
        null, // No current subheading
        'detailed' // Style preference - generates fuller phrases and standalone benefit statements
      );

      console.log('magic-demo: AI generated content:', aiContent);
      console.log('magic-demo: Generating 3 demo variations (2 text-top, 1 text-bottom)');

      // Generate variations: first and third with text-top, middle with text-bottom
      const generatedImages = [];
      
      for (let i = 0; i < DEMO_CONFIGS.length; i++) {
        const config = DEMO_CONFIGS[i];
        const theme = imageThemes[config.themeId];
        // Middle image (index 1) uses text-bottom, others use text-top
        const layout = i === 1 ? 'text-bottom' : 'text-top';
        
        // For different variations, we could regenerate content with different styles
        // But to keep the demo fast, we'll use the same AI-generated content for all three
        let heading = aiContent.heading;
        let subheading = aiContent.subheading;

        // Optionally generate unique content for each variation based on style
        // Uncomment this if you want different text for each variation (slower but more diverse)
        /*
        if (i > 0) {
          const variationContent = await generateImageHeadingSubheading(
            screenshotPath,
            'Your App',
            'An amazing mobile application',
            null,
            null,
            config.style
          );
          heading = variationContent.heading;
          subheading = variationContent.subheading;
        }
        */
        
        try {
          const layoutLabel = layout === 'text-top' ? 'top' : 'bottom';
          console.log(`magic-demo: Generating variation ${i + 1}/3 - theme: ${config.themeId}, layout: ${layoutLabel}`);
          
          const generatedResult = await imageGenerationService.generateAppStoreImage(
            heading,
            subheading,
            uploadedBuffer,
            config.headingFont,
            config.subheadingFont,
            config.headingFontSize,
            config.subheadingFontSize,
            'iPhone',
            { addWatermark: true, theme, layout }
          );

          const processedBuffer = generatedResult.imageBuffer;

          // Save the generated image
          const outputFilename = `demo-result-${timestamp}-${i}.png`;
          const outputPath = tmpService.getTmpDirPath(outputFilename);
          fs.writeFileSync(outputPath, processedBuffer);

          // Return relative URL with metadata
          const imageUrl = `/static/${outputFilename}`;
          generatedImages.push({
            url: imageUrl,
            layout: layout,
            theme: config.themeId,
            style: i + 1,
            heading: heading,
            subheading: subheading
          });

          console.log(`magic-demo: Variation ${i + 1} (${layoutLabel}) generated successfully`);
        } catch (error) {
          console.error(`Error generating variation ${i + 1} (layout: ${layout}):`, error);
          // Continue with other variations even if one fails
        }
      }

      if (generatedImages.length === 0) {
        throw new Error('Failed to generate any demo images');
      }

      console.log(`magic-demo: Successfully generated ${generatedImages.length} variations`);

      res.json({
        images: generatedImages,
        message: `Generated ${generatedImages.length} professional variations`,
      });

    } catch (error) {
      console.error('Error processing demo image:', error);
      res.status(500).json({ 
        error: 'Failed to process image',
        details: error.message 
      });
    }
  },
};

module.exports = magicDemoController;

