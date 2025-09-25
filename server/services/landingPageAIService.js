const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

/**
 * @typedef {object} LandingPageContent
 * @property {string} headline - The main headline for the landing page.
 * @property {string} subheadline - A brief, compelling subheadline.
 * @property {string} aboutHeader - The header for the "About" section.
 * @property {string} aboutDescription - The description for the "About" section.
 * @property {string} featuresHeader - The header for the "Features" section.
 * @property {string} featuresDescription - The lead paragraph for the "Features" section.
 * @property {Array<{title: string, description: string, icon: string}>} features - A list of key features with descriptions and an icon.
 * @property {string} callToAction - A call-to-action phrase.
 * @property {object} staticText - Translated static text for the template.
 * @property {string} staticText.lang - The language code (e.g., "en", "es").
 * @property {string} staticText.metaDescription - The content for the meta description tag.
 * @property {string} staticText.navHome - Navigation link text for "Home".
 * @property {string} staticText.navFeatures - Navigation link text for "Features".
 * @property {string} staticText.navDownload - Navigation link text for "Download".
 * @property {string} staticText.navContact - Navigation link text for "Contact".
 * @property {string} staticText.downloadTitle - The main title for the download section.
 * @property {string} staticText.downloadDescription - Supporting copy for the download section.
 * @property {string} staticText.contactTitle - Title for the contact section.
 * @property {string} staticText.contactDescription - Supporting copy for the contact section.
 * @property {string} staticText.contactEmailTitle - Label for the email contact line.
 * @property {string} staticText.contactEmail - Email address text for contact.
 * @property {string} staticText.contactSupportTitle - Label for the support contact line.
 * @property {string} staticText.contactSupport - Support email text.
 * @property {string} staticText.footerSlogan - Short slogan shown in the footer.
 * @property {string} staticText.footerPrivacyPolicy - Text for the privacy policy link.
 * @property {string} staticText.footerTerms - Text for the terms link.
 * @property {string} staticText.footerCopyright - Footer copyright line.
 */

/**
 * Generates landing page content using AI based on project details.
 *
 * @param {string} appName - The name of the application.
 * @param {string} appDescription - The user-provided description of the app.
 * @param {object} asoContent - The AI-generated App Store Optimization content.
 * @returns {Promise<LandingPageContent>} The generated landing page content.
 */
