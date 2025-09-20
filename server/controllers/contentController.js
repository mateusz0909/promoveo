const geminiService = require('../services/geminiService');
const imageGenerationService = require('../services/imageGenerationService');
const { uploadImageToSupabase } = require('../services/storageService');
const { prisma } = require('../lib/clients');
const { GoogleGenAI, Type } = require('@google/genai');
const path = require('path');
const fs = require('fs');

const contentController = {
  // Legacy generate content endpoint
  async generateContent(req, res) {
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
  },

  // Main generate and save endpoint
  async generateAndSave(req, res) {
    try {
      console.log('generate-and-save: Received request');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request files:', req.files ? req.files.length : 'No files');
      
      // Extract text data and user info
      const { projectName, appName, appDescription, imageDescriptions, language, device } = req.body;
      console.log('Extracted data:', { projectName, appName, appDescription, language, device });
      console.log('Raw imageDescriptions:', imageDescriptions);
      
      const parsedImageDescriptions = JSON.parse(imageDescriptions);
      console.log('Parsed imageDescriptions:', parsedImageDescriptions);
      
      const userId = req.user.id;
      const userEmail = req.user.email;
      console.log('User info:', { userId, userEmail });

      const uploadedFiles = req.files;
      console.log('Uploaded files check:', {
        filesExist: !!uploadedFiles,
        fileCount: uploadedFiles ? uploadedFiles.length : 0,
        fileNames: uploadedFiles ? uploadedFiles.map(f => f.originalname) : []
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        console.log('ERROR: No files uploaded');
        return res.status(400).json({ error: 'No screenshot files were uploaded.' });
      }

      console.log('generate-and-save: Generating ASO text');
      console.log('Calling geminiService.generateContent with:', {
        appName,
        appDescription,
        headings: parsedImageDescriptions.map(d => d.heading),
        language
      });
      
      const generatedAsoText = await geminiService.generateContent(
        appName, 
        appDescription, 
        parsedImageDescriptions.map(d => d.heading), 
        language
      );
      
      console.log('Generated ASO text:', generatedAsoText);

      // Process and Upload Images
      console.log('generate-and-save: Processing and uploading images');
      const processedImages = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const heading = generatedAsoText.headings[i].heading;
        const subheading = generatedAsoText.headings[i].subheading;
        const font = parsedImageDescriptions[i].font;

        console.log(`generate-and-save: Uploading original screenshot ${i + 1}`);
        // Upload the ORIGINAL screenshot to Supabase Storage
        const sourceScreenshotUrl = await uploadImageToSupabase(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId
        );

        console.log(`generate-and-save: Generating marketing image ${i + 1}`);
        // Generate the App Store marketing image
        const generatedImageResult = await imageGenerationService.generateAppStoreImage(
          heading,
          subheading,
          file.buffer,
          font.headingFont || 'Farro',
          font.subheadingFont || 'Headland One',
          font.headingFontSize || 120,
          font.subheadingFontSize || 69,
          device
        );

        console.log(`generate-and-save: Uploading generated image ${i + 1} - buffer size: ${generatedImageResult.imageBuffer.length} bytes`);
        // Upload the generated marketing image to Supabase Storage
        const generatedImageUrl = await uploadImageToSupabase(
          generatedImageResult.imageBuffer,
          `generated_${file.originalname}`,
          'image/jpeg',
          userId
        );

        processedImages.push({
          sourceScreenshotUrl,
          generatedImageUrl,
          accentColor: generatedImageResult.accentColor,
          configuration: {
            heading,
            subheading,
            font,
          }
        });
        
        console.log(`Generated image ${i + 1} URLs:`, {
          sourceScreenshotUrl,
          generatedImageUrl
        });
      }

      console.log('generate-and-save: Saving project to database');
      console.log('ProcessedImages summary:', processedImages.map((img, i) => ({
        index: i + 1,
        sourceScreenshotUrl: img.sourceScreenshotUrl,
        generatedImageUrl: img.generatedImageUrl
      })));
      
      // Create the project record in database
      const { prisma } = require('../lib/clients');
      const newProject = await prisma.project.create({
        data: {
          userId,
          name: projectName,
          inputAppName: appName,
          inputAppDescription: appDescription,
          generatedAsoText,
          device,
          language,
          generatedImages: {
            create: processedImages.map(img => ({
              sourceScreenshotUrl: img.sourceScreenshotUrl,
              generatedImageUrl: img.generatedImageUrl,
              accentColor: img.accentColor,
              configuration: img.configuration,
            }))
          }
        },
        include: {
          generatedImages: true,
        },
      });

      console.log('generate-and-save: Project created successfully');
      res.status(201).json(newProject);

    } catch (error) {
      console.error('Error in generate-and-save:', error);
      res.status(500).json({ error: 'Error generating and saving content' });
    }
  },

  // Regenerate content with AI
  async regenerateWithAI(req, res) {
    try {
      console.log('regenerate-with-ai: Received request');
      const { appName, appDescription, imageDescriptions, language = 'English' } = req.body;

      if (!appName || !appDescription) {
        return res.status(400).json({ error: 'Missing required fields: appName, appDescription' });
      }

      console.log('regenerate-with-ai: Generating new content with Gemini');
      const newGeneratedText = await geminiService.generateContent(
        appName,
        appDescription,
        imageDescriptions || [],
        language
      );

      console.log('regenerate-with-ai: Content regenerated successfully');
      res.status(200).json({
        text: newGeneratedText
      });

    } catch (error) {
      console.error("Error in /api/regenerate-with-ai:", error);
      res.status(500).json({ error: "Error regenerating with AI" });
    }
  },

  // Regenerate individual content part
  async regenerateContentPart(req, res) {
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

FORMATTING REQUIREMENTS:
- Use double line breaks (\\n\\n) to separate major sections or paragraphs
- Use single line breaks (\\n) for list items or related points  
- Use standard punctuation: periods (.), commas (,), hyphens (-), and colons (:)
- Structure content in digestible paragraphs, not one large block
- Start new lines for key features or benefits to improve readability
- Example structure: "Opening hook.\\n\\nKey benefits paragraph.\\n\\nWhy it's different.\\n\\n• Feature 1: benefit\\n• Feature 2: benefit\\n\\nCall-to-action."

Generate a comprehensive, conversion-focused, and well-formatted description.`;
          
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
  },

  // Legacy regenerate with AI endpoint
  async regenerateWithAILegacy(req, res) {
    console.log('Received request to regenerateWithAILegacy');
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
      console.error("Error in regenerateWithAILegacy:", error);
      res.status(500).json({ error: "Error regenerating with AI" });
    }
  }
};

module.exports = contentController;