const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const tmpService = require('./services/tmpService');

// Route imports
const systemRoutes = require('./routes/system');
const contentRoutes = require('./routes/content');
const imageRoutes = require('./routes/images');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const visualRoutes = require('./routes/visuals');
const magicDemoRoutes = require('./routes/magicDemo');

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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// =================================================================
// LANDING PAGE (Next.js Static Export) - Must come before API routes
// =================================================================
const landingPagePath = path.join(__dirname, '../Landing Page/astra/out');

// Serve Next.js static assets
app.use('/_next', express.static(path.join(landingPagePath, '_next'), {
  maxAge: '365d',
  immutable: true
}));
app.use('/icons', express.static(path.join(landingPagePath, 'icons')));
app.use('/assets', express.static(path.join(landingPagePath, 'assets')));

// =================================================================
// API ROUTES
// =================================================================
app.use('/static', express.static(tmpService.BASE_TMP_DIR));
app.use('/api', contentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visuals', visualRoutes);
app.use('/api/magic-demo', magicDemoRoutes);

// =================================================================
// LANDING PAGE ROOT (Must come BEFORE system routes)
// =================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(landingPagePath, 'index.html'));
});

// =================================================================
// HEALTH CHECK & SYSTEM ROUTES (excluding root)
// =================================================================
app.use('/health-check', systemRoutes);

// =================================================================
// REACT APP (client/dist) - For authenticated routes
// =================================================================
// TODO: Uncomment when client is built
// const clientPath = path.join(__dirname, '../client/dist');
// app.use(express.static(clientPath));
// 
// // React app catch-all (must be last)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(clientPath, 'index.html'));
// });

app.listen(port, () => {
  console.log(`🚀 AppStoreFire server running on port ${port}`);
  console.log(`   Landing page: http://localhost:${port}/`);
  console.log(`   API: http://localhost:${port}/api`);
});