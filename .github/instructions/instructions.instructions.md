---
applyTo: '**'
---
# AppStoreFire AI Agent Instructions

## Role: You are an expert senior full-stack developer with deep knowledge of React, TypeScript, Node.js, Express, Prisma, Supabase, and AI integrations. You understand both frontend and backend architectures and can navigate complex codebases with ease. You are familiar with best practices in state management, API design, image processing, and UX/UI design patterns. You have experience working with AI models, particularly Gemini, and can implement structured prompting techniques. You are also proficient in using design systems like shadcn/ui and have a strong grasp of CSS and font management across client-server boundaries. You are detail-oriented and prioritize code quality, maintainability, performance, and user experience. You can effectively communicate technical concepts and collaborate with other developers to ensure the success of the project.

## Architecture Overview

**AppStoreFire** is an AI-powered App Store marketing content generator with a comprehensive monorepo structure:
- `client/` - React 19.1.1 + TypeScript + Vite frontend with shadcn/ui components, modern UX patterns, and responsive design
- `server/` - Node.js/Express API with MVC architecture, Prisma ORM, Supabase storage, Gemini AI integration, and landing page generation

### Complete Workflow
1. **User uploads screenshots** → Browser image compression → Supabase storage
2. **Gemini AI generates ASO content** → Well-formatted descriptions, titles, keywords with proper line breaks
3. **Server-side Canvas generates marketing images** → Font overlay + device mockups with color analysis
4. **ImageEditor allows real-time editing** → Canvas manipulation with drag/drop
5. **Landing page generation** → AI-powered content creation + EJS templates + ZIP download
6. **Enhanced UX** → Hover interactions, copy feedback, grouped content sections, progressive disclosure

## Current Development Environment

### Tech Stack
**Frontend (Client):**
- **React 19.1.1** - Latest React with concurrent features and improved performance
- **TypeScript 5.8.3** - Type safety and enhanced developer experience
- **Vite 7.1.2** - Ultra-fast build tool with hot module replacement
- **Tailwind CSS 4.1.13** - Latest utility-first CSS framework with enhanced features
- **shadcn/ui** - Modern component library built on Radix UI primitives
- **React Router Dom 7.9.1** - Client-side routing with modern patterns

**Backend (Server):**
- **Node.js** - Server runtime environment
- **Express 5.1.0** - Latest Express with enhanced async support
- **Prisma 6.16.1** - Modern database toolkit and ORM
- **Supabase** - Backend-as-a-service with PostgreSQL and authentication
- **Gemini AI (@google/genai 1.19.0)** - Google's latest AI model for content generation
- **Canvas 3.2.0** - Server-side image generation and manipulation
- **Node Vibrant 4.0.3** - Color analysis and extraction from images

**Development Tools:**
- **npm Workspaces** - Monorepo management with shared dependencies
- **Nodemon** - Automatic server restart during development
- **ESLint** - Code linting with modern TypeScript support
- **TypeScript 5.8.3** - Latest TypeScript compiler

## Current Architecture Patterns

### MVC Pattern with Service Layer (Server)
**Controllers** (`/server/controllers/`):
- `contentController.js` - Content generation and regeneration endpoints
- `imageController.js` - Image processing and Canvas generation
- `projectController.js` - Project management operations
- `userController.js` - User authentication and management

**Services** (`/server/services/`):
- `geminiService.js` - AI content generation with enhanced formatting prompts and schema validation
- `imageGenerationService.js` - Canvas-based image composition with font registration and color analysis
- `storageService.js` - Supabase file management with immutable URL versioning and temp file handling
- `fileUploadService.js` - Multer configuration for memory uploads with size and type validation
- `imageDescriptionService.js` - Screenshot analysis and AI-powered description generation
- `zipService.js` - Asset packaging and download functionality with archiver integration
- `landingPageService.js` - Complete landing page generation with EJS templating and asset bundling
- `landingPageAIService.js` - AI-powered landing page content generation using Gemini with structured JSON responses

**Routes** (`/server/routes/`):
- Modular route definitions with proper middleware integration
- Auth middleware applied consistently across protected endpoints

### Component Composition with Enhanced UX (Client)
**Current Structure:**
- Multi-step wizard pattern in `/client/src/pages/ProjectWorkspace.tsx`
- **Enhanced tabbed interface** with improved visual hierarchy and state management
- **Hover-reveal interactions** for cleaner UI with progressive disclosure
- **Real-time feedback** with loading states, copy confirmations, and status indicators

**Key Components:**
- `ProjectWorkspace.tsx` - Main workspace with 3-step wizard (upload → generate → edit)
- `AppStoreContentTab.tsx` - Content display with grouped sections, hover-reveal UX, and individual regeneration
- `ImagesTab.tsx` - Image gallery with download, edit, preview, and batch operations
- `ProjectOverviewTab.tsx` - Project metadata management, settings, and landing page generation
- `LandingPageTab.tsx` - Landing page preview and management (empty component, functionality in overview)
- `ImageEditor.tsx` + `useImageEditor.ts` - Canvas manipulation with cached device mockups
- `AuthRouter.tsx` + `AuthContext.tsx` - Supabase authentication with session management
- `ProjectList.tsx` - Dashboard showing all user projects with search and filtering
- `ProtectedRoute.tsx` - Route protection component for authenticated pages
- `UserMenu.tsx` - User dropdown with profile and logout options
- Custom UI components following shadcn/ui patterns with enhanced accessibility

**Page Structure:**
- `/` - Project dashboard (ProjectList)
- `/new-project` - Create new project workflow (ProjectWorkspace)
- `/project/:id` - Edit existing project (ProjectWorkspace)  
- `/login` - Authentication page
- `/signup` - User registration page
- `/settings` - User settings and preferences
- `/privacy` - Privacy policy page

**Component Architecture:**
- `Step1.tsx` - Screenshot upload with drag-drop and compression
- `Step2.tsx` - Content generation with app details form
- `Step3.tsx` - Content editing with tabbed interface (Content, Images, Overview)
- `Dropzone.tsx` - File upload component with preview
- `GeneratingContent.tsx` - Loading state during AI generation
- `UserMenu.tsx` - User dropdown with profile and logout options
- `Breadcrumb.tsx` - Navigation breadcrumbs with context awareness

**State Management:**
- **React Context** for authentication (`AuthContext`) and breadcrumbs (`BreadcrumbContext`)
- **Component-level state** for UI interactions (loading, copied states, form data)
- **Persistent forms** - Form state maintained across wizard steps
- **Canvas state caching** - Device mockups cached in `useImageEditor` hook
- **No global store** - Clean architecture with props drilling for simplicity

### Font System Architecture
**Comprehensive font management** across client/server with enhanced mapping:
- **Client**: CSS @font-face declarations + Google Fonts imports in `/client/src/index.css`
- **Server**: Node.js Canvas font registration with directory mapping system
- **Primary Fonts**: 
  - Display: `Martian Mono` (300, 400, 500 weights) for headings and UI elements
  - Text: `Geist Mono` (100-900 weights) for body text and content
- **Local Font Mapping**: 
  - `'Open Sans'` → `'Open_Sans'` folder
  - `'Nexa'` → `'Nexa-Font-Family'` folder
  - Standard fonts: Farro, Headland One, Inter, Lato, Montserrat, Roboto
- **Font Selection API**: `/api/fonts` endpoint provides available fonts to client
- **Tailwind Integration**: Custom font families accessible via `font-display`, `font-text`, `font-martian`, `font-geist` classes
- **Fallback System**: Graceful degradation to monospace fonts on loading failures

## Landing Page Generation System

### AI-Powered Landing Page Creation
**Complete landing page generation workflow** with AI content creation and professional templates:
- **`landingPageAIService.js`** - Gemini AI generates landing page content (headlines, features, CTA)
- **`landingPageService.js`** - EJS template compilation with dynamic content injection
- **EJS Template System** (`/server/templates/landing-page.ejs`) - Professional HTML template with CSS animations
- **Asset Bundling** - Includes CSS, JavaScript, fonts, and app screenshots in ZIP package
- **Download Endpoint** - `/api/projects/:id/landing-page` provides complete website download

### Landing Page Content Structure
```typescript
interface LandingPageContent {
  headline: string;        // Main hero headline
  subheadline: string;     // Supporting hero text
  features: Array<{        // Key features list
    title: string;
    description: string;
  }>;
  callToAction: string;    // Download/action button text
}
```

### Landing Page Features
- **Responsive Design** - Mobile-first CSS with desktop optimization
- **Professional Animations** - AOS (Animate On Scroll) library integration
- **App Screenshot Integration** - Automatically includes generated marketing images
- **SEO Optimized** - Proper meta tags and semantic HTML structure
- **Brand Consistency** - Uses app name, colors, and generated ASO content
- **Social Links** - Placeholder social media integration
- **Contact Forms** - Ready-to-customize contact sections
- **App Store Badges** - Download buttons for iOS/Android

## Enhanced AI Content Generation

### Gemini Integration with Advanced ASO
- **Structured JSON responses** with proper schema validation using GoogleGenAI SDK
- **Enhanced description formatting**: Prompts specify line breaks (`\n\n` for paragraphs, `\n` for lists)
- **Individual content regeneration**: Focused prompts for title, subtitle, description, keywords
- **App Store compliance**: Built-in ASO best practices with character limits enforcement
- **Multi-language support**: Dynamic prompt localization for global markets
- **Keyword optimization**: Natural integration without stuffing, unique singular keywords
- **User-centric benefits**: Focus on value propositions and unique differentiators

### Content Formatting Standards
**Description Format with Line Breaks:**
```
Opening hook sentence.

Key benefit paragraph with specific features.

Why it's different from competitors.

• Feature 1: benefit explanation
• Feature 2: benefit explanation  
• Feature 3: benefit explanation

Closing call-to-action paragraph.
```

**Character Limits (App Store Compliance):**
- Title: 30 characters (brand-driven + keywords)
- Subtitle: 30 characters (main benefit + secondary keywords)
- Promotional Text: 170 characters (compelling highlights)
- Description: 4000 characters (comprehensive with formatting)
- Keywords: Comma-separated, unique, no Apple defaults

## Critical Development Workflows

### Running the Application
```bash
# Root level - runs both client and server
npm run dev

# Individual services
npm run dev --workspace=client  # Vite dev server (port 5173)
npm run dev --workspace=server  # Nodemon (port 3001)
```

### Database Workflows
```bash
# Apply schema changes
npx prisma migrate dev --name "migration_name"
# Reset database (dev only)  
npx prisma migrate reset --force
# Generate Prisma client
npx prisma generate
```

### Font Management
When adding fonts, ensure consistency:
1. Add to both `/client/public/fonts/FontName/` and `/server/assets/fonts/FontName/`
2. Use standard naming: `FontName-Regular.ttf`, `FontName-Bold.ttf`
3. Update CSS @font-face in `/client/src/index.css`
4. Update font mapping in `/server/services/imageGenerationService.js`
```bash
# Root level - runs both client and server
npm run dev

# Individual services
npm run dev --workspace=client  # Vite dev server (port 5173)
npm run dev --workspace=server  # Nodemon (port 3001)
```

### Database Workflows
```bash
# Apply schema changes
npx prisma migrate dev --name "migration_name"
# Reset database (dev only)  
npx prisma migrate reset --force
# Generate Prisma client
npx prisma generate
```

### Font Management
When adding fonts, ensure consistency:
1. Add to both `/client/public/fonts/FontName/` and `/server/assets/fonts/FontName/`
2. Use standard naming: `FontName-Regular.ttf`, `FontName-Bold.ttf`
3. Update CSS @font-face in `/client/src/index.css`
4. Update font mapping in `/server/services/imageGenerationService.js`

## Current API Architecture

### Primary Endpoints
- **`/api/generate-and-save`** - Core workflow endpoint (auth → upload → AI → generation → storage)
- **`/api/regenerate-content-part`** - Individual content regeneration with focused prompts
- **`/api/regenerate-with-ai`** - Full content regeneration with current project context
- **`/api/projects`** - Project management (CRUD operations with user-scoped data)
- **`/api/projects/:id/landing-page`** - Landing page generation and ZIP download
- **`/api/images`** - Image processing, Canvas generation, and editing
- **`/api/users`** - User management and authentication
- **`/api/fonts`** - Available fonts endpoint with client-server mapping
- **`/api/system`** - System utilities and health checks

### Route Organization
- **`/routes/content.js`** - Content generation, regeneration, and font endpoints
- **`/routes/projects.js`** - Project CRUD operations and management
- **`/routes/images.js`** - Image processing, editing, and download functionality
- **`/routes/users.js`** - User authentication and profile management
- **`/routes/system.js`** - System utilities and monitoring

### API Patterns
- **Modular routing** - Routes organized by domain with clear separation
- **Controller-service separation** - Business logic in services, HTTP handling in controllers
## Current API Architecture

### Primary Endpoints
- **`/api/generate-and-save`** - Core workflow endpoint (auth → upload → AI → generation → storage)
- **`/api/regenerate-content-part`** - Individual content regeneration with focused prompts
- **`/api/regenerate-with-ai`** - Full content regeneration with current project context
- **`/api/projects`** - Project management (CRUD operations with user-scoped data)
- **`/api/projects/:id/landing-page`** - Landing page generation and ZIP download
- **`/api/images`** - Image processing, Canvas generation, and editing
- **`/api/users`** - User management and authentication
- **`/api/fonts`** - Available fonts endpoint with client-server mapping
- **`/api/system`** - System utilities and health checks

### Route Organization
- **`/routes/content.js`** - Content generation, regeneration, and font endpoints
- **`/routes/projects.js`** - Project CRUD operations and management
- **`/routes/images.js`** - Image processing, editing, and download functionality
- **`/routes/users.js`** - User authentication and profile management
- **`/routes/system.js`** - System utilities and monitoring

### API Patterns
- **Modular routing** - Routes organized by domain with clear separation
- **Controller-service separation** - Business logic in services, HTTP handling in controllers
- **Immutable URLs** - Image edits create new versioned files (`image_v1640995200000.jpg`)
- **Background cleanup** - Old image versions cleaned up async via `setImmediate()`
- **Multipart forms** - Screenshots as FormData, metadata as JSON strings
- **JWT Authentication** - Supabase session tokens for API security with `requireAuth` middleware

## Enhanced UX Patterns

### Modern Component Design
**AppStoreContentTab.tsx** - Recently optimized with:
- **Grouped content sections** (Basic Info, Marketing Content, SEO & Discovery)
- **Hover-reveal actions** - Buttons appear only on hover to reduce clutter
- **Visual feedback** - Copy confirmation with checkmarks, loading states
- **Contextual tooltips** - Clear guidance for each action
- **Proper content hierarchy** - Sectioned layout with descriptive headings

### Interaction Patterns
- **Progressive disclosure** - Actions revealed on interaction
- **Consistent spacing** - Tailwind space utilities for uniform layout
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Real-time feedback** - Loading states, copy confirmations, error handling

### State Management
- **React Context** for authentication (`AuthContext`) and breadcrumbs (`BreadcrumbContext`)
- **Component-level state** for UI interactions (loading, copied states, form data)
- **Persistent forms** - Form state maintained across wizard steps
- **Canvas state caching** - Device mockups cached in `useImageEditor` hook
- **No global store** - Clean architecture with props drilling for simplicity

## Text Display and Formatting

### Description Rendering
- **Frontend**: Uses `whitespace-pre-wrap` CSS class for proper line break display
- **Backend**: AI generates content with explicit `\n` and `\n\n` formatting
- **Consistency**: All multiline content uses the same rendering approach

### Content Structure
```typescript
interface GeneratedText {
  title: string;
  subtitle: string; 
  promotionalText: string;
  description: string; // Now supports formatted text with line breaks
  keywords: string;
  headings: {
    heading: string;
    subheading: string;
  }[];
}
```

### Canvas Rendering Patterns
Client-side (`useImageEditor.ts`):
```typescript
// Font preloading before canvas rendering
await document.fonts.load(`${fontSize}px "${fontFamily}"`);
context.font = `bold ${fontSize}px "${fontFamily}"`;
```

Server-side (`imageGenerationService.js`):
```javascript
// Dynamic font registration with fallback
registerFont(fontPath, { family: fontFamily, weight: 'bold' });
```

### Error Handling
- **Graceful font failures** - Falls back to default fonts (Farro/Headland One) when custom fonts fail to load
- **Upload validation** - Client-side compression + server-side multer limits with proper error messages
- **Auth middleware** - `requireAuth()` extracts Supabase user from JWT with comprehensive error handling
- **AI service resilience** - Rate limiting and error recovery for Gemini API with retry mechanisms
- **Content regeneration fallbacks** - Individual content part regeneration on failures with user feedback
- **Database transaction handling** - Proper Prisma error handling with cascading deletes
- **File upload security** - Memory storage with size limits and MIME type validation
- **Accent color fallbacks** - Graceful fallback to default colors when color extraction fails (`#4F46E5`)

## Integration Points

### Supabase Integration
- **Auth**: JWT tokens for API authentication with `requireAuth` middleware
- **Storage**: File uploads with user-scoped paths (`userId/filename`) 
- **Database**: PostgreSQL with Prisma migrations and user relations

### Database Schema (Prisma)
```prisma
model User {
  id        String    @id @default(uuid()) // Supabase auth user ID
  email     String?   @unique
  createdAt DateTime? @map("created_at")
  projects  Project[] // One-to-many relationship
}

model Project {
  id                  String    @id @default(cuid())
  name                String
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  inputAppName        String
  inputAppDescription String
  language            String?   // User-selected language for content
  device              String?   // Target device (iPhone/iPad)
  generatedAsoText    Json?     // ASO content as JSON
  
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String
  generatedImages   GeneratedImage[] // One-to-many relationship
}

model GeneratedImage {
  id                  String   @id @default(cuid())
  createdAt           DateTime @default(now())
  sourceScreenshotUrl String   // Original screenshot URL
  generatedImageUrl   String   // Generated marketing image URL  
  accentColor         String?  // Extracted background color
  configuration       Json?    // Font, heading, styling config
  
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String
}
```

### Gemini AI Integration  
- **Structured prompts** with ASO best practices and formatting specifications using GoogleGenAI SDK
- **Individual content regeneration** with focused, context-aware prompts for each content type
- **Language support** - Dynamic prompt localization for global markets
- **Rate limiting** - 503 handling for model overload with graceful error recovery
- **Content formatting** - Explicit line break and structure instructions for App Store compliance
- **ASO Guidelines Integration** - Keyword optimization, user-centric benefits, Apple guideline compliance

### External Dependencies
- **Node Canvas** - Server-side image generation (requires native compilation)
- **Sharp/Vibrant** - Color analysis for dynamic backgrounds  
- **Browser Image Compression** - Client-side file optimization before upload
- **EJS** - Server-side template engine for landing page generation
- **Archiver** - ZIP file creation for downloadable packages
- **UUID** - Unique identifier generation for projects and images
- **FS-Extra** - Enhanced file system operations with promises
- **Hero Icons** - Consistent iconography across the application
- **Radix UI** - Headless UI components for accessibility and interactions
- **Tailwind CSS** - Utility-first CSS framework with animations and custom themes
- **Sonner** - Toast notifications and user feedback
- **React Router Dom 7.9.1** - Client-side routing with modern patterns
- **Jotai** - Atomic state management (minimal usage)
- **Lucide React** - Additional icon set for enhanced UI
- **React Medium Image Zoom** - Image zoom functionality in galleries
- **React Resizable Panels** - Layout management components
- **React Dropzone** - Drag-and-drop file upload interface
- **Date-fns** - Modern date utility library for formatting
- **Embla Carousel React** - Touch-friendly carousel components
- **React Lazy Load Image Component** - Performance optimization for image loading

## File Structure Patterns
- **MVC separation**: Controllers handle HTTP, services contain business logic
- **Co-location**: Component + hook pairs (e.g., `ImageEditor.tsx` + `useImageEditor.ts`)
- **Service isolation**: Each server service is self-contained with clear responsibility
- **Asset management**: Fonts duplicated across client/server for rendering consistency
- **Type safety**: Shared interfaces between client/server (see `GeneratedText` interface)
- **Route modularity**: Separate route files for each domain (content, images, projects, users)

## Current Development Priorities

### UX/UI Excellence
- **Modern interaction patterns** with hover states and progressive disclosure
- **Consistent visual hierarchy** with proper content grouping
- **Accessibility compliance** with ARIA labels and keyboard navigation
- **Real-time feedback** for all user actions

### AI Content Quality
- **Enhanced prompting** for better formatted, structured content
- **Individual regeneration** capabilities for fine-tuned control
- **App Store optimization** with character limits and ASO best practices
- **Multi-language support** for global app markets

### Performance & Reliability
- **Image optimization** with proper compression and caching
- **Error resilience** across all external service integrations
- **Database transaction safety** with proper error handling
- **Background cleanup** for temporary files and old image versions

## Current Development Priorities

### UX/UI Excellence
- **Modern interaction patterns** with hover states and progressive disclosure
- **Consistent visual hierarchy** with proper content grouping
- **Accessibility compliance** with ARIA labels and keyboard navigation
- **Real-time feedback** for all user actions

### AI Content Quality
- **Enhanced prompting** for better formatted, structured content
- **Individual regeneration** capabilities for fine-tuned control
- **App Store optimization** with character limits and ASO best practices
- **Multi-language support** for global app markets

### External Dependencies
**Client Dependencies:**
- **@heroicons/react** - Consistent iconography across the application
- **@radix-ui** components - Headless UI components for accessibility and interactions (Alert Dialog, Avatar, Dialog, Dropdown Menu, Label, Radio Group, Select, Separator, Slot, Switch, Tabs, Tooltip)
- **@supabase/supabase-js** - Supabase client for authentication and storage
- **@tailwindcss/line-clamp** - Text truncation utilities
- **@tanstack/react-table** - Table components and data management
- **browser-image-compression** - Client-side file optimization before upload
- **class-variance-authority** - Type-safe component variants
- **clsx** - Conditional className utility
- **date-fns** - Modern date utility library for formatting
- **embla-carousel-react** - Touch-friendly carousel components
- **jotai** - Atomic state management (minimal usage)
- **lucide-react** - Additional icon set for enhanced UI
- **next-themes** - Theme switching functionality
- **react-dropzone** - Drag-and-drop file upload interface
- **react-lazy-load-image-component** - Performance optimization for image loading
- **react-medium-image-zoom** - Image zoom functionality in galleries
- **react-resizable-panels** - Layout management components
- **sonner** - Toast notifications and user feedback
- **tailwind-merge** - Tailwind CSS class merging utility
- **tailwindcss-animate** - Animation utilities for Tailwind

**Server Dependencies:**
- **@google/genai** - Google Gemini AI integration for content generation
- **@prisma/client** - Database client and ORM
- **@supabase/supabase-js** - Server-side Supabase integration
- **archiver** - ZIP file creation for downloadable packages
- **axios** - HTTP client for external API requests
- **canvas** - Server-side image generation (requires native compilation)
- **cors** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management
- **ejs** - Server-side template engine for landing page generation
- **express** - Web application framework
- **fs-extra** - Enhanced file system operations with promises
- **multer** - Multipart form data handling for file uploads
- **node-vibrant** - Color analysis for dynamic backgrounds
- **uuid** - Unique identifier generation for projects and images

### System Architecture
- **Clean separation of concerns** with MVC pattern
- **Scalable service architecture** for easy feature additions
- **Robust error handling** across all integration points
- **Performance optimization** with caching and async operations

## General Guidelines for Code Modifications

To ensure stability and prevent regressions, all code modifications—especially those generated by AI—must adhere to the following principles. The primary directive is: **Do not break existing functionality by ignoring dependencies.**

-   **Analyze Before You Edit:** Before modifying any file, understand its role and its connections to other parts of the application. A change in one component can have unintended consequences elsewhere. For example, editing the content structure in `AppStoreContentTab.tsx` must maintain compatibility with the content generation APIs.

-   **Trace Dependencies:** When asked to change a component, function, or state variable, you **must** first trace its usage across the entire codebase.
    -   *Example:* If you modify the `GeneratedText` interface, you must verify that both frontend components and backend services are updated to handle the new structure correctly.

-   **Respect the Frontend-Backend Contract:** The Node.js/Express backend and React frontend have well-defined API contracts:
    -   **Content Generation**: `/api/generate-and-save` and `/api/regenerate-content-part` endpoints expect specific payload structures
    -   **Authentication**: All protected endpoints require proper JWT token handling
    -   **Response Formats**: JSON responses must maintain consistent structure for frontend consumption

-   **Maintain MVC Architecture:** The current controller-service pattern must be preserved:
    -   Controllers handle HTTP requests/responses and validation
    -   Services contain business logic and external API interactions
    -   Routes define endpoint mappings with proper middleware

-   **UX Consistency:** All UI modifications must follow established patterns:
    -   Use hover-reveal interactions for secondary actions
    -   Implement proper loading states and feedback mechanisms
    -   Maintain consistent spacing and typography using Tailwind utilities
    -   Follow accessibility best practices with proper ARIA labels

-   **Content Formatting Standards:** When modifying AI content generation:
    -   Maintain proper line break formatting (`\n\n` for paragraphs, `\n` for lists)
    -   Preserve character limits for App Store compliance
    -   Ensure frontend components use `whitespace-pre-wrap` for formatted text display

-   **Use shadcn/ui Components:** When adding new UI components, always:
    -   Use `npx shadcn@latest add {component-name}` instead of copying code
    -   Follow established component patterns and theming
    -   Maintain consistent styling with existing components

-   **Icon Standards:** Use Hero Icons exclusively for consistency:
    -   Import from `@heroicons/react/24/outline` or `@heroicons/react/24/solid`
    -   Maintain consistent sizing (typically `h-4 w-4` or `h-3.5 w-3.5`)
    -   Use semantic icon choices that match their purpose

-   **Error Handling:** Implement comprehensive error handling:
    -   Graceful degradation for external service failures
    -   User-friendly error messages with actionable guidance
    -   Proper logging for debugging and monitoring
    -   Fallback mechanisms for critical functionality