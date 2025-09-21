const imageGenerationService = require('../services/imageGenerationService');
const { uploadImageToSupabase, getSignedUrlFromSupabase, replaceImageInSupabase, cleanupOldImageVersion } = require('../services/storageService');
const imageDescriptionService = require('../services/imageDescriptionService');
const zipService = require('../services/zipService');
const { prisma } = require('../lib/clients');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
      const imageBuffer = await imageGenerationService.generateAppStoreImage(
        heading,
        subheading,
        screenshotPath,
        device,
        {
          headingFont: font.headingFont || 'Farro',
          subheadingFont: font.subheadingFont || 'Headland One',
          headingFontSize: font.headingFontSize || 120,
          subheadingFontSize: font.subheadingFontSize || 69,
        }
      );

      const timestamp = Date.now();
      const outputFilename = `regenerated-${timestamp}.png`;
      const outputPath = path.join('tmp', outputFilename);
      
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
      const newImageBuffer = await imageGenerationService.generateAppStoreImage(
        updatedConfig.heading,
        updatedConfig.subheading,
        Buffer.from(screenshotBuffer),
        project.device,
        updatedConfig.font
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

    try {
      console.log('Generating image description with Gemini...');
      const result = await imageDescriptionService.generateImageDescription(file.path);
      console.log('Image description generated:', result.description);
      res.json(result);
    } catch (error) {
      console.error("Error in generateImageDescription:", error);
      res.status(500).json({ error: "Error generating image description" });
    }
  },

  // Legacy ZIP download endpoint
  async downloadImagesZip(req, res) {
    console.log('Received request to downloadImagesZip');
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'No image URLs provided' });
    }

    const downloadDir = path.join(__dirname, '..', 'tmp', `zip_downloads_${Date.now()}`);
    const downloadedImagePaths = [];

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
      const zipFilePath = path.join(__dirname, '..', 'tmp', zipFileName);

      await zipService.createZipArchive(downloadedImagePaths, zipFilePath);

      res.download(zipFilePath, zipFileName, (err) => {
        if (err) {
          console.error('Error sending zip file:', err);
          res.status(500).json({ error: 'Error sending zip file' });
        }
        // Clean up after download
        fs.unlinkSync(zipFilePath);
        fs.rmSync(downloadDir, { recursive: true, force: true });
      });

    } catch (error) {
      console.error("Error in downloadImagesZip:", error);
      res.status(500).json({ error: "Error creating or downloading zip file" });
      fs.rmSync(downloadDir, { recursive: true, force: true }); // Clean up on error
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
        const imageBuffer = await imageGenerationService.generateAppStoreImage(
          heading, 
          subheading, 
          screenshotBuffer, 
          'iphone', // default device
          {
            headingFont: headingFontFamily,
            subheadingFont: subheadingFontFamily,
            headingFontSize,
            subheadingFontSize,
          }
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