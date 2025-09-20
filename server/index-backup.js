const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const upload = require('./services/fileUploadService');
const multer = require('multer');
const { uploadImageToSupabase, replaceImageInSupabase, cleanupOldImageVersion } = require('./services/storageService');
const geminiService = require('./services/geminiService');
const imageGenerationService = require('./services/imageGenerationService');
const imageDescriptionService = require('./services/imageDescriptionService');
const zipService = require('./services/zipService');
const axios = require('axios');
const { prisma, supabase } = require('./lib/clients.js');
const { requireAuth } = require('./middleware/auth.js');


const app = express();
const port = process.env.PORT || 3001;

app.use('/static', express.static('tmp'));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

app.get('/api/health-check', async (req, res) => {
  console.log('Attempting to connect with URL:', process.env.DATABASE_URL); 
  try {
    await prisma.$connect();
    res.status(200).json({ message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});


// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();
const uploadMulter = multer({ storage: storage });

// The Core Endpoint
app.post(
  '/api/generate-and-save',
  requireAuth, // 1. Check if user is logged in
  (req, res, next) => {
    uploadMulter.array('screenshots', 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(500).json({ error: 'An unknown error occurred during file upload.' });
      }
      // Everything went fine.
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('generate-and-save: Received request');
      // 3. Extract text data and user info
      const { projectName, appName, appDescription, imageDescriptions, language, device } = req.body;
      const parsedImageDescriptions = JSON.parse(imageDescriptions); // Descriptions sent as a JSON string
      const userId = req.user.id;
      const userEmail = req.user.email;

      const uploadedFiles = req.files; // Files are available here thanks to multer

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'No screenshot files were uploaded.' });
      }

      console.log('generate-and-save: Generating ASO text');
      const generatedAsoText = await geminiService.generateContent(appName, appDescription, parsedImageDescriptions.map(d => d.heading), language);

      // --- Process and Upload Images ---
      console.log('generate-and-save: Processing and uploading images');
      const processedImages = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const heading = generatedAsoText.headings[i].heading;
        const subheading = generatedAsoText.headings[i].subheading;
        const font = parsedImageDescriptions[i].font;

        console.log(`generate-and-save: Uploading original screenshot ${i + 1}`);
        // 4a. Upload the ORIGINAL screenshot to Supabase Storage
        const sourceScreenshotUrl = await uploadImageToSupabase(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId
        );

        console.log(`generate-and-save: Generating marketing image ${i + 1}`);
        // 4b. Generate the new marketing image using your existing service
        const { imageBuffer: generatedImageBuffer, accentColor } = await imageGenerationService.generateAppStoreImage(
            heading, 
            subheading, 
            file.buffer,
            undefined, // headingFontFamily, leaving it for now as it is not part of this task
            undefined, // subheadingFontFamily
            undefined, // headingFontSize
            undefined, // subheadingFontSize
            device
        );

        console.log(`generate-and-save: Uploading generated image ${i + 1}`);
        // 4c. Upload the GENERATED image to Supabase Storage
        const generatedImageUrl = await uploadImageToSupabase(
          generatedImageBuffer,
          `generated-${file.originalname}`, 
          'image/jpeg',
          userId
        );
        
        processedImages.push({
          sourceScreenshotUrl: sourceScreenshotUrl,
          generatedImageUrl: generatedImageUrl,
          accentColor: accentColor,
          configuration: { heading: heading, subheading: subheading, font: font }, // Save the config
        });
      }



      // Ensure the user exists in our public User table
      await prisma.user.upsert({
        where: { id: userId },
        update: { email: userEmail },
        create: { id: userId, email: userEmail },
      });

      console.log('generate-and-save: Saving project to database');
      // 5. Save everything to the database using Prisma
      const newProject = await prisma.project.create({
        data: {
          name: projectName,
          inputAppName: appName,
          inputAppDescription: appDescription,
          language: language,
          device: device,
          generatedAsoText: generatedAsoText,
          userId: userId,
          generatedImages: {
            create: processedImages, // Prisma creates all related images at once
          },
        },
        include: {
          generatedImages: true,
        },
      });

      console.log('generate-and-save: Project saved successfully');
      res.status(201).json(newProject);
    } catch (error) {
      console.error('Error in /api/generate-and-save:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  }
);

app.post('/api/generate-content', upload.any(), async (req, res) => {

  console.log('Received request to /api/generate-content');
  const { appName, appDescription } = req.body;
  const files = req.files.filter(f => f.fieldname === 'screenshots');
  const imageDescriptions = [];
  for (let i = 0; i < files.length; i++) {
    imageDescriptions.push(req.body[`imageDescription${i}`]);
  }

  console.log('Request body:', { appName, appDescription, imageDescriptions });
  console.log('Received files:', files.map(f => f.originalname));

  try {
    console.log('Step 1: Generating content with Gemini...');
    const generatedText = await geminiService.generateContent(appName, appDescription, imageDescriptions);
    console.log('Step 1 complete. Generated text:', generatedText);

    console.log('Step 2: Generating images...');
    const imageUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const heading = generatedText.headings[i].heading;
      const subheading = generatedText.headings[i].subheading;
      const screenshotPath = file.path;
      
      console.log(`Generating App Store image ${i + 1} for file ${file.originalname}`);
      const imageBuffer = await imageGenerationService.generateAppStoreImage(heading, subheading, screenshotPath);
      
      const timestamp = Date.now();
      const outputFilename = `generated-${timestamp}-${file.filename}`;
      const outputPath = path.join('tmp', outputFilename);
      
      fs.writeFileSync(outputPath, imageBuffer);
      
      const imageUrl = `/static/${outputFilename}`;
      imageUrls.push(imageUrl);
      console.log(`Image ${i + 1} generated and saved to ${outputPath}`);
    }
    console.log('Step 2 complete. Generated images.');

    console.log('Step 3: Sending response to client...');
    res.json({ text: generatedText, images: imageUrls });
    console.log('Step 3 complete. Response sent.');

  } catch (error) {
    console.error("Error in /api/generate-content:", error);
    if (error.status === 503) {
      return res.status(503).json({ error: "The model is overloaded. Please try again later." });
    }
    res.status(500).json({ error: "Error generating content" });
  }
});

