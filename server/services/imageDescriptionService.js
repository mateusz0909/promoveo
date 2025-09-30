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

async function generateImageHeadingSubheading(imagePath, appName, appDescription, currentHeading, currentSubheading, style = 'concise') {
  console.log('ImageDescriptionService: generating heading and subheading for image:', imagePath, 'with style:', style);

  const base64ImageFile = fs.readFileSync(imagePath, {
    encoding: "base64",
  });

  // Build context about current content if available
  let currentContentContext = '';
  if (currentHeading || currentSubheading) {
    currentContentContext = `\n\nCurrent content on this screenshot:
- Heading: "${currentHeading || 'None'}"
- Subheading: "${currentSubheading || 'None'}"

Use this as context to understand what feature or aspect of the app this screenshot is highlighting. Your new content should be fresh and improved, but stay aligned with the same feature/theme.`;
  }

  // Define style-specific guidelines
  const styleGuidelines = style === 'concise' 
    ? `Guidelines (Concise Style):
- The heading must be a single, impactful word that captures the essence of what's shown
- The subheading should directly continue from the heading, creating a complete sentence or closely related phrase
- Together they should be benefit-driven and highlight the key feature shown in the screenshot
- Keep the total combined length under 50 characters
- No emojis, special characters, or excessive punctuation
- Make it engaging and conversion-focused

Examples of good heading + subheading combinations:
- Heading: "Discover", Subheading: "new beauty trends daily"
- Heading: "Powerful", Subheading: "unlimited group messaging"
- Heading: "Create", Subheading: "your custom stickers easily"
- Heading: "Track", Subheading: "every expense effortlessly"`
    : `Guidelines (Detailed Style):
- The heading should be a full phrase (3-5 words) that describes the main benefit or feature shown
- The subheading should be a standalone benefit statement (5-8 words) that complements the heading
- Both should work independently while supporting each other
- Focus on user benefits and tangible outcomes
- Keep heading under 30 characters, subheading under 45 characters
- No emojis, special characters, or excessive punctuation
- Make it compelling and conversion-focused

Examples of good heading + subheading combinations:
- Heading: "Breathe like a PRO", Subheading: "Calm in minutes with breathwork"
- Heading: "Track Every Expense", Subheading: "Stay on budget automatically"
- Heading: "Connect with Anyone", Subheading: "Video calls made simple"
- Heading: "Design in Seconds", Subheading: "Professional results every time"`;

  const contents = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64ImageFile,
      },
    },
    { 
      text: `You are an App Store Optimization Expert. 
      
Based on this screenshot from an app called "${appName}" (${appDescription}), generate a compelling heading and subheading for App Store marketing.${currentContentContext}

${styleGuidelines}

Generate heading and subheading that would make users want to download this app.` 
    },
  ];

  try {
    console.log('ImageDescriptionService: sending heading/subheading request to Gemini API...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                heading: { type: Type.STRING },
                subheading: { type: Type.STRING },
            }
          }
        }
    });
    const text = response.text;
    console.log('ImageDescriptionService: successfully received heading/subheading response from Gemini API.');
    return JSON.parse(text);
  } catch (error) {
    console.error("ImageDescriptionService: Error generating heading/subheading:", error);
    throw error;
  }
}

console.log('ImageDescriptionService initialized.');

module.exports = { generateImageDescription, generateImageHeadingSubheading };