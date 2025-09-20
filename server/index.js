const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');

// Route imports
const systemRoutes = require('./routes/system');
const contentRoutes = require('./routes/content');
const imageRoutes = require('./routes/images');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3001;

// Static file serving
app.use('/static', express.static('tmp'));

// Middleware
app.use(cors());
app.use(express.json());

// Route handlers
app.use('/', systemRoutes);
app.use('/api', contentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

// Legacy routes are now migrated to appropriate controllers

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});