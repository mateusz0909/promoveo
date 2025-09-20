const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

/**
 * @typedef {object} LandingPageContent
 * @property {string} headline - The main headline for the landing page.
 * @property {string} subheadline - A brief, compelling subheadline.
 * @property {Array<{title: string, description: string}>} features - A list of key features with descriptions.
 * @property {string} callToAction - A call-to-action phrase.
 */

/**
 * Generates landing page content using AI based on project details.
 *
 * @param {string} appName - The name of the application.
 * @param {string} appDescription - The user-provided description of the app.
 * @param {object} asoContent - The AI-generated App Store Optimization content.
 * @returns {Promise<LandingPageContent>} The generated landing page content.
 */
async function generateLandingPageContent(appName, appDescription, asoContent) {
  console.log('LandingPageAIService: Starting content generation for app:', appName);
  console.log('LandingPageAIService: App description:', appDescription);
  console.log('LandingPageAIService: ASO content available:', !!asoContent);
  
  const prompt = `
    You are an expert marketing copywriter tasked with creating content for a landing page for a mobile app.
    Analyze the following application details and generate compelling copy.

    **App Name:**
    ${appName}

    **App Description (from user):**
    ${appDescription}

    **Existing App Store Content (for context):**
    - Title: ${asoContent?.title}
    - Subtitle: ${asoContent?.subtitle}
    - Promotional Text: ${asoContent?.promotionalText}
    - Description: ${asoContent?.description}
    - Keywords: ${asoContent?.keywords}

    **Your Task:**
    Generate a JSON object with the following structure for the landing page. The tone should be engaging, benefit-oriented, and professional.
    The response MUST be a valid JSON object that conforms to the schema described below. Do not include any other text, markdown, or explanations.
  `;

  try {
    console.log('LandingPageAIService: Sending request to Gemini API...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              features: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              callToAction: { type: Type.STRING }
            }
          }
        }
    });
    
    console.log('LandingPageAIService: Received response from Gemini API');
    const text = response.text;
    console.log('LandingPageAIService: Response text length:', text?.length);
    console.log('LandingPageAIService: Response text preview:', text?.substring(0, 200) + '...');
    
    const parsedContent = JSON.parse(text);
    console.log('LandingPageAIService: Successfully parsed JSON content');
    console.log('LandingPageAIService: Generated headline:', parsedContent.headline);
    console.log('LandingPageAIService: Generated features count:', parsedContent.features?.length);
    
    return parsedContent;
  } catch (error) {
    console.error('LandingPageAIService: Error generating landing page content with AI:', error);
    console.error('LandingPageAIService: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    console.log('LandingPageAIService: Falling back to default content');
    
    // Return a fallback object in case of AI failure
    return {
      headline: `An Amazing App: ${appName}`,
      subheadline: 'Discover how this app can solve your problems and make your life easier. It\'s intuitive, powerful, and designed for you.',
      features: [
        { title: 'Intuitive Design', description: 'An easy-to-use interface that feels natural from the start.' },
        { title: 'Powerful Features', description: 'Packed with tools to help you accomplish your goals efficiently.' },
        { title: 'Always Secure', description: 'Your data is always protected with top-tier security measures.' },
      ],
      callToAction: 'Get The App',
    };
  }
}

module.exports = { generateLandingPageContent };