async function generateLandingPageContent(appName, appDescription, asoContent, language = 'en') {
  console.log('LandingPageAIService: Starting content generation for app:', appName);
  console.log('LandingPageAIService: App description:', appDescription);
  console.log('LandingPageAIService: ASO content available:', !!asoContent);
  console.log('LandingPageAIService: Target language:', language);

  const targetLanguage = language || 'en';
  
  const prompt = `
You are an expert marketing copywriter tasked with creating content for a landing page for a mobile app in ${targetLanguage}.
Analyze the following application details and generate compelling copy in ${targetLanguage}.

App Name:
${appName}

App Description (from user):
${appDescription}

Existing App Store Content (for context):
- Title: ${asoContent?.title}
- Subtitle: ${asoContent?.subtitle}
- Promotional Text: ${asoContent?.promotionalText}
- Description: ${asoContent?.description}
- Keywords: ${asoContent?.keywords}

Your Task:
- Generate a JSON object with the structure described below. The tone should be engaging, benefit-oriented, and professional.
- The "callToAction" text must be short and compelling (e.g., "Download Now", "Get the App").
- All text content must be written in ${targetLanguage} with zero untranslated English fragments.
- Include the keys "headline", "subheadline", "aboutHeader", "aboutDescription", "featuresHeader", "featuresDescription", "features" (array of objects with "title", "description", "icon"), and "callToAction".
- Include a "staticText" object with the keys: "lang", "metaDescription", "navHome", "navFeatures", "navDownload", "navContact", "downloadTitle", "downloadDescription", "contactTitle", "contactDescription", "contactEmailTitle", "contactEmail", "contactSupportTitle", "contactSupport", "footerSlogan", "footerPrivacyPolicy", "footerTerms", "footerCopyright".
- The footer content should reference the year ${new Date().getFullYear()}.
- Respond ONLY with valid JSON. Do not include any explanations or Markdown.

For the "icon" field in each feature, choose one of these Font Awesome identifiers:
- "fas fa-upload"
- "fas fa-video"
- "fas fa-shield-alt"
- "fas fa-cubes"
- "fas fa-comments"
- "fas fa-wallet"
- "fas fa-lightbulb"
- "fas fa-images"
- "fas fa-chart-line"
- "fas fa-mobile-alt"
- "fas fa-cloud"
- "fas fa-lock"
- "fas fa-cog"
- "fas fa-users"
- "fas fa-bolt"
- "fas fa-magic"
- "fas fa-rocket"
- "fas fa-heart"
- "fas fa-star"
- "fas fa-thumbs-up"
- "fas fa-check-circle"
- "fas fa-globe"
- "fas fa-search"
- "fas fa-headset"
- "fas fa-calendar-alt"
- "fas fa-map-marker-alt"
- "fas fa-microphone"
- "fas fa-music"
- "fas fa-paper-plane"
- "fas fa-puzzle-piece"
- "fas fa-road"
- "fas fa-signal"
- "fas fa-sitemap"
- "fas fa-tag"
- "fas fa-trophy"
- "fas fa-wifi"
`;

  try {
    console.log('LandingPageAIService: Sending request to Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            subheadline: { type: Type.STRING },
            aboutHeader: { type: Type.STRING },
            aboutDescription: { type: Type.STRING },
            featuresHeader: { type: Type.STRING },
            featuresDescription: { type: Type.STRING },
            features: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING }
                }
              }
            },
            callToAction: { type: Type.STRING },
            staticText: {
              type: Type.OBJECT,
              properties: {
                lang: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                navHome: { type: Type.STRING },
                navFeatures: { type: Type.STRING },
                navDownload: { type: Type.STRING },
                navContact: { type: Type.STRING },
                downloadTitle: { type: Type.STRING },
                downloadDescription: { type: Type.STRING },
                contactTitle: { type: Type.STRING },
                contactDescription: { type: Type.STRING },
                contactEmailTitle: { type: Type.STRING },
                contactEmail: { type: Type.STRING },
                contactSupportTitle: { type: Type.STRING },
                contactSupport: { type: Type.STRING },
                footerSlogan: { type: Type.STRING },
                footerPrivacyPolicy: { type: Type.STRING },
                footerTerms: { type: Type.STRING },
                footerCopyright: { type: Type.STRING }
              }
            }
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
    const safeAppName = appName || 'App Name';
    const normalizedName = safeAppName.toLowerCase().replace(/\s+/g, '');

    return {
      headline: 'An Amazing App: ' + safeAppName,
      subheadline: 'Discover how this app can solve your problems and make your life easier. It\'s intuitive, powerful, and designed for you.',
      aboutHeader: 'About ' + safeAppName,
      aboutDescription: 'Learn more about what makes ' + safeAppName + ' the best solution for you.',
      featuresHeader: 'Features You Will Love',
      featuresDescription: 'Our app is packed with features designed to provide you with the best experience.',
      features: [
        { title: 'Intuitive Design', description: 'An easy-to-use interface that feels natural from the start.', icon: 'fas fa-lightbulb' },
        { title: 'Powerful Features', description: 'Packed with tools to help you accomplish your goals efficiently.', icon: 'fas fa-cubes' },
        { title: 'Always Secure', description: 'Your data is always protected with top-tier security measures.', icon: 'fas fa-shield-alt' },
      ],
      callToAction: 'Get The App',
      staticText: {
        lang: targetLanguage,
        metaDescription: 'Download ' + safeAppName + ' today!',
        navHome: 'Home',
        navFeatures: 'Features',
        navDownload: 'Download',
        navContact: 'Contact',
        downloadTitle: 'Join Our Community of Satisfied Users.',
        downloadDescription: 'Get started today and transform your workflow.',
        contactTitle: 'Get in Touch',
        contactDescription: 'Have questions or feedback? We would love to hear from you.',
        contactEmailTitle: 'Email',
        contactEmail: 'hello@' + normalizedName + '.com',
        contactSupportTitle: 'Support',
        contactSupport: 'support@' + normalizedName + '.com',
        footerSlogan: 'Empowering solo developers worldwide.',
        footerPrivacyPolicy: 'Privacy Policy',
        footerTerms: 'Terms of Service',
        footerCopyright: '© ' + new Date().getFullYear() + ' ' + safeAppName + '. All rights reserved.',
      }
    };
  }
}

module.exports = { generateLandingPageContent };

