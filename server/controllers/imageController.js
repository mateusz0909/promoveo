const { uploadImageToSupabase } = require('../services/storageService');
const imageDescriptionService = require('../services/imageDescriptionService');
const path = require('path');
const fs = require('fs');
const tmpService = require('../services/tmpService');

const imageController = {
  // Generate image description using AI
  async generateImageDescription(req, res) {
    console.log('Received request to generateImageDescription');
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Received file:', file.originalname);

    let tempFilePath = file.path;
    let shouldCleanupTempFile = false;

    try {
      if (!tempFilePath && file.buffer) {
        await tmpService.ensureTmpDir();
        const extension = path.extname(file.originalname || '') || '.png';
        const tempFilename = `image-desc-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
        tempFilePath = tmpService.getTmpDirPath(tempFilename);
        fs.writeFileSync(tempFilePath, file.buffer);
        shouldCleanupTempFile = true;
      }

      if (!tempFilePath) {
        console.error('generateImageDescription: Unable to determine file path for processing');
        return res.status(500).json({ error: 'Unable to process image upload' });
      }

      console.log('Generating image description with Gemini...');
      const result = await imageDescriptionService.generateImageDescription(tempFilePath);
      console.log('Image description generated:', result.description);
      res.json(result);
    } catch (error) {
      console.error('Error in generateImageDescription:', error);
      res.status(500).json({ error: 'Error generating image description' });
    } finally {
      if (shouldCleanupTempFile && tempFilePath) {
        await tmpService.removeEntry(tempFilePath);
      } else if (file?.path) {
        await tmpService.removeEntry(file.path);
      }
    }
  },

  // Generate heading and subheading for an image using AI
  async generateImageHeadingSubheading(req, res) {
    console.log('Received request to generateImageHeadingSubheading');
    const file = req.file;
    const { appName, appDescription, currentHeading, currentSubheading, style = 'concise' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!appName || !appDescription) {
      return res.status(400).json({ error: 'Missing required fields: appName, appDescription' });
    }

    console.log('Received file:', file.originalname);
    console.log('App context:', { appName, appDescription, currentHeading, currentSubheading, style });

    let tempFilePath = file.path;
    let shouldCleanupTempFile = false;

    try {
      if (!tempFilePath && file.buffer) {
        await tmpService.ensureTmpDir();
        const extension = path.extname(file.originalname || '') || '.png';
        const tempFilename = `image-caption-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
        tempFilePath = tmpService.getTmpDirPath(tempFilename);
        fs.writeFileSync(tempFilePath, file.buffer);
        shouldCleanupTempFile = true;
      }

      if (!tempFilePath) {
        console.error('generateImageHeadingSubheading: Unable to determine file path for processing');
        return res.status(500).json({ error: 'Unable to process image upload' });
      }

      console.log('Generating heading and subheading with Gemini (style:', style, ')...');
      const result = await imageDescriptionService.generateImageHeadingSubheading(
        tempFilePath,
        appName,
        appDescription,
        currentHeading,
        currentSubheading,
        style
      );
      console.log('Heading and subheading generated:', result);
      res.json(result);
    } catch (error) {
      console.error('Error in generateImageHeadingSubheading:', error);
      res.status(500).json({ error: 'Error generating heading and subheading' });
    } finally {
      if (shouldCleanupTempFile && tempFilePath) {
        await tmpService.removeEntry(tempFilePath);
      } else if (file?.path) {
        await tmpService.removeEntry(file.path);
      }
    }
  },

  async uploadBackgroundImage(req, res) {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      const imageUrl = await uploadImageToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId
      );

      return res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading background image:', error);
      return res.status(500).json({ error: 'Failed to upload background image' });
    }
  },
};

module.exports = imageController;