const path = require('path');
const fs = require('fs');
const { prisma } = require('../lib/clients');
const {
  replaceImageInSupabase,
  cleanupOldImageVersion,
  uploadProjectAsset,
  deleteProjectAsset,
  downloadFileToTemp,
} = require('../services/storageService');
const { generateLandingPage } = require('../services/landingPageService');

const projectController = {
  // Get all projects for the authenticated user
  async getAllProjects(req, res) {
    try {
      console.log('get-all-projects: Received request');
      const userId = req.user.id;
      
      // Extract query parameters for filtering and pagination
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const sortBy = req.query.sortBy || 'createdAt';
      const order = req.query.order || 'desc';

      // Validate sortBy field
      const allowedSortFields = ['createdAt', 'updatedAt', 'name'];
      const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      
      // Validate order
      const finalOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

      console.log(`get-all-projects: Fetching projects with limit=${limit}, sortBy=${finalSortBy}, order=${finalOrder}`);

      const queryOptions = {
        where: { userId },
        orderBy: { [finalSortBy]: finalOrder }
      };

      // Add limit if specified
      if (limit && limit > 0) {
        queryOptions.take = limit;
      }

      const projects = await prisma.project.findMany(queryOptions);

      console.log(`get-all-projects: Found ${projects.length} projects for user ${userId}`);
      res.status(200).json(projects);

    } catch (error) {
      console.error('Error in get-all-projects:', error);
      res.status(500).json({ error: 'Error fetching projects' });
    }
  },

  // Get a specific project by ID
  async getProject(req, res) {
    try {
      console.log('get-project: Received request');
      const { id } = req.params;
      const userId = req.user.id;

      const project = await prisma.project.findFirst({
        where: { id, userId },
        include: {
          generatedImages: {
            orderBy: {
              displayOrder: 'asc'
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log('get-project: Project found successfully');
      res.status(200).json(project);

    } catch (error) {
      console.error('Error in get-project:', error);
      res.status(500).json({ error: 'Error fetching project' });
    }
  },

  // Update a project
  async updateProject(req, res) {
    try {
      console.log('update-project: Received request');
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // If inputAppName is being updated, also update the name field for consistency
      if (updateData.inputAppName) {
        updateData.name = updateData.inputAppName;
      }

      // Ensure user owns the project
      const existingProject = await prisma.project.findFirst({
        where: { id, userId }
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log('update-project: Updating project in database');
      const updatedProject = await prisma.project.update({
        where: { id },
        data: updateData
      });

      console.log('update-project: Project updated successfully');
      res.json({ 
        message: 'Project updated successfully', 
        project: updatedProject 
      });

    } catch (error) {
      console.error('Error in update-project:', error);
      res.status(500).json({ error: 'Error updating project' });
    }
  },

  // Delete a project
  async deleteProject(req, res) {
    try {
      console.log('delete-project: Received request');
      const { id } = req.params;
      const userId = req.user.id;

      // Ensure user owns the project
      const existingProject = await prisma.project.findFirst({
        where: { id, userId }
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log('delete-project: Deleting project from database');
      await prisma.project.delete({
        where: { id }
      });

      // TODO: Clean up associated files from Supabase storage

      console.log('delete-project: Project deleted successfully');
      res.json({ message: 'Project deleted successfully' });

    } catch (error) {
      console.error('Error in delete-project:', error);
      res.status(500).json({ error: 'Error deleting project' });
    }
  },

  // Update project ASO content
  async updateProjectContent(req, res) {
    try {
      console.log('update-project-content: Received request');
      const { id } = req.params;
      const userId = req.user.id;
      const { generatedAsoText } = req.body;

      if (!generatedAsoText) {
        return res.status(400).json({ error: 'Missing generatedAsoText' });
      }

      // Ensure user owns the project
      const existingProject = await prisma.project.findFirst({
        where: { id, userId }
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      console.log('update-project-content: Updating project ASO content');
      const updatedProject = await prisma.project.update({
        where: { id },
        data: { generatedAsoText }
      });

      console.log('update-project-content: Project content updated successfully');
      res.json({ 
        message: 'Project content updated successfully', 
        project: updatedProject 
      });

    } catch (error) {
      console.error('Error in update-project-content:', error);
      res.status(500).json({ error: 'Error updating project content' });
    }
  },

  // Update project image (legacy endpoint)
  async updateProjectImage(req, res) {
    const { projectId, imageId } = req.params;
    const { configuration } = req.body;
    const file = req.file;

    console.log('updateProjectImage: Starting', { projectId, imageId, hasFile: !!file, hasConfig: !!configuration });

    if (!file) {
      console.error('updateProjectImage: No file provided');
      return res.status(400).json({ error: 'Image file is required.' });
    }

    try {
      // Multer is configured with memoryStorage, so file.buffer contains the image data
      const imageBuffer = file.buffer;
      console.log('updateProjectImage: File buffer received, size:', imageBuffer.length);

      console.log('updateProjectImage: Finding image in database');
      const generatedImage = await prisma.generatedImage.findUnique({
        where: { id: imageId },
      });

      if (!generatedImage) {
        console.error('updateProjectImage: Image not found in database');
        return res.status(404).json({ error: 'Image not found.' });
      }
      console.log('updateProjectImage: Image found in database');

      console.log('updateProjectImage: Uploading to Supabase');
      const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
        generatedImage.generatedImageUrl,
        imageBuffer,
        file.mimetype
      );
      console.log('updateProjectImage: Supabase upload successful', { newImageUrl });

      const parsedConfiguration = configuration ? JSON.parse(configuration) : generatedImage.configuration;
      console.log('updateProjectImage: Configuration parsed');

      console.log('updateProjectImage: Updating database');
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          generatedImageUrl: newImageUrl,
          configuration: parsedConfiguration,
        },
      });
      console.log('updateProjectImage: Database update successful');

      // Cleanup old version in background (non-blocking)
      setImmediate(() => {
        cleanupOldImageVersion(oldImagePath);
      });

      // No file cleanup needed with memoryStorage - buffer is automatically released

      console.log('updateProjectImage: Complete, returning success');
      res.status(200).json({ imageUrl: newImageUrl });
    } catch (error) {
      console.error('updateProjectImage: ERROR occurred');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to update image.' });
    }
  },

  // Update image configuration only (no image regeneration)
  async updateImageConfiguration(req, res) {
    const { projectId, imageId } = req.params;
    const { configuration, displayOrder } = req.body;
    const userId = req.user.id;

    try {
      console.log('updateImageConfiguration: Starting', { projectId, imageId, displayOrder });

      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: {
            id: projectId,
            userId: userId
          }
        }
      });

      if (!image) {
        console.error('updateImageConfiguration: Image not found or unauthorized');
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      // Update configuration JSON and displayOrder
      const updateData = { configuration };
      if (displayOrder !== undefined) {
        updateData.displayOrder = displayOrder;
      }

      const updatedImage = await prisma.generatedImage.update({
        where: { id: imageId },
        data: updateData
      });

      console.log('updateImageConfiguration: Configuration saved successfully');
      res.status(200).json({ 
        success: true,
        configuration: updatedImage.configuration 
      });
    } catch (error) {
      console.error('updateImageConfiguration: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to update configuration.' });
    }
  },

  // Replace source screenshot
  async replaceSourceScreenshot(req, res) {
    const { projectId, imageId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    console.log('replaceSourceScreenshot: Starting', { projectId, imageId, hasFile: !!file });

    if (!file) {
      console.error('replaceSourceScreenshot: No file provided');
      return res.status(400).json({ error: 'Screenshot file is required' });
    }

    try {
      const imageBuffer = file.buffer;
      console.log('replaceSourceScreenshot: File buffer received, size:', imageBuffer.length);

      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: {
            id: projectId,
            userId: userId
          }
        }
      });

      if (!image) {
        console.error('replaceSourceScreenshot: Image not found or unauthorized');
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      console.log('replaceSourceScreenshot: Uploading new screenshot to Supabase');
      
      // Replace source screenshot in Supabase
      const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
        image.sourceScreenshotUrl,
        imageBuffer,
        file.mimetype
      );
      
      console.log('replaceSourceScreenshot: Upload successful', { newImageUrl });

      // Update database with new source URL
      const updatedImage = await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          sourceScreenshotUrl: newImageUrl,
        },
      });

      console.log('replaceSourceScreenshot: Database updated successfully');

      // Cleanup old version in background
      setImmediate(() => {
        cleanupOldImageVersion(oldImagePath);
      });

      res.status(200).json({ 
        success: true,
        sourceScreenshotUrl: newImageUrl,
        message: 'Screenshot replaced successfully'
      });
    } catch (error) {
      console.error('replaceSourceScreenshot: ERROR occurred', error);
      res.status(500).json({ error: 'Failed to replace screenshot' });
    }
  },

  // Save project (legacy endpoint)
  async saveProject(req, res) {
    const { inputAppName, inputAppDescription, generatedAsoText, generatedImages } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    try {
      // Ensure the user exists in our public User table
      await prisma.user.upsert({
        where: { id: userId },
        update: { email: userEmail },
        create: { id: userId, email: userEmail },
      });

      const newProject = await prisma.project.create({
        data: {
          name: inputAppName, // Use inputAppName for consistency
          inputAppName,
          inputAppDescription,
          generatedAsoText,
          userId, // Link the project to the user
          generatedImages: {
            create: generatedImages.map(img => ({ // Assumes generatedImages is an array
              sourceScreenshotUrl: img.sourceUrl,
              generatedImageUrl: img.generatedUrl,
              configuration: img.configuration,
            })),
          },
        },
        include: {
          generatedImages: true, // Include the created images in the response
        },
      });

      res.status(201).json(newProject);
    } catch (error) {
      console.error("Failed to save project:", error);
      res.status(500).json({ error: "Could not save the project." });
    }
  },

  async getLandingPageState(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await prisma.project.findFirst({
        where: { id, userId },
        select: {
          landingPageConfig: true,
          landingPageZipUrl: true,
          landingPageZipUpdatedAt: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({
        config: project.landingPageConfig || null,
        downloadUrl: project.landingPageZipUrl || null,
        updatedAt: project.landingPageZipUpdatedAt || null,
      });
    } catch (error) {
      console.error('Error in get-landing-page-state:', error);
      res.status(500).json({ error: 'Error retrieving landing page data' });
    }
  },

  async generateLandingPagePackage(req, res) {
    try {
      console.log('generate-landing-page: Received request for project:', req.params.id);

      const projectId = req.params.id;
      const userId = req.user.id;

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
        include: {
          generatedImages: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const appStoreId = (req.body.appStoreId || '').trim();
      const selectedImageId = req.body.selectedImageId || '';

      if (!appStoreId) {
        return res.status(400).json({ error: 'App Store ID is required' });
      }

      if (!selectedImageId) {
        return res.status(400).json({ error: 'Selected image is required' });
      }

      const selectedImage = project.generatedImages.find((image) => image.id === selectedImageId);
      if (!selectedImage) {
        return res.status(400).json({ error: 'Selected image does not belong to this project' });
      }

      const existingConfig = project.landingPageConfig || {};
      let logoInfo = existingConfig.logo || null;
      let logoForGeneration = null;
      const existingLogoPath = logoInfo?.storagePath || null;

      const logoFiles = req.files && (req.files.logo || req.files['logo']);
      if (Array.isArray(logoFiles) && logoFiles.length > 0) {
        const file = logoFiles[0];
        const fileBuffer = fs.readFileSync(file.path);
        const extension = path.extname(file.originalname) || '';
        const normalizedExtension = extension.replace('.', '').toLowerCase() || 'png';
        const storageFileName = `logo.${normalizedExtension}`;

        const { publicUrl, path: storagePath } = await uploadProjectAsset(
          userId,
          project.id,
          storageFileName,
          fileBuffer,
          file.mimetype,
          {
            prefix: 'landing-pages',
            cacheControl: '604800',
            upsert: true,
          }
        );

        if (existingLogoPath && existingLogoPath !== storagePath) {
          await deleteProjectAsset(existingLogoPath).catch((error) => {
            console.warn('generate-landing-page: Failed to delete previous logo asset', error);
          });
        }

        logoInfo = {
          storagePath,
          publicUrl,
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };

        logoForGeneration = {
          originalname: file.originalname,
          buffer: fileBuffer,
        };

        fs.unlink(file.path, (error) => {
          if (error) {
            console.warn('generate-landing-page: Failed to clean up temp logo upload', error);
          }
        });
      } else if (logoInfo?.publicUrl) {
        try {
          const tempLogoPath = await downloadFileToTemp(logoInfo.publicUrl);
          const existingLogoBuffer = await fs.promises.readFile(tempLogoPath);
          await fs.promises.unlink(tempLogoPath).catch(() => {});

          logoForGeneration = {
            originalname: logoInfo.originalName || 'logo.png',
            buffer: existingLogoBuffer,
          };
        } catch (error) {
          console.warn('generate-landing-page: Failed to load existing logo from storage', error);
        }
      }

      const zipFilePath = await generateLandingPage(project, project.generatedImages, {
        appStoreId,
        selectedImage,
        logoFile: logoForGeneration,
      });

      const zipBuffer = await fs.promises.readFile(zipFilePath);

      const { publicUrl: zipUrl, path: zipStoragePath } = await uploadProjectAsset(
        userId,
        project.id,
        'landing-page.zip',
        zipBuffer,
        'application/zip',
        {
          prefix: 'landing-pages',
          cacheControl: '86400',
          upsert: true,
        }
      );

      await fs.promises.unlink(zipFilePath).catch((error) => {
        console.warn('generate-landing-page: Failed to remove temp zip file', error);
      });

      const landingPageConfig = {
        appStoreId,
        selectedImageId,
        logo: logoInfo,
      };

      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: {
          landingPageConfig,
          landingPageZipUrl: zipUrl,
          landingPageZipStoragePath: zipStoragePath,
          landingPageZipUpdatedAt: new Date(),
        },
        select: {
          landingPageConfig: true,
          landingPageZipUrl: true,
          landingPageZipUpdatedAt: true,
        },
      });

      return res.status(200).json({
        message: 'Landing page generated successfully',
        downloadUrl: updatedProject.landingPageZipUrl,
        updatedAt: updatedProject.landingPageZipUpdatedAt,
        config: updatedProject.landingPageConfig,
        appStoreUrl: `https://apps.apple.com/app/id${appStoreId}`,
      });
    } catch (error) {
      console.error('Error in generate-landing-page:', error);
      res.status(500).json({ error: 'Error generating landing page' });
    }
  },

  // Create a new screenshot with placeholder image
  async createScreenshot(req, res) {
    const { projectId } = req.params;
    const { displayOrder } = req.body;
    const userId = req.user.id;

    try {
      console.log(`create-screenshot: Creating App Store image for project ${projectId}`);

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        include: {
          generatedImages: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!project) {
        console.log('create-screenshot: Project not found or unauthorized');
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check maximum screenshots limit
      if (project.generatedImages.length >= 10) {
        console.log('create-screenshot: Maximum 10 App Store images reached');
        return res.status(400).json({ error: 'Maximum 10 App Store images allowed per project' });
      }

      // Generate placeholder image
      const { generatePlaceholderImage } = require('../services/placeholderImageService');
      const { uploadImageToSupabase } = require('../services/storageService');

      const placeholderBuffer = await generatePlaceholderImage({
        width: 1200,
        height: 2600,
        text: 'New Screenshot',
        device: project.device || 'iPhone 15 Pro'
      });

      // Upload placeholder to Supabase Storage
      const timestamp = Date.now();
      const sourceFileName = `placeholder-source-${timestamp}.png`;
      const generatedFileName = `placeholder-generated-${timestamp}.png`;

      console.log('create-screenshot: Uploading placeholder images to Supabase');

      const sourceUrl = await uploadImageToSupabase(
        placeholderBuffer,
        sourceFileName,
        'image/png',
        userId
      );

      const generatedUrl = await uploadImageToSupabase(
        placeholderBuffer,
        generatedFileName,
        'image/png',
        userId
      );

      // Determine display order
      const finalDisplayOrder = displayOrder !== undefined 
        ? displayOrder 
        : project.generatedImages.length;

      // Create database record with default configuration
      const newImage = await prisma.generatedImage.create({
        data: {
          projectId,
          sourceScreenshotUrl: sourceUrl,
          generatedImageUrl: generatedUrl,
          accentColor: '#667eea',
          displayOrder: finalDisplayOrder,
          configuration: {
            heading: 'Tap to edit heading',
            subheading: 'Tap to edit subheading',
            headingFont: 'Inter',
            headingFontSize: 64,
            subheadingFontSize: 32,
            mockupX: 0,
            mockupY: 0,
            mockupScale: 1,
            mockupRotation: 0,
            headingX: 100,
            headingY: 100,
            subheadingX: 100,
            subheadingY: 300,
            headingColor: '#000000',
            subheadingColor: '#666666',
            headingAlign: 'left',
            subheadingAlign: 'left',
            headingLetterSpacing: 0,
            subheadingLetterSpacing: 0,
            headingLineHeight: 1.2,
            subheadingLineHeight: 1.4,
            theme: 'light',
            deviceFrame: project.device || 'iPhone 15 Pro',
            backgroundType: 'gradient',
            backgroundGradient: {
              startColor: '#667eea',
              endColor: '#764ba2',
              angle: 135
            }
          }
        }
      });

      console.log(`create-screenshot: Screenshot created successfully with ID ${newImage.id}`);
      res.status(201).json(newImage);

    } catch (error) {
      console.error('Error in create-screenshot:', error);
      res.status(500).json({ error: 'Failed to create screenshot' });
    }
  },

  // Delete a screenshot
  async deleteScreenshot(req, res) {
    const { projectId, imageId } = req.params;
    const userId = req.user.id;

    try {
      console.log(`delete-screenshot: Deleting image ${imageId} from project ${projectId}`);

      // Verify image belongs to user's project
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: { id: projectId, userId }
        },
        include: {
          project: {
            include: {
              generatedImages: true
            }
          }
        }
      });

      if (!image) {
        console.log('delete-screenshot: Image not found or unauthorized');
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      // Check minimum screenshot requirement
      if (image.project.generatedImages.length <= 1) {
        console.log('delete-screenshot: Cannot delete last App Store image');
        return res.status(400).json({ 
          error: 'Cannot delete last App Store image. At least one image is required.' 
        });
      }

      // Delete from Supabase Storage
      console.log('delete-screenshot: Deleting images from Supabase Storage');
      await Promise.allSettled([
        deleteProjectAsset(image.sourceScreenshotUrl),
        deleteProjectAsset(image.generatedImageUrl)
      ]);

      // Delete from database
      await prisma.generatedImage.delete({
        where: { id: imageId }
      });

      console.log('delete-screenshot: Screenshot deleted successfully');
      res.status(200).json({ message: 'Screenshot deleted successfully' });

    } catch (error) {
      console.error('Error in delete-screenshot:', error);
      res.status(500).json({ error: 'Failed to delete screenshot' });
    }
  },

  // Update screenshot display order
  async updateDisplayOrder(req, res) {
    const { projectId, imageId } = req.params;
    const { displayOrder } = req.body;
    const userId = req.user.id;

    try {
      console.log(`update-display-order: Updating order for image ${imageId} to ${displayOrder}`);

      // Validate displayOrder
      if (typeof displayOrder !== 'number' || displayOrder < 0) {
        return res.status(400).json({ error: 'Invalid display order' });
      }

      // Verify ownership
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          project: { id: projectId, userId }
        }
      });

      if (!image) {
        console.log('update-display-order: Image not found or unauthorized');
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }

      // Update display order
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: { displayOrder }
      });

      console.log('update-display-order: Display order updated successfully');
      res.status(200).json({ message: 'Display order updated successfully' });

    } catch (error) {
      console.error('Error in update-display-order:', error);
      res.status(500).json({ error: 'Failed to update display order' });
    }
  }
};

module.exports = projectController;