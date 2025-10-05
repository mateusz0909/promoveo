const { prisma } = require('../lib/clients');
const { uploadImageToSupabase, deleteProjectAsset } = require('../services/storageService');
const sharp = require('sharp');

const visualsController = {
  // Upload a new visual/image asset
  async uploadVisual(req, res) {
    const { name, category } = req.body;
    const userId = req.user.id;
    const file = req.file;

    console.log('uploadVisual: Starting', { userId, name, category, hasFile: !!file });

    if (!file) {
      console.error('uploadVisual: No file provided');
      return res.status(400).json({ error: 'Image file is required' });
    }

    try {
      const imageBuffer = file.buffer;
      console.log('uploadVisual: File buffer received, size:', imageBuffer.length);

      // Get image dimensions using sharp
      let width, height;
      try {
        const metadata = await sharp(imageBuffer).metadata();
        width = metadata.width;
        height = metadata.height;
        console.log('uploadVisual: Image dimensions extracted', { width, height });
      } catch (error) {
        console.warn('uploadVisual: Failed to extract dimensions, using defaults', error);
        // Fallback to defaults if dimension extraction fails
        width = null;
        height = null;
      }

      // Upload to Supabase
      const visualUrl = await uploadImageToSupabase(
        imageBuffer,
        `visual-${Date.now()}-${file.originalname}`,
        file.mimetype,
        userId
      );

      console.log('uploadVisual: Upload successful', { visualUrl });

      // Create visual record (user-level, not project-level)
      const visual = await prisma.visual.create({
        data: {
          userId,  // Changed from projectId to userId
          name: name || file.originalname,
          category: category || 'custom',
          imageUrl: visualUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          width,
          height,
        }
      });

      console.log('uploadVisual: Visual created successfully', { id: visual.id });

      res.status(201).json(visual);
    } catch (error) {
      console.error('uploadVisual: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to upload visual' });
    }
  },

    // Get all visuals for a user
  async getProjectVisuals(req, res) {
    const userId = req.user.id;

    try {
      console.log('getProjectVisuals: Fetching visuals for user', userId);

      // Fetch all visuals for this user (not project-specific anymore)
      const visuals = await prisma.visual.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`getProjectVisuals: Found ${visuals.length} visuals`);
      res.status(200).json(visuals);
    } catch (error) {
      console.error('getProjectVisuals: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to fetch visuals' });
    }
  },

  // Delete a visual
  async deleteVisual(req, res) {
    const { visualId } = req.params;
    const userId = req.user.id;

    try {
      console.log('deleteVisual: Deleting visual', { visualId, userId });

      // Verify visual belongs to user
      const visual = await prisma.visual.findFirst({
        where: {
          id: visualId,
          userId  // Changed from project check to user check
        }
      });

      if (!visual) {
        console.log('deleteVisual: Visual not found or unauthorized');
        return res.status(404).json({ error: 'Visual not found or unauthorized' });
      }

      // Delete from Supabase Storage
      await deleteProjectAsset(visual.imageUrl);

      // Delete from database
      await prisma.visual.delete({
        where: { id: visualId }
      });

      console.log('deleteVisual: Visual deleted successfully');
      res.status(200).json({ message: 'Visual deleted successfully' });
    } catch (error) {
      console.error('deleteVisual: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to delete visual' });
    }
  },

  // Add visual to a specific screenshot
  async addVisualToScreenshot(req, res) {
    const { projectId, imageId } = req.params;
    const { visualId, position, scale, rotation } = req.body;
    const userId = req.user.id;

    try {
      console.log('addVisualToScreenshot: Adding visual to screenshot', {
        projectId,
        imageId,
        visualId
      });

      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: { id: projectId, userId }
        }
      });

      if (!image) {
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      // Verify visual belongs to the user (changed from project check to user check)
      const visual = await prisma.visual.findFirst({
        where: {
          id: visualId,
          userId  // Changed from projectId to userId
        }
      });

      if (!visual) {
        return res.status(404).json({ error: 'Visual not found' });
      }

      // Get current configuration
      const config = image.configuration || {};
      const visuals = config.visuals || [];

      // Add new visual with actual dimensions
      const newVisual = {
        id: `visual-${Date.now()}`,
        visualId,
        imageUrl: visual.imageUrl,
        name: visual.name,
        width: visual.width || 300,  // Use actual width or default to 300
        height: visual.height || 300, // Use actual height or default to 300
        position: position || { x: 0, y: 0 },
        scale: scale || 1,
        rotation: rotation || 0,
        zIndex: visuals.length,
      };

      visuals.push(newVisual);

      // Update configuration
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          configuration: {
            ...config,
            visuals
          }
        }
      });

      console.log('addVisualToScreenshot: Visual added successfully');
      res.status(200).json({ success: true, visual: newVisual });
    } catch (error) {
      console.error('addVisualToScreenshot: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to add visual to screenshot' });
    }
  },

  // Update visual transform on screenshot
  async updateVisualTransform(req, res) {
    const { projectId, imageId, visualInstanceId } = req.params;
    const { position, scale, rotation } = req.body;
    const userId = req.user.id;

    try {
      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: { id: projectId, userId }
        }
      });

      if (!image) {
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      const config = image.configuration || {};
      const visuals = config.visuals || [];

      // Find and update the visual
      const visualIndex = visuals.findIndex(v => v.id === visualInstanceId);
      if (visualIndex === -1) {
        return res.status(404).json({ error: 'Visual instance not found' });
      }

      if (position) visuals[visualIndex].position = position;
      if (scale !== undefined) visuals[visualIndex].scale = scale;
      if (rotation !== undefined) visuals[visualIndex].rotation = rotation;

      // Update configuration
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          configuration: {
            ...config,
            visuals
          }
        }
      });

      res.status(200).json({ success: true, visual: visuals[visualIndex] });
    } catch (error) {
      console.error('updateVisualTransform: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to update visual' });
    }
  },

  // Remove visual from screenshot
  async removeVisualFromScreenshot(req, res) {
    const { projectId, imageId, visualInstanceId } = req.params;
    const userId = req.user.id;

    try {
      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: { id: projectId, userId }
        }
      });

      if (!image) {
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      const config = image.configuration || {};
      const visuals = (config.visuals || []).filter(v => v.id !== visualInstanceId);

      // Update configuration
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          configuration: {
            ...config,
            visuals
          }
        }
      });

      res.status(200).json({ success: true, message: 'Visual removed' });
    } catch (error) {
      console.error('removeVisualFromScreenshot: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to remove visual' });
    }
  }
};

module.exports = visualsController;
