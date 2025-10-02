const imageGenerationService = require('../services/imageGenerationService');
const { uploadImageToSupabase, getSignedUrlFromSupabase, replaceImageInSupabase, cleanupOldImageVersion } = require('../services/storageService');
const imageDescriptionService = require('../services/imageDescriptionService');
const zipService = require('../services/zipService');
const { prisma } = require('../lib/clients');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const tmpService = require('../services/tmpService');

const imageController = {
  // Regenerate a single image
  async regenerateImage(req, res) {
    try {
      console.log('regenerate-image: Received request');
      const { heading, subheading, screenshotPath, device = 'iphone', font = {} } = req.body;

      if (!heading || !subheading || !screenshotPath) {
        return res.status(400).json({ 
          error: 'Missing required fields: heading, subheading, screenshotPath' 
        });
      }

      console.log('regenerate-image: Generating new image');
      const { imageBuffer } = await imageGenerationService.generateAppStoreImage(
        heading,
        subheading,
        screenshotPath,
        font.headingFont || 'Farro',
        font.subheadingFont || 'Headland One',
        font.headingFontSize || 120,
        font.subheadingFontSize || 69,
        device || 'iPhone'
      );

  const timestamp = Date.now();
  const outputFilename = `regenerated-${timestamp}.png`;
  const outputPath = tmpService.getTmpDirPath(outputFilename);

  await tmpService.ensureTmpDir();
  fs.writeFileSync(outputPath, imageBuffer);
      
      const imageUrl = `/static/${outputFilename}`;
      
      console.log('regenerate-image: Image regenerated successfully');
      res.json({ imageUrl });

    } catch (error) {
      console.error('Error in regenerate-image:', error);
      res.status(500).json({ error: 'Error regenerating image' });
    }
  },

  // Update image configuration and regenerate
  async updateImageConfig(req, res) {
    try {
      console.log('update-image-config: Received request');
      const { projectId, imageIndex, updatedConfig } = req.body;
      const userId = req.user.id;

      if (!projectId || imageIndex === undefined || !updatedConfig) {
        return res.status(400).json({ 
          error: 'Missing required fields: projectId, imageIndex, updatedConfig' 
        });
      }

      console.log('update-image-config: Fetching project from database');
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const images = project.generatedImages;
      if (imageIndex >= images.length) {
        return res.status(400).json({ error: 'Invalid image index' });
      }

      console.log('update-image-config: Generating new image with updated configuration');
      // Get the original screenshot from Supabase
      const originalImageUrl = images[imageIndex].sourceScreenshotUrl;
      const signedUrl = await getSignedUrlFromSupabase(originalImageUrl);
      
      // Download the original screenshot buffer
      const response = await fetch(signedUrl);
      const screenshotBuffer = await response.arrayBuffer();

      // Generate new image with updated configuration
      const { imageBuffer: newImageBuffer } = await imageGenerationService.generateAppStoreImage(
        updatedConfig.heading,
        updatedConfig.subheading,
        Buffer.from(screenshotBuffer),
        updatedConfig.headingFont || 'Farro',
        updatedConfig.subheadingFont || 'Headland One',
        updatedConfig.headingFontSize || 120,
        updatedConfig.subheadingFontSize || 69,
        project.device || 'iPhone',
        {
          layout: updatedConfig.layout || 'text-top'
        }
      );

      console.log('update-image-config: Uploading new image to Supabase');
      // Upload new generated image to Supabase (with versioning)
      const timestamp = Date.now();
      const newImageFilename = `generated_${originalImageUrl.split('/').pop().replace(/\.[^/.]+$/, "")}_v${timestamp}.png`;
      
      const newGeneratedImageUrl = await uploadImageToSupabase(
        newImageBuffer,
        newImageFilename,
        'image/png',
        userId
      );

      console.log('update-image-config: Updating project in database');
      // Update the project in database
      const updatedImages = [...images];
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        generatedImageUrl: newGeneratedImageUrl,
        configuration: updatedConfig
      };

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { generatedImages: updatedImages }
      });

      console.log('update-image-config: Image configuration updated successfully');
      res.json({ 
        message: 'Image updated successfully', 
        updatedImage: updatedImages[imageIndex],
        project: updatedProject
      });

    } catch (error) {
      console.error('Error in update-image-config:', error);
      res.status(500).json({ error: 'Error updating image configuration' });
    }
  },

  // Download generated images as ZIP
  async downloadImages(req, res) {
    try {
      console.log('download-images: Received request');
      const { projectId } = req.params;
      const userId = req.user.id;

      console.log('download-images: Fetching project');
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log('download-images: Creating ZIP file');
      const zipService = require('../services/zipService');
      const zipBuffer = await zipService.createImagesZip(project);

      console.log('download-images: Sending ZIP file');
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name || 'images'}.zip"`
      });
      
      res.send(zipBuffer);

    } catch (error) {
      console.error('Error in download-images:', error);
      res.status(500).json({ error: 'Error creating download' });
    }
  },

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
      console.error("Error in generateImageDescription:", error);
      res.status(500).json({ error: "Error generating image description" });
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
      console.error("Error in generateImageHeadingSubheading:", error);
      res.status(500).json({ error: "Error generating heading and subheading" });
    } finally {
      if (shouldCleanupTempFile && tempFilePath) {
        await tmpService.removeEntry(tempFilePath);
      } else if (file?.path) {
        await tmpService.removeEntry(file.path);
      }
    }
  },

  // Legacy ZIP download endpoint
  async downloadImagesZip(req, res) {
    console.log('Received request to downloadImagesZip');
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'No image URLs provided' });
    }

    const downloadDir = tmpService.getTmpDirPath(`zip_downloads_${Date.now()}`);
    const downloadedImagePaths = [];
    let zipFilePath;

    try {
      fs.mkdirSync(downloadDir, { recursive: true });

      for (const imageUrl of imageUrls) {
        const filename = path.basename(new URL(imageUrl, `http://localhost:${process.env.PORT || 3001}`).pathname);
        const localPath = path.join(downloadDir, filename);
        const response = await axios({
          method: 'get',
          url: new URL(imageUrl, `http://localhost:${process.env.PORT || 3001}`).href,
          responseType: 'stream',
        });
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        downloadedImagePaths.push(localPath);
      }

      const zipFileName = `app_images_${Date.now()}.zip`;
      zipFilePath = tmpService.getTmpDirPath(zipFileName);

      await zipService.createZipArchive(downloadedImagePaths, zipFilePath);

      res.download(zipFilePath, zipFileName, (err) => {
        if (err) {
          console.error('Error sending zip file:', err);
          res.status(500).json({ error: 'Error sending zip file' });
        }
        // Clean up after download
        tmpService.removeEntry(zipFilePath).catch(cleanupError => {
          console.warn('Failed to remove zip file after download:', cleanupError);
        });
        tmpService.removeEntry(downloadDir).catch(cleanupError => {
          console.warn('Failed to remove download directory after download:', cleanupError);
        });
      });

    } catch (error) {
      console.error("Error in downloadImagesZip:", error);
      res.status(500).json({ error: "Error creating or downloading zip file" });
      const cleanupPromises = [tmpService.removeEntry(downloadDir)];
      if (zipFilePath) {
        cleanupPromises.push(tmpService.removeEntry(zipFilePath));
      }
      await Promise.allSettled(cleanupPromises);
    }
  },

  // Legacy regenerate images endpoint
  async regenerateImages(req, res) {
    console.log('Received request to regenerateImages');
    const { generatedImages, headings, headingFontFamily, subheadingFontFamily, headingFontSize, subheadingFontSize } = req.body;

    try {
      console.log('Step 1: Regenerating images...');
      const imageUrls = [];
      for (let i = 0; i < generatedImages.length; i++) {
        const { sourceScreenshotUrl, generatedImageUrl } = generatedImages[i];
        const heading = headings[i].heading;
        const subheading = headings[i].subheading;
        
        // Download the image from the URL
        const response = await axios.get(sourceScreenshotUrl, { responseType: 'arraybuffer' });
        const screenshotBuffer = Buffer.from(response.data, 'binary');

        console.log(`Generating App Store image ${i + 1} for URL ${sourceScreenshotUrl}`);
        const { imageBuffer } = await imageGenerationService.generateAppStoreImage(
          heading, 
          subheading, 
          screenshotBuffer, 
          headingFontFamily || 'Farro',
          subheadingFontFamily || 'Headland One',
          headingFontSize || 120,
          subheadingFontSize || 69,
          'iPhone'
        );
        
        // Replace the regenerated image in Supabase
        const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
          generatedImageUrl, 
          imageBuffer, 
          'image/jpeg'
        );

        // Cleanup old version in background (non-blocking)
        setImmediate(() => {
          cleanupOldImageVersion(oldImagePath);
        });

        imageUrls.push({ 
          generatedImageUrl: newImageUrl,
          sourceScreenshotUrl: sourceScreenshotUrl
        });
        console.log(`Image ${i + 1} regenerated and saved to ${newImageUrl}`);
      }
      console.log('Step 1 complete. Regenerated images.');

      console.log('Step 2: Sending response to client...');
      res.json({ images: imageUrls });
      console.log('Step 2 complete. Response sent.');

    } catch (error) {
      console.error("Error in regenerateImages:", error);
      res.status(500).json({ error: "Error regenerating images" });
    }
  }
};

module.exports = imageController;