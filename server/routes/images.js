const express = require('express');
const { requireAuth } = require('../middleware/auth');
const imageController = require('../controllers/imageController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// Upload background image
router.post('/upload-background', requireAuth, upload.single('image'), imageController.uploadBackgroundImage);

// Generate image description using AI
router.post('/generate-description', upload.single('image'), imageController.generateImageDescription);

// Generate heading and subheading for an image using AI
router.post('/generate-heading-subheading', upload.single('image'), imageController.generateImageHeadingSubheading);

module.exports = router;