app.post('/api/generate-image-description', upload.single('image'), async (req, res) => {
  console.log('Received request to /api/generate-image-description');
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  console.log('Received file:', file.originalname);

  try {
    console.log('Generating image description with Gemini...');
    const result = await imageDescriptionService.generateImageDescription(file.path);
    console.log('Image description generated:', result.description);
    res.json(result);
  } catch (error) {
    console.error("Error in /api/generate-image-description:", error);
    res.status(500).json({ error: "Error generating image description" });
  }
});

app.post('/api/download-images-zip', async (req, res) => {
  console.log('Received request to /api/download-images-zip');
  const { imageUrls } = req.body;

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'No image URLs provided' });
  }

  const downloadDir = path.join(__dirname, 'tmp', `zip_downloads_${Date.now()}`);
  const downloadedImagePaths = [];

  try {
    fs.mkdirSync(downloadDir, { recursive: true });

    for (const imageUrl of imageUrls) {
      const filename = path.basename(new URL(imageUrl, `http://localhost:${port}`).pathname);
      const localPath = path.join(downloadDir, filename);
      const response = await axios({
        method: 'get',
        url: new URL(imageUrl, `http://localhost:${port}`).href,
        responseType: 'stream',
      });
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      downloadedImagePaths.push(localPath);
    }

    const zipFileName = `app_images_${Date.now()}.zip`;
    const zipFilePath = path.join(__dirname, 'tmp', zipFileName);

    await zipService.createZipArchive(downloadedImagePaths, zipFilePath);

    res.download(zipFilePath, zipFileName, (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
        res.status(500).json({ error: 'Error sending zip file' });
      }
      // Clean up after download
      fs.unlinkSync(zipFilePath);
      fs.rmSync(downloadDir, { recursive: true, force: true });
    });

  } catch (error) {
    console.error("Error in /api/download-images-zip:", error);
    res.status(500).json({ error: "Error creating or downloading zip file" });
    fs.rmSync(downloadDir, { recursive: true, force: true }); // Clean up on error
  }
});

