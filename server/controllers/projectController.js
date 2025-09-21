const { prisma } = require('../lib/clients');
const { replaceImageInSupabase, cleanupOldImageVersion } = require('../services/storageService');
const { generateLandingPage } = require('../services/landingPageService');
const { createZipArchive } = require('../services/zipService');
const fs = require('fs');

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
          generatedImages: true
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

  async downloadLandingPage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await prisma.project.findFirst({
        where: { id, userId },
        include: {
          generatedImages: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const zipFilePath = await generateLandingPage(project, project.generatedImages);

      res.download(zipFilePath, `${project.inputAppName}-landing-page.zip`, (err) => {
        if (err) {
          console.error('Error sending landing page zip:', err);
        }
        // Cleanup the zip file
        fs.unlink(zipFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting landing page zip file:', unlinkErr);
          }
        });
      });
    } catch (error) {
      console.error('Error generating landing page:', error);
      res.status(500).json({ error: 'Error generating landing page' });
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

    if (!file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }

    try {
      const imageBuffer = fs.readFileSync(file.path);

      const generatedImage = await prisma.generatedImage.findUnique({
        where: { id: imageId },
      });

      if (!generatedImage) {
        return res.status(404).json({ error: 'Image not found.' });
      }

      const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
        generatedImage.generatedImageUrl,
        imageBuffer,
        file.mimetype
      );

      const parsedConfiguration = configuration ? JSON.parse(configuration) : generatedImage.configuration;

      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          generatedImageUrl: newImageUrl,
          configuration: parsedConfiguration,
        },
      });

      // Cleanup old version in background (non-blocking)
      setImmediate(() => {
        cleanupOldImageVersion(oldImagePath);
      });

      fs.unlinkSync(file.path);

      res.status(200).json({ imageUrl: newImageUrl });
    } catch (error) {
      console.error('Error updating image:', error);
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(500).json({ error: 'Failed to update image.' });
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
  }
};

module.exports = projectController;