const express = require('express');
const { requireAuth } = require('../middleware/auth');
const visualsController = require('../controllers/visualsController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// All visual routes are user-level (not project-specific)

// Upload a visual for the authenticated user
router.post('/', requireAuth, upload.single('image'), visualsController.uploadVisual);

// Get all visuals for the authenticated user
router.get('/', requireAuth, visualsController.getProjectVisuals);

// Delete a visual
router.delete('/:visualId', requireAuth, visualsController.deleteVisual);

module.exports = router;
