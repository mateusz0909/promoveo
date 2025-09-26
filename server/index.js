const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const tmpService = require('./services/tmpService');

// Route imports
const systemRoutes = require('./routes/system');
const contentRoutes = require('./routes/content');
const imageRoutes = require('./routes/images');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const templateRoutes = require('./routes/templates');

const app = express();
const port = process.env.PORT || 3001;

// Initialize tmp directory management
(async () => {
  try {
    await tmpService.ensureTmpDir();
    await tmpService.cleanTmpDir({ log: false });
    tmpService.scheduleTmpCleanup();
  } catch (error) {
    console.error('Failed to initialize tmp directory:', error);
  }
})();

// Static file serving
app.use('/static', express.static(tmpService.BASE_TMP_DIR));

// Middleware
app.use(cors());
app.use(express.json());

// Route handlers
app.use('/', systemRoutes);
app.use('/api', contentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);

// Legacy routes are now migrated to appropriate controllers

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});