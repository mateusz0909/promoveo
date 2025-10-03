# Lemmi Studio – Product Feature Overview
**For Landing Page Development**

## Executive Summary

**Lemmi Studio** is an AI-powered platform that helps indie developers and small teams launch their mobile apps to the App Store faster and more professionally. We transform raw screenshots into polished marketing materials, generate App Store-optimized copy, and create complete landing pages—all in one streamlined workflow.

### The Problem We Solve
Building an app is the easy part. The hard part? Creating professional App Store screenshots, writing compelling copy that converts, and building a landing page—all while meeting Apple's strict guidelines. Most developers either skip this entirely or spend weeks on it.

### Our Solution
Lemmi Studio takes your basic screenshots and app description, then uses AI to:
- Generate professional marketing images with device frames, headlines, and on-brand styling
- Write App Store-optimized copy (titles, descriptions, keywords) that follows Apple's rules
- Create a complete landing page with all assets bundled and ready to deploy
- Let you refine everything with a visual editor before export

**Result:** Go from finished code to App Store-ready in hours instead of weeks. Studio – Product Feature Overview

## Executive Summary

Independent builders sprint through product engineering only to stall at launch. Screenshots need framing, copy needs polishing, landing pages need crafting, and the App Store has unforgiving checklists. **Lemmi Studio** clears that final mile.

Named after the Latin *lemmī* (“I move forward”), Lemmi Studio is the AI-powered go-live kit that handles App Store storytelling from first screenshot to polished landing page. We automate the tedious parts without stealing your creative control, so you keep momentum all the way to “Ready for Sale.”

---

## 🎯 Core Features (Current Implementation)

### 1. AI-Powered Marketing Images
**What It Does:**
- Takes plain app screenshots and transforms them into professional App Store marketing images
- Adds device frames (iPhone, iPad) with your screenshots inside
- AI generates compelling headlines and subheadings based on screenshot content
- Automatically extracts accent colors from screenshots to keep branding consistent
- Applies professionally designed themes (gradients, solid colors, patterns)

**User Control:**
- Visual canvas editor to adjust text placement, rotation, and size
- Font customization (10+ font families available)
- Theme switching (Neon Gradient, Accent, Prism Burst, and more)
- Download individual images or bulk ZIP of all images

### 2. App Store Optimization (ASO) Copy Generation
**What It Does:**
- AI writes complete App Store copy following Apple's strict character limits and guidelines:
  - App Name/Title (30 characters max)
  - Subtitle (30 characters max)
  - Promotional Text (170 characters max)
  - Description (4000 characters max, with proper formatting)
  - Keywords (100 characters max, comma-separated)

**User Control:**
- Regenerate individual fields (title only, description only, etc.) without losing other edits
- Real-time character counters show compliance
- One-click copy-to-clipboard for each field
- Manual editing allowed at any time with autosave

### 3. Landing Page Generator
**What It Does:**
- Creates a complete marketing landing page with one click
- AI generates page content (hero text, feature highlights, benefits)
- Includes device mockups with your actual screenshots
- Supports custom logo upload (PNG, max 2MB)
- Provides multi-language support for static elements
- Bundles everything (HTML, CSS, images) into a downloadable ZIP

**User Control:**
- Input App Store ID for direct links
- Select which generated image to feature as hero
- Upload custom logo (optional)
- Preview before generating
- Re-generate with different settings without losing previous versions

### 4. Project Management & Workflow
**Dashboard:**
- Shows recent 5 projects with quick access
- Full project history with search and filters
- Device and language badges for quick identification

**Multi-Step Workflow:**
- **Step 1**: Upload screenshots (up to 10), set app details, choose language & device
- **Step 2**: AI describes each screenshot (optional, helps with context)
- **Step 3**: Studio view with 4 tabs:
  - **Images Tab**: View, edit, download marketing images
  - **App Store Content Tab**: View/edit ASO copy with character counts
  - **Project Overview Tab**: Manage project metadata and settings
  - **Landing Page Tab**: Generate and download landing page bundles

