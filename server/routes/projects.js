const express = require('express');
const { requireAuth } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const visualsController = require('../controllers/visualsController');
const instancesController = require('../controllers/instancesController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', requireAuth, projectController.getAllProjects);

// ========== TEXT INSTANCE ROUTES (must come BEFORE /:id to avoid conflicts) ==========
// Add text instance to screenshot
router.post('/:projectId/images/:imageId/text', requireAuth, instancesController.addTextToScreenshot);

// Update text instance
router.put('/:projectId/images/:imageId/text/:textInstanceId', requireAuth, instancesController.updateTextInstance);

// Remove text instance
router.delete('/:projectId/images/:imageId/text/:textInstanceId', requireAuth, instancesController.removeTextInstance);
// ========== END TEXT INSTANCE ROUTES ==========

// ========== MOCKUP INSTANCE ROUTES (must come BEFORE /:id to avoid conflicts) ==========
// Add mockup instance to screenshot
router.post('/:projectId/images/:imageId/mockups', requireAuth, instancesController.addMockupToScreenshot);

// Update mockup instance
router.put('/:projectId/images/:imageId/mockups/:mockupInstanceId', requireAuth, instancesController.updateMockupInstance);

// Remove mockup instance
router.delete('/:projectId/images/:imageId/mockups/:mockupInstanceId', requireAuth, instancesController.removeMockupInstance);
// ========== END MOCKUP INSTANCE ROUTES ==========

// ========== VISUAL INSTANCE ROUTES (must come BEFORE /:id to avoid conflicts) ==========
// Add visual to a screenshot
router.post('/:projectId/images/:imageId/visuals', requireAuth, visualsController.addVisualToScreenshot);

// Update visual transform on screenshot
router.patch('/:projectId/images/:imageId/visuals/:visualInstanceId', requireAuth, visualsController.updateVisualTransform);

// Remove visual from screenshot
router.delete('/:projectId/images/:imageId/visuals/:visualInstanceId', requireAuth, visualsController.removeVisualFromScreenshot);
// ========== END VISUAL INSTANCE ROUTES ==========

// Get a specific project by ID
router.get('/:id', requireAuth, projectController.getProject);

// Update a project
router.put('/:id', requireAuth, projectController.updateProject);

// Delete a project
router.delete('/:id', requireAuth, projectController.deleteProject);

// Landing page configuration & generation
router.get('/:id/landing-page', requireAuth, projectController.getLandingPageState);
router.post(
	'/:id/landing-page',
	requireAuth,
	upload.fields([{ name: 'logo', maxCount: 1 }]),
	projectController.generateLandingPagePackage
);

// Update project ASO content
router.put('/:id/content', requireAuth, projectController.updateProjectContent);

// Update image configuration (for studio editor)
router.put('/:projectId/images/:imageId', requireAuth, projectController.updateImageConfiguration);

// Screenshot management
router.post('/:projectId/images', requireAuth, projectController.createScreenshot);
router.delete('/:projectId/images/:imageId', requireAuth, projectController.deleteScreenshot);
router.patch('/:projectId/images/:imageId/order', requireAuth, projectController.updateDisplayOrder);

// Replace source screenshot
router.post('/:projectId/images/:imageId/replace-screenshot', requireAuth, upload.single('screenshot'), projectController.replaceSourceScreenshot);

module.exports = router;