const { GoogleGenAI, Type } = require('@google/genai');

console.log('Initializing Gemini service...');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function generateContent(appName, appDescription, imageDescriptions, language = 'English') {
  console.log(`GeminiService: generating content for app: ${appName} in ${language}`);

  const imageDescriptionsText = imageDescriptions.map((desc, index) => `Screenshot ${index + 1} description: "${desc}"`).join("\n");

  const prompt = `
    You are an expert in App Store Optimization (ASO).
    Your goal is to create high-quality, conversion-focused, and keyword-optimized App Store content that maximizes discoverability and downloads while staying fully compliant with Apple guidelines.

    The target language for the content is ${language}.

    Generate App Store content for an app named "${appName}".
    The app's description is: "${appDescription}".
    Here are the descriptions for the screenshots:${imageDescriptionsText}

    ASO Guidelines & Focus Areas:
    When generating content, follow these ASO best practices:

    ## Keyword Optimization
    Naturally integrate the most relevant keywords users are searching for.
    Avoid keyword stuffing or unnatural repetition.
    Use a variety of search-intent driven keywords (functional, benefit-based, and niche).
    Ensure single keywords (for metadata) are unique, singular (not plural), and separated by commas.
    Exclude words Apple provides by default: app, free, iphone, ipad, etc.
   
    ## User-Centric & Benefit-Driven
    Focus on user benefits and app value propositions.
    Highlight unique features and differentiators that matter to users.
    Use clear, concise, and engaging language that resonates with the target audience.

    ## Compliance with Apple Guidelines
    Avoid prohibited content, misleading claims, or over-promises.
    Do not use special characters, emojis, or excessive punctuation.
    Ensure all claims are factual and can be substantiated.

    ## App Title (max 30 chars)
    Make it short, brand-driven, and keyword-rich.
    Prioritize the core value of the app and include one strong keyword if possible.

    ## Subtitle (max 30 chars)
    Highlight the main benefit or feature that sets the app apart.
    Include secondary keywords in a natural, compelling way.

    ## Promotional Text (max 170 chars)
    Focus on a short, engaging hook.
    Can be updated often, so emphasize new features, offers, or trending benefits.

    ## App Description (max 4000 chars)
    Start with a strong first two lines (since this is what users see without expanding).
    Use a clear, benefit-driven structure with proper formatting:
    ### Introduction: Why the app is valuable and what problem it solves.
    ### Features: Highlight features with user benefits, not just functions.
    ### Differentiators: Why choose this app over competitors.
    ### Social Proof/Trust: Subtly emphasize credibility, security, or popularity if applicable.
    ### Call-to-Action: Encourage download in a natural, non-salesy tone.
    
    FORMATTING REQUIREMENTS:
    - Use double line breaks (\\n\\n) to separate major sections or paragraphs
    - Use single line breaks (\\n) for list items or related points
    - Use standard punctuation: periods (.), commas (,), hyphens (-), and colons (:)
    - Structure content in digestible paragraphs, not one large block
    - Start new lines for key features or benefits to improve readability
    - Example structure:
      "Opening hook sentence.\\n\\nKey benefit paragraph with specific features.\\n\\nWhy it's different from competitors.\\n\\n• Feature 1: benefit\\n• Feature 2: benefit\\n• Feature 3: benefit\\n\\nClosing call-to-action."
    
    Keep language simple, user-friendly, and engaging. Avoid jargon.
    Dont use all caps, excessive punctuation, or special characters.
    Dont include markdown formatting, HTML tags, or URLs.

    ## Keywords Field (metadata)
    Single words only, separated by a comma and a space. No repeats.
    Avoid plurals, brand names you don’t own, or irrelevant terms.
    Prioritize discoverability by mixing broad and niche keywords.

    ## Screenshot Headings & Subheadings
    Each heading must be a single, impactful word.
    The subheading should be a direct continuation of the heading, creating a complete sentence or a closely related phrase.
    The combined heading and subheading should be benefit-driven and aligned with the screenshot's content.
    For example:
    - Heading: "Discover", Subheading: "new beauty trends"
    - Heading: "Powerful", Subheading: "No limits on the size of groups and broadcasts"
    - Heading: "Create", Subheading: "your own custom stickers"
    Align them with ${imageDescriptionsText}, showcasing the app’s best features.
    Ensure messaging is consistent with the app description.

    ## Compliance & Style
    No emojis, special characters, or symbols.
    No over-promises, misleading claims, or superlatives like “#1” unless factual.
    Tone: professional yet approachable, engaging but trustworthy.
  `;

  try {
    console.log('GeminiService: sending request to Gemini API...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                promotionalText: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.STRING },
                headings: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING },
                            subheading: { type: Type.STRING },
                        }
                    }
                },
            }
          }
        }
    });
    const text = response.text;
    console.log('GeminiService: successfully received response from Gemini API.');
    return JSON.parse(text);
  } catch (error) {
    console.error("GeminiService: Error generating content:", error);
    throw error;
  }
}

console.log('GeminiService initialized.');

module.exports = { generateContent };
 