app.post('/api/regenerate-images', requireAuth, async (req, res) => {
  console.log('Received request to /api/regenerate-images');
  const { generatedImages, headings, headingFontFamily, subheadingFontFamily, headingFontSize, subheadingFontSize } = req.body;

  try {
    console.log('Step 1: Regenerating images...');
    const imageUrls = [];
    for (let i = 0; i < generatedImages.length; i++) {
      const { sourceScreenshotUrl, generatedImageUrl } = generatedImages[i];
      const heading = headings[i].heading;
      const subheading = headings[i].subheading;
      
      // Download the image from the URL
      const response = await axios.get(sourceScreenshotUrl, { responseType: 'arraybuffer' });
      const screenshotBuffer = Buffer.from(response.data, 'binary');

      console.log(`Generating App Store image ${i + 1} for URL ${sourceScreenshotUrl}`);
      const imageBuffer = await imageGenerationService.generateAppStoreImage(
        heading, 
        subheading, 
        screenshotBuffer, 
        headingFontFamily, 
        subheadingFontFamily, 
        headingFontSize, 
        subheadingFontSize
      );
      
      // Replace the regenerated image in Supabase
      const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
        generatedImageUrl, 
        imageBuffer, 
        'image/jpeg'
      );

      // Cleanup old version in background (non-blocking)
      setImmediate(() => {
        cleanupOldImageVersion(oldImagePath);
      });

      imageUrls.push({ 
        generatedImageUrl: newImageUrl,
        sourceScreenshotUrl: sourceScreenshotUrl
      });
      console.log(`Image ${i + 1} regenerated and saved to ${newGeneratedImageUrl}`);
    }
    console.log('Step 1 complete. Regenerated images.');

    console.log('Step 2: Sending response to client...');
    res.json({ images: imageUrls });
    console.log('Step 2 complete. Response sent.');

  } catch (error) {
    console.error("Error in /api/regenerate-images:", error);
    res.status(500).json({ error: "Error regenerating images" });
  }
});

app.post('/api/projects/:projectId/images/:imageId', requireAuth, upload.single('image'), async (req, res) => {
  const { projectId, imageId } = req.params;
  const { configuration } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  try {
    const imageBuffer = fs.readFileSync(file.path);

    const generatedImage = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!generatedImage) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    const { newImageUrl, oldImagePath } = await replaceImageInSupabase(
      generatedImage.generatedImageUrl,
      imageBuffer,
      file.mimetype
    );

    const parsedConfiguration = configuration ? JSON.parse(configuration) : generatedImage.configuration;

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        generatedImageUrl: newImageUrl,
        configuration: parsedConfiguration,
      },
    });

    // Cleanup old version in background (non-blocking)
    setImmediate(() => {
      cleanupOldImageVersion(oldImagePath);
    });

    fs.unlinkSync(file.path);

    res.status(200).json({ imageUrl: newImageUrl });
  } catch (error) {
    console.error('Error updating image:', error);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    res.status(500).json({ error: 'Failed to update image.' });
  }
});

app.post('/api/regenerate-with-ai', requireAuth, async (req, res) => {
  console.log('Received request to /api/regenerate-with-ai');
  const { projectId, imageId, device } = req.body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log('Step 1: Generating content with Gemini...');
    const { heading, subheading } = await geminiService.generateSingleImageText(
      project.inputAppName,
      project.inputAppDescription,
      image.sourceScreenshotUrl,
      device
    );
    console.log('Step 1 complete. Generated text:', { heading, subheading });

    res.json({ heading, subheading });
    console.log('Step 2 complete. Response sent.');

  } catch (error) {
    console.error("Error in /api/regenerate-with-ai:", error);
    res.status(500).json({ error: "Error regenerating with AI" });
  }
});

