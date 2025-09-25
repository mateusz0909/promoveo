const express = require('express');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const contentController = require('../controllers/contentController');
const imageController = require('../controllers/imageController');
const fs = require('fs');
const path = require('path');
const tmpService = require('../services/tmpService');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

tmpService.ensureTmpDirSync();
const diskUpload = multer({ dest: tmpService.getTmpDirPath() });

const router = express.Router();

// Legacy endpoint for generating content
router.post('/generate-content', diskUpload.array('screenshots', 10), contentController.generateContent);

// Main endpoint for generating content and saving project
router.post('/generate-and-save', requireAuth, upload.array('screenshots', 10), contentController.generateAndSave);

// Regenerate content with AI (full regeneration)
router.post('/regenerate-with-ai', requireAuth, contentController.regenerateWithAI);

// Regenerate individual content part (focused regeneration)
router.post('/regenerate-content-part', requireAuth, contentController.regenerateContentPart);

// Legacy regenerate with AI endpoint  
router.post('/regenerate-with-ai-legacy', requireAuth, contentController.regenerateWithAILegacy);

// Download generated images as ZIP
router.post('/download-images-zip', imageController.downloadImagesZip);

// Get available fonts
router.get('/fonts', (req, res) => {
  // Define the font mapping to match exactly with CSS @font-face declarations
  const fontMapping = {
    'Farro': 'Farro',
    'Headland One': 'Headland One', 
    'Inter': 'Inter',
    'Lato': 'Lato',
    'Montserrat': 'Montserrat',
    'Nexa-Font-Family': 'Nexa',
    'Open_Sans': 'Open Sans',
    'Roboto': 'Roboto'
  };

  const fontsPath = path.join(__dirname, '..', 'assets/fonts');
  fs.readdir(fontsPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error('Error reading fonts directory:', err);
      return res.status(500).json({ error: 'Error reading fonts directory' });
    }
    
    const fontFamilies = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => fontMapping[dirent.name] || dirent.name)
      .filter(Boolean); // Remove any undefined values
    
    res.json(fontFamilies);
  });
});

module.exports = router;