**Technical Features:**
- User authentication via Supabase (Google & GitHub OAuth)
- Cloud storage for all generated assets
- Version history for image edits
- Autosave for text content changes

---

## 🔄 Product Workflow

1. **Authenticate & Launch** – Log in with Supabase Auth. The Studio dashboard surfaces recent projects and quick-start CTA; Project History provides full search and filters.
2. **Step 1 · Upload** – Provide app metadata, choose language and device, and upload up to 10 screenshots. Client-side compression and aspect-ratio validation guarantee compliant assets.
3. **Step 2 · Describe** – Optionally auto-generate per-screenshot descriptions with AI, or edit manually to steer the prompt.
4. **Step 3 · Studio Tabs** –
	- **Images**: Review generated marketing images, download singles or the full ZIP, or launch the canvas editor for fine-tuning.
	- **Text Content**: Inspect AI copy with character counts, copy/share instantly, or regenerate specific fields.
	- **Overview**: Adjust project metadata, see creation/update timestamps, and manage deletion.
	- **Landing Page**: Configure App Store ID, pick a hero visual, upload a logo (2 MB limit), preview device mockups, and generate a fresh landing-page bundle.
5. **Export & Iterate** – Download Supabase-backed ZIPs, regen content on demand, or revisit any project later from the dashboard/history without losing context.

---

## 🎨 Design & Theming System

### Available Themes (10+ options)
Each theme includes carefully crafted gradients, solid colors, or patterns:
- **Neon Gradient** - Vibrant multi-color gradients
- **Accent** - Uses extracted screenshot colors
- **Prism Burst** - Geometric color patterns
- **Solid Colors** - Clean, minimal backgrounds
- **And more** - Curated library of professional themes

### Font Library
- Montserrat (modern, geometric)
- Farro (bold, contemporary)
- Lato (friendly, corporate)
- Inter (versatile, tech-forward)
- Open Sans (readable, universal)
- Headland One (distinctive, elegant)
- Plus 4+ more options

### Accent Color System
- Automatically extracts primary colors from uploaded screenshots
- Creates color palettes that match your app's branding
- Fallback to curated palettes if auto-detection isn't suitable
- Displays color chip on each generated image

---

## 💾 Technical Infrastructure

### Authentication & Security
- Supabase Auth with OAuth providers (Google, GitHub)
- Secure session management
- User-scoped data isolation
- GDPR-compliant data handling

### Storage & Performance
- Supabase Storage for all assets (images, ZIPs)
- CDN-delivered assets for fast downloads
- Version history for images (immutable updates)
- Automatic image compression
- Lazy loading for optimal performance

### AI Integration
- Google Gemini 2.0 Flash for:
  - Image description generation
  - Headline/subheading creation
  - App Store copy generation
  - Landing page content creation
- Context-aware prompts for brand consistency
- Character limit compliance built into AI prompts

### Multi-Language Support
**Currently Supported:**
- English
- French
- Polish  
- Spanish
- German
- Italian
- And more

AI generates ASO copy in selected language following platform-specific guidelines for that region.

---

## 📊 Use Cases & Target Users

### Primary Users
1. **Solo Indie Developers**
   - Built an app, need to launch professionally
   - Limited design or marketing experience
   - Want App Store-ready assets quickly

2. **Small Development Teams (2-5 people)**
   - Have engineering figured out
   - Need marketing assets for multiple apps
   - Want consistency across app portfolio

3. **Agencies/Studios**
   - Building apps for clients
   - Need to deliver complete launch packages
   - Multiple projects simultaneously

### Common Scenarios
- **New App Launch**: Complete go-to-market package from zero
- **App Update**: Refresh screenshots and copy for major version
- **Multi-Platform Launch**: Same app for iPhone + iPad with different assets
- **International Expansion**: Generate localized copy and landing pages
- **A/B Testing**: Create multiple variations of images/copy to test

---

## 📈 Key Benefits & Outcomes

### Speed
- **Before Lemmi Studio**: 5-10 days for professional assets
- **With Lemmi Studio**: 2-3 hours from screenshots to launch
- Save weeks of back-and-forth with designers and copywriters

### Quality
- Professional device mockups (not just plain screenshots)
- AI copy that follows App Store best practices
- Branded colors and themes automatically applied
- Compliant with Apple's character limits and formatting rules

### Cost Savings
- No hiring designers for mockups ($500-2000 per project)
- No copywriters for ASO content ($300-1000 per project)
- No web developer for landing page ($1000-5000 per project)
- **ROI**: One project pays for months of Lemmi Studio

### Flexibility & Control
- Generate AI content, then refine it your way
- Non-destructive editing (versions preserved)
- Download everything for use anywhere
- Full ownership of all generated assets

### Compliance & Confidence
- Character counters prevent App Store rejections
- Device frame accuracy ensures approval
- Preview before download
- Formatted descriptions match Apple guidelines

---

## 🚀 Current Product Status

### Fully Functional Features
✅ User authentication (Google, GitHub OAuth)  
✅ Project dashboard and history  
✅ Screenshot upload with validation  
✅ AI-powered marketing image generation  
✅ Visual canvas editor for images  
✅ AI-powered ASO copy generation  
✅ Individual field regeneration  
✅ Copy-to-clipboard functionality  
✅ Landing page generation with mockups  
✅ Logo upload support  
✅ Multi-language content generation  
✅ Downloadable ZIP exports  
✅ Cloud storage integration  
✅ Autosave functionality  
✅ Version history for images  
✅ Project deletion with confirmation  

### Architecture
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + Node.js
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **AI**: Google Gemini API
- **Authentication**: Supabase Auth
- **Deployment**: TBD (ready for production)

### Roadmap (Future Enhancements)
- App Store Connect API integration (direct upload)
- Video preview generation
- Social media asset generation
- Team collaboration features
- Analytics dashboard
- More device types (Android support)
- API access for automation

---

## 📋 What the Agency Needs to Know

### Landing Page Goals
The **marketing landing page** (what you're building) needs to:
1. Explain what Lemmi Studio does (transform screenshots → professional launch assets)
2. Show the value proposition (save time + money + stress)
3. Include clear CTA (Sign Up / Get Started)
4. Visual showcase of before/after (plain screenshot → professional marketing image)
5. Highlight key features (AI images, ASO copy, landing pages)
6. Social proof section (once we have testimonials)
7. Pricing information (TBD - likely freemium model)
8. FAQ section addressing common concerns

### Brand Voice
- **Target Audience**: Indie developers and small teams who care about quality but lack design/marketing skills
- **Tone**: Professional but approachable, technical but not intimidating
- **Key Message**: "You built the product. We'll help you launch it professionally."
- **Avoid**: Overpromising, complex jargon, generic SaaS language

### Visual Direction
- Clean, modern design
- Show the actual product in action (screenshots from the app)
- Device mockups prominent (iPhone/iPad frames)
- Before/after comparisons work well
- Dark mode support preferred (our app supports both light/dark)

### Logo & Assets
- Logo files provided: `logo_icon_black.png` and `logo_icon_white.png` (full logo with text)
- Favicon: `favicon.png` (just the icon)
- Brand color: Extracted from logo (can adjust based on your design needs)
- All font families used in the app are available for consistency

### Technical Integration
- Landing page should be separate from main app (different domain/subdomain)
- CTA buttons should link to app authentication: `https://app.lemmistudio.com/signup`
- Contact form optional but nice to have
- Email capture for waitlist/early access if we go that route

---

## 🎯 Success Metrics

For the launch, we're tracking:
- Sign-up conversion rate from landing page
- Time from sign-up to first project completion
- Projects created per user
- Download rates (images, landing pages)
- User retention (return visits)

The landing page's job is to drive qualified sign-ups from developers who have apps ready to launch.

---

**Questions?** Contact the Lemmi Studio team for clarification on any features or technical details.