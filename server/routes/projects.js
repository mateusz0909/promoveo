const express = require('express');
const { requireAuth } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', requireAuth, projectController.getAllProjects);

// Get a specific project by ID
router.get('/:id', requireAuth, projectController.getProject);

// Update a project
router.put('/:id', requireAuth, projectController.updateProject);

// Delete a project
router.delete('/:id', requireAuth, projectController.deleteProject);

// Download landing page
router.get('/:id/landing-page', requireAuth, projectController.downloadLandingPage);

// Update project ASO content
router.put('/:id/content', requireAuth, projectController.updateProjectContent);

// Update project image (legacy endpoint)
router.post('/:projectId/images/:imageId', requireAuth, upload.single('image'), projectController.updateProjectImage);

// Save project (legacy endpoint)
router.post('/save-legacy', requireAuth, projectController.saveProject);

module.exports = router;