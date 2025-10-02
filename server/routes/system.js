const express = require('express');
const { prisma } = require('../lib/clients');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  console.log('Attempting to connect with URL:', process.env.DATABASE_URL); 
  try {
    await prisma.$connect();
    res.status(200).json({ message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

module.exports = router;