app.post('/api/regenerate-content-part', requireAuth, async (req, res) => {
  try {
    console.log('regenerate-content-part: Received request');
    const { appName, appDescription, imageDescriptions, contentType, currentContent, language = 'English' } = req.body;

    if (!appName || !appDescription || !contentType) {
      return res.status(400).json({ error: 'Missing required fields: appName, appDescription, contentType' });
    }

    // Create focused prompts based on content type
    let focusedPrompt;
    let responseSchema;

    switch (contentType) {
      case 'title':
        focusedPrompt = `You are an expert in App Store Optimization (ASO). Generate ONLY an optimized app title for the app "${appName}".
        
App Description: "${appDescription}"
Current Title: "${currentContent}"
Language: ${language}

Requirements:
- Maximum 30 characters
- Brand-driven and keyword-rich
- Prioritize core value and include one strong keyword
- Focus on the main benefit or unique selling point
- No special characters, emojis, or excessive punctuation
- Improve upon the current title if possible

Generate a better, more optimized title.`;
        
        responseSchema = {
          type: "object",
          properties: {
            title: { type: "string" }
          }
        };
        break;

      case 'subtitle':
        focusedPrompt = `You are an expert in App Store Optimization (ASO). Generate ONLY an optimized app subtitle for the app "${appName}".
        
App Description: "${appDescription}"
Current Subtitle: "${currentContent}"
Language: ${language}

Requirements:
- Maximum 30 characters
- Highlight main benefit or feature that sets the app apart
- Include secondary keywords naturally
- Complement the app title
- Focus on differentiation and value proposition
- No special characters or emojis

Generate a compelling, benefit-driven subtitle.`;
        
        responseSchema = {
          type: "object",
          properties: {
            subtitle: { type: "string" }
          }
        };
        break;

      case 'promotionalText':
        focusedPrompt = `You are an expert in App Store Optimization (ASO). Generate ONLY optimized promotional text for the app "${appName}".
        
App Description: "${appDescription}"
Current Promotional Text: "${currentContent}"
Language: ${language}

Requirements:
- Maximum 170 characters
- Short, engaging hook
- Focus on new features, benefits, or trending value
- Can emphasize offers or unique advantages
- Professional yet approachable tone
- No special characters or excessive punctuation

Generate compelling promotional text that drives downloads.`;
        
        responseSchema = {
          type: "object",
          properties: {
            promotionalText: { type: "string" }
          }
        };
        break;

      case 'description':
        focusedPrompt = `You are an expert in App Store Optimization (ASO). Generate ONLY an optimized app description for the app "${appName}".
        
App Description: "${appDescription}"
Current Description: "${currentContent}"
Language: ${language}
${imageDescriptions ? `Screenshot Context: ${imageDescriptions.map((desc, index) => `Screenshot ${index + 1}: "${desc}"`).join(", ")}` : ''}

Requirements:
- Maximum 4000 characters
- Strong first two lines (visible without expanding)
- Structure: Introduction → Features with benefits → Differentiators → Social proof → Call-to-action
- User-friendly language, avoid jargon
- Highlight problem-solving value
- No markdown, HTML, URLs, or special formatting
- Focus on benefits, not just features
- Natural keyword integration

Generate a comprehensive, conversion-focused description.`;
        
        responseSchema = {
          type: "object",
          properties: {
            description: { type: "string" }
          }
        };
        break;

      case 'keywords':
        focusedPrompt = `You are an expert in App Store Optimization (ASO). Generate ONLY optimized keywords for the app "${appName}".
        
App Description: "${appDescription}"
Current Keywords: "${currentContent}"
Language: ${language}

Requirements:
- Single words only, separated by comma and space
- No plurals, no brand names you don't own
- Mix of broad and niche keywords
- Focus on discoverability and search intent
- Avoid words Apple provides by default (app, free, iphone, ipad, etc.)
- Maximum relevance to app functionality and benefits
- No repeated words

Generate a keyword list optimized for App Store search discovery.`;
        
        responseSchema = {
          type: "object",
          properties: {
            keywords: { type: "string" }
          }
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid contentType. Must be one of: title, subtitle, promotionalText, description, keywords' });
    }

    console.log(`regenerate-content-part: Generating ${contentType} content`);
    
    const { GoogleGenAI, Type } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: focusedPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: Object.keys(responseSchema.properties).reduce((acc, key) => {
            acc[key] = { type: Type.STRING };
            return acc;
          }, {})
        }
      }
    });

    const generatedContent = JSON.parse(response.text);
    console.log(`regenerate-content-part: Successfully generated ${contentType}`);
    
    res.status(200).json(generatedContent);

  } catch (error) {
    console.error("Error in /api/regenerate-content-part:", error);
    res.status(500).json({ error: "Error regenerating content part" });
  }
});

app.get('/api/fonts', (req, res) => {
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

  const fontsPath = path.join(__dirname, 'assets/fonts');
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

app.get('/api/projects', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Could not fetch projects." });
  }
});

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        generatedImages: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(`Failed to fetch project ${id}:`, error);
    res.status(500).json({ error: `Could not fetch project ${id}.` });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await prisma.project.delete({
      where: {
        id,
        userId,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete project ${id}:`, error);
    res.status(500).json({ error: `Could not delete project ${id}.` });
  }
});

app.post('/api/save-project', requireAuth, async (req, res) => {
  const { projectName, inputAppName, inputAppDescription, generatedAsoText, generatedImages } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    // Ensure the user exists in our public User table
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: userEmail },
      create: { id: userId, email: userEmail },
    });

    const newProject = await prisma.project.create({
      data: {
        name: projectName,
        inputAppName,
        inputAppDescription,
        generatedAsoText,
        userId, // Link the project to the user
        generatedImages: {
          create: generatedImages.map(img => ({ // Assumes generatedImages is an array
            sourceScreenshotUrl: img.sourceUrl,
            generatedImageUrl: img.generatedUrl,
            configuration: img.configuration,
          })),
        },
      },
      include: {
        generatedImages: true, // Include the created images in the response
      },
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Failed to save project:", error);
    res.status(500).json({ error: "Could not save the project." });
  }
});

// Delete Account Endpoint
app.delete('/api/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Attempting to delete account for user:', userId);

    // Delete user's projects and related data
    await prisma.generatedImage.deleteMany({
      where: {
        project: {
          userId: userId
        }
      }
    });

    await prisma.project.deleteMany({
      where: {
        userId: userId
      }
    });

    // Delete the user record from our public User table (if it exists)
    const deletedUser = await prisma.user.deleteMany({
      where: {
        id: userId
      }
    });
    
    console.log(`Deleted ${deletedUser.count} user record(s) for user ${userId}`);

    // Delete user's files from Supabase storage
    try {
      const { data: files } = await supabase.storage
        .from('project-assets')
        .list(userId);
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        await supabase.storage
          .from('project-assets')
          .remove(filePaths);
        console.log(`Deleted ${filePaths.length} files for user ${userId}`);
      }
    } catch (storageError) {
      console.warn('Warning: Failed to delete user files from storage:', storageError);
      // Don't fail the entire deletion process if storage cleanup fails
    }

    // Delete user from Supabase Auth (GDPR compliance)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.warn('Warning: Failed to delete user from Supabase Auth:', authDeleteError);
        // Log the error but don't fail the request - the user's data is already cleaned up
      } else {
        console.log(`Successfully deleted user ${userId} from Supabase Auth`);
      }
    } catch (authError) {
      console.warn('Warning: Exception during Supabase Auth user deletion:', authError);
    }

    res.status(200).json({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
