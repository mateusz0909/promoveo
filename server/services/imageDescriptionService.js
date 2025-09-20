const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');

console.log('Initializing Image Description service...');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function generateImageDescription(imagePath) {
  console.log('ImageDescriptionService: generating description for image:', imagePath);

  const base64ImageFile = fs.readFileSync(imagePath, {
    encoding: "base64",
  });

  const contents = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64ImageFile,
      },
    },
    { text: "You are App Store Optimization Expert. Your goal is to describe this image in 25 characters or less. Focus on the most important elements and why it's important. For example: Home Page with list of task, with nice colorful icons and typography" },
  ];

  try {
    console.log('ImageDescriptionService: sending request to Gemini API...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING },
            }
          }
        }
    });
    const text = response.text;
    console.log('ImageDescriptionService: successfully received response from Gemini API.');
    return JSON.parse(text);
  } catch (error) {
    console.error("ImageDescriptionService: Error generating content:", error);
    throw error;
  }
}

console.log('ImageDescriptionService initialized.');

module.exports = { generateImageDescription };