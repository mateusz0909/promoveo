// server/services/storageService.js
const { supabase } = require('../lib/clients.js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const tmpService = require('./tmpService');
const tempDir = tmpService.getTmpDirPath();

const BUCKET_NAME = 'project-assets';

function buildProjectAssetPath(userId, projectId, fileName, prefix = 'landing-pages') {
  return `${prefix}/${userId}/${projectId}/${fileName}`;
}

/**
 * Uploads an image buffer to Supabase Storage.
 * @param {Buffer} fileBuffer - The image file as a buffer.
 * @param {string} originalName - The original name of the file for extension.
 * @param {string} mimetype - The mimetype of the file (e.g., 'image/png').
 * @param {string} userId - The ID of the user uploading the file to create a user-specific folder.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
async function uploadImageToSupabase(fileBuffer, originalName, mimetype, userId) {
  console.log(`StorageService: uploadImageToSupabase called with:`, {
    originalName,
    mimetype,
    userId,
    bufferSize: fileBuffer.length
  });
  
  const fileExtension = originalName.split('.').pop();
  
  // For generated images, use extension based on mimetype instead of filename
  let actualExtension = fileExtension;
  if (originalName.startsWith('generated_') && mimetype === 'image/png') {
    actualExtension = 'png';
  } else if (originalName.startsWith('generated_') && mimetype === 'image/jpeg') {
    actualExtension = 'jpg';
  }
  
  // Create a unique file path to prevent overwrites
  const filePath = `${userId}/${uuidv4()}.${actualExtension}`;
  console.log(`StorageService: generated filePath: ${filePath} (original extension: ${fileExtension}, actual: ${actualExtension}, mimetype: ${mimetype})`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      cacheControl: '31536000',
      upsert: false, // Do not overwrite existing files
    });

  if (error) {
    console.error('Error uploading file to Supabase:', error.message);
    throw new Error('Failed to upload file to Supabase Storage.');
  }

  console.log(`StorageService: upload successful, data:`, data);

  // Get the public URL of the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  const finalUrl = publicUrl.split('?')[0];
  console.log(`StorageService: generated public URL: ${finalUrl}`);
  
  return finalUrl;
}

/**
 * Replaces an image in Supabase Storage using immutable URLs.
 * @param {string} imageUrl - The public URL of the image to replace.
 * @param {Buffer} newFileBuffer - The new image file as a buffer.
 * @param {string} newMimetype - The mimetype of the new file.
 * @returns {Promise<{newImageUrl: string, oldImagePath: string}>} - The new public URL and old file path for cleanup.
 */
async function replaceImageInSupabase(imageUrl, newFileBuffer, newMimetype) {
  // Extract the file path from the URL
  const url = new URL(imageUrl);
  const pathSegments = url.pathname.split('/');
  const originalFilePath = pathSegments.slice(pathSegments.indexOf(BUCKET_NAME) + 1).join('/');

  // Generate new versioned file path
  const timestamp = Date.now();
  const pathParts = originalFilePath.split('/');
  const fileName = pathParts.pop();
  const fileNameParts = fileName.split('.');
  const extension = fileNameParts.pop();
  const baseName = fileNameParts.join('.');
  
  const newFileName = `${baseName}_v${timestamp}.${extension}`;
  const newFilePath = [...pathParts, newFileName].join('/');

  // Upload new version
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(newFilePath, newFileBuffer, {
      contentType: newMimetype,
      cacheControl: '31536000', // Long cache since URLs are immutable
      upsert: false, // Never overwrite
    });

  if (error) {
    console.error('Error uploading new version to Supabase:', error.message);
    throw new Error('Failed to upload new version to Supabase Storage.');
  }

  // Get the public URL for the new version
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    newImageUrl: publicUrl,
    oldImagePath: originalFilePath
  };
}

/**
 * Cleans up old image version from Supabase Storage.
 * @param {string} oldImagePath - The file path of the old version to delete.
 * @returns {Promise<void>}
 */
async function cleanupOldImageVersion(oldImagePath) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldImagePath]);

    if (error) {
      console.warn('Warning: Failed to cleanup old image version:', error.message);
      // Don't throw error - cleanup failure shouldn't break the main flow
    } else {
      console.log('Successfully cleaned up old image version:', oldImagePath);
    }
  } catch (error) {
    console.warn('Warning: Exception during old image cleanup:', error);
  }
}

/**
 * Downloads a file from a URL to a temporary directory.
 * @param {string} url - The URL of the file to download.
 * @returns {Promise<string>} The path to the temporary file.
 */
async function downloadFileToTemp(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure the temp directory exists
    await tmpService.ensureTmpDir();

    const fileName = path.basename(new URL(url).pathname);
    const tempFileName = `${uuidv4()}-${fileName}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    throw new Error('Failed to download file.');
  }
}
async function uploadProjectAsset(userId, projectId, fileName, fileBuffer, mimetype, options = {}) {
  const { prefix = 'landing-pages', cacheControl = '3600', upsert = true } = options;
  const filePath = buildProjectAssetPath(userId, projectId, fileName, prefix);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      cacheControl,
      upsert,
    });

  if (error) {
    console.error('Error uploading project asset to Supabase:', error.message);
    throw new Error('Failed to upload project asset to Supabase Storage.');
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    publicUrl: publicUrl.split('?')[0],
    path: filePath,
  };
}

async function deleteProjectAsset(filePath) {
  if (!filePath) return;
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.warn('Warning: Failed to delete project asset:', filePath, error.message);
    }
  } catch (error) {
    console.warn('Warning: Exception during project asset deletion:', error);
  }
}

module.exports = {
  uploadImageToSupabase,
  replaceImageInSupabase,
  cleanupOldImageVersion,
  downloadFileToTemp,
  buildProjectAssetPath,
  uploadProjectAsset,
  deleteProjectAsset,
};
