const express = require('express');
const { requireAuth } = require('../middleware/auth');
const imageController = require('../controllers/imageController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// Regenerate a single image
router.post('/regenerate-image', requireAuth, imageController.regenerateImage);

// Update image configuration and regenerate
router.put('/update-image-config', requireAuth, imageController.updateImageConfig);

// Download generated images as ZIP
router.get('/download/:projectId', requireAuth, imageController.downloadImages);

// Generate image description using AI
router.post('/generate-description', upload.single('image'), imageController.generateImageDescription);

// Generate heading and subheading for an image using AI
router.post('/generate-heading-subheading', upload.single('image'), imageController.generateImageHeadingSubheading);

// Legacy ZIP download endpoint
router.post('/download-zip', imageController.downloadImagesZip);

// Legacy regenerate images endpoint
router.post('/regenerate-legacy', requireAuth, imageController.regenerateImages);

module.exports = router;