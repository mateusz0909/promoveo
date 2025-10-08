// server/utils/cleanupService.js
const { supabase } = require('../lib/clients.js');
const { PrismaClient } = require('@prisma/client');

const BUCKET_NAME = 'project-assets';
const prisma = new PrismaClient();

/**
 * Cleanup old image versions that are no longer referenced in the database
 * This should be run periodically (e.g., daily via cron job)
 */
async function cleanupUnreferencedImages() {
  try {
    console.log('Starting cleanup of unreferenced images...');
    
    // Get all files from Supabase storage
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (error) {
      console.error('Error listing files from storage:', error);
      return;
    }

    // Get all currently referenced image URLs from database
    const generatedImages = await prisma.generatedImage.findMany({
      select: { sourceScreenshotUrl: true }
    });

    const referencedUrls = new Set(
      generatedImages
        .map(img => img.sourceScreenshotUrl)
        .filter(Boolean)
        .map(urlString => {
          const url = new URL(urlString);
          return url.pathname.split('/').slice(-1)[0];
        })
    );

    // Find orphaned files (versioned files that are no longer referenced)
    const filesToDelete = files.filter(file => {
      // Check if this is a versioned file (contains _v pattern)
      const isVersioned = /_v\d+\./.test(file.name);
      const isOrphaned = isVersioned && !referencedUrls.has(file.name);
      return isOrphaned;
    });

    if (filesToDelete.length === 0) {
      console.log('No orphaned files found.');
      return;
    }

    console.log(`Found ${filesToDelete.length} orphaned files to delete:`, 
                filesToDelete.map(f => f.name));

    // Delete orphaned files
    const filePaths = filesToDelete.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting orphaned files:', deleteError);
    } else {
      console.log(`Successfully deleted ${filesToDelete.length} orphaned files.`);
    }

  } catch (error) {
    console.error('Error during cleanup process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cleanup old versions of a specific image (keep only the latest N versions)
 * @param {string} baseImageName - The base name of the image (without version suffix)
 * @param {number} keepVersions - Number of versions to keep (default: 2)
 */
async function cleanupOldVersionsOfImage(baseImageName, keepVersions = 2) {
  try {
    // List all files that match the base name pattern
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (error) {
      console.error('Error listing files:', error);
      return;
    }

    // Filter files that belong to this image and extract version numbers
    const imageVersions = files
      .filter(file => file.name.includes(baseImageName))
      .map(file => {
        const match = file.name.match(/_v(\d+)\./);
        return {
          file,
          version: match ? parseInt(match[1]) : 0
        };
      })
      .sort((a, b) => b.version - a.version); // Sort by version descending

    // Keep only the latest N versions
    const versionsToDelete = imageVersions.slice(keepVersions);
    
    if (versionsToDelete.length > 0) {
      const filePaths = versionsToDelete.map(v => v.file.name);
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting old versions:', deleteError);
      } else {
        console.log(`Cleaned up ${versionsToDelete.length} old versions of ${baseImageName}`);
      }
    }

  } catch (error) {
    console.error('Error cleaning up old versions:', error);
  }
}

module.exports = {
  cleanupUnreferencedImages,
  cleanupOldVersionsOfImage
};