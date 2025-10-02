const express = require('express');
const magicDemoController = require('../controllers/magicDemoController');
const upload = require('../services/fileUploadService');

const router = express.Router();

// Magic demo endpoint - no authentication required
router.post('/', upload.single('image'), magicDemoController.processDemoImage);

module.exports = router;
