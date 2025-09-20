const express = require('express');
const { requireAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Get current user profile
router.get('/profile', requireAuth, userController.getProfile);

// Update user profile
router.put('/profile', requireAuth, userController.updateProfile);

// Get user statistics
router.get('/stats', requireAuth, userController.getStats);

// Delete user account
router.delete('/account', requireAuth, userController.deleteAccount);

module.exports = router;