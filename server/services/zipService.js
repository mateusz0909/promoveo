const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/clients');
const imageGenerationService = require('./imageGenerationService');
const { getSignedUrlFromSupabase } = require('./storageService');
const tmpService = require('./tmpService');

/**
 * Creates a zip archive from a list of image paths.
 * @param {string[]} imagePaths - An array of absolute paths to the images.
 * @param {string} outputFileName - The path for the output zip file.
 * @returns {Promise<string>} A promise that resolves with the path to the created zip file.
 */
const createZipArchive = (imagePaths, outputFileName) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFileName);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve(outputFileName);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    imagePaths.forEach((imagePath, index) => {
      archive.file(imagePath, { name: `image_${index + 1}.png` });
    });

    archive.finalize();
  });
};

/**
 * Creates a zip archive from a directory.
 * @param {string} sourceDir - The source directory to zip.
 * @param {string} outPath - The path for the output zip file.
 * @returns {Promise<void>}
 */
const createZip = (sourceDir, outPath) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};


/**
 * Creates a zip buffer with generated images for a project
 * Generates images on-demand from stored configuration
 * @param {Object} project - The project object from database
 * @returns {Promise<Buffer>} A promise that resolves with the zip buffer
 */
const createImagesZip = async (project) => {
  console.log('zipService: Creating images ZIP for project', project.id);
  
  const archiver = require('archiver');
  const axios = require('axios');
  
  // Create archive
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  // Collect chunks in memory
  const chunks = [];
  archive.on('data', (chunk) => chunks.push(chunk));
  
  // Wait for archive to finish
  const zipPromise = new Promise((resolve, reject) => {
    archive.on('end', () => {
      console.log('zipService: Archive finalized');
      resolve(Buffer.concat(chunks));
    });
    archive.on('error', reject);
  });

  // Get generated images from project
  const generatedImages = project.generatedImages || [];
  
  if (!generatedImages || generatedImages.length === 0) {
    console.log('zipService: No images to zip');
    archive.finalize();
    return zipPromise;
  }

  console.log(`zipService: Processing ${generatedImages.length} images`);

  // Generate and add each image to the archive
  for (let i = 0; i < generatedImages.length; i++) {
    const imageData = generatedImages[i];
    const config = imageData.configuration || {};
    
    try {
      console.log(`zipService: Generating image ${i + 1}/${generatedImages.length}`);
      console.log(`zipService: Configuration for image ${i + 1}:`, JSON.stringify({
        hasHeading: !!config.heading,
        hasSubheading: !!config.subheading,
        hasVisuals: !!(config.visuals && config.visuals.length > 0),
        visualsCount: config.visuals ? config.visuals.length : 0,
        layout: config.layout
      }));
      
      // Download the original screenshot
      const signedUrl = await getSignedUrlFromSupabase(imageData.sourceScreenshotUrl);
      const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
      const screenshotBuffer = Buffer.from(response.data);

      // Generate image with configuration (including visuals)
      const { imageBuffer } = await imageGenerationService.generateAppStoreImage(
        config.heading || 'App Screenshot',
        config.subheading || '',
        screenshotBuffer,
        config.headingFont || 'Farro',
        config.subheadingFont || 'Headland One',
        config.headingFontSize || 120,
        config.subheadingFontSize || 69,
        project.device || 'iPhone',
        {
          layout: config.layout || 'text-top',
          visuals: config.visuals || [] // Pass visuals to renderer
        }
      );

      // Add to archive
      archive.append(imageBuffer, { name: `image_${i + 1}.png` });
      console.log(`zipService: Added image ${i + 1} to archive`);
      
    } catch (error) {
      console.error(`zipService: Error generating image ${i + 1}:`, error);
      // Continue with other images even if one fails
    }
  }

  // Finalize archive
  archive.finalize();
  
  return zipPromise;
};


module.exports = {
  createZipArchive,
  createZip,
  createImagesZip,
};