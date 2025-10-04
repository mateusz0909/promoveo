---
applyTo: '**'
---
# AppStoreFire AI Age- **Projects** (`/api/projects`)
  - `GET /` returns the authenticated user's projects with paging/sorting.
  - `GET /:id` fetches a single project plus generated assets.
  - `PUT /:id` updates metadata (`inputAppName`, `inputAppDescription`, etc.).
  - `PUT /:id/content` persists edited ASO JSON structures.
  - `PUT /:projectId/images/:imageId` **[NEW]** saves configuration JSON for studio editor (auto-save endpoint, no image regeneration).
  - `DELETE /:id` removes the project (Supabase cleanup still TODO).
  - `POST /:projectId/images/:imageId` uploads edited blobs (legacy canvas flow).
  - `POST /save-legacy` stores legacy project payloads.
  - `GET /:id/landing-page` returns stored config/meta; `POST /:id/landing-page` (auth + optional logo upload) rebuilds the landing page ZIP and caches download URLs + timestamps.ctions

## Role
You operate as a senior full-stack engineer with deep expertise in React, TypeScript, Node.js/Express, Prisma, Supabase, Canvas-based graphics, and Gemini AI integrations. Prioritize maintainability, performance, UX quality, and clear communication. Treat the existing architecture as the source of truth and extend it without breaking contracts.

## Project Scope & Current State

### What AppStoreFire Does
AppStoreFire is an AI-powered marketing asset generator for mobile app developers. It helps indie developers create professional App Store assets (marketing screenshots, ASO copy, landing pages) without design skills.

**Core Value Proposition:**
1. Upload app screenshots + basic info
2. AI generates marketing copy (titles, descriptions, keywords)
3. Visual editor creates framed, branded marketing images
4. Download ready-to-publish assets + landing page

### Current Implementation Status

**✅ Completed Features:**
- User authentication (Supabase Auth)
- Multi-step project creation workflow
- AI-generated ASO content (Gemini integration)
- Full-screen multi-screenshot canvas editor (auto-save)
- Real-time configuration persistence (no image regeneration on edit)
- Landing page generator with customization
- Project history and management
- Responsive UI with dark mode

**🚧 In Progress:**
- Phase 9: Download with on-demand image generation from stored configuration
- Background gradient editor UI (panel exists but not functional)
- Text color picker integration

**📋 Backlog:**
- Phase 10: Polish (keyboard shortcuts, tooltips, undo/redo)
- Screenshot upload/replace within editor
- Batch editing across multiple screenshots
- Template system for common design patterns
- Export to multiple App Store formats

### Development Setup

**Prerequisites:**
- Node.js 18+ (npm workspaces support)
- PostgreSQL database (via Supabase or local)
- Gemini API key (for AI content generation)
- Supabase account (for auth + storage)

**Environment Variables (.env in root):**
```bash
# Server
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
TMP_MAX_FILE_AGE_HOURS=24
TMP_CLEANUP_INTERVAL_MINUTES=60
```

**Installation:**
```bash
# Install all workspace dependencies
npm install

# Generate Prisma client
cd server
npx prisma generate
npx prisma migrate dev

# Start development (all workspaces)
cd ..
npm run dev
```

**Development Servers:**
- Client: http://localhost:5173 (Vite)
- Server: http://localhost:3001 (Express)
- Landing Page: http://localhost:3000 (Next.js)

**Key Commands:**
```bash
npm run dev              # Start all workspaces
npm run dev:client       # Client only
npm run dev:server       # Server only
npm run dev:lp           # Landing page only

npm run build --workspace=client    # Build React app
npm run build:lp                    # Build landing page

npm run lint --workspace=client     # Lint React app
npm run lint:lp                     # Lint landing page
```

### Tech Stack Summary

**Frontend (client/):**
- React 19 + TypeScript 5.8
- Vite 7 (build + dev server)
- Tailwind CSS 4 + shadcn/ui
- React Router 7 (routing)
- Canvas API (image rendering)
- Jotai (lightweight state)
- Sonner (toast notifications)

**Backend (server/):**
- Express 5 + Node.js
- Prisma 6 (ORM)
- Supabase (auth + storage)
- Google Gemini AI 1.19
- node-canvas 3.2 (server-side rendering)
- node-vibrant 4.0 (color extraction)
- Multer (file uploads)

**Landing Page (Landing Page/):**
- Next.js 15 + TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Static site generation

## Architecture at a Glance
- **Monorepo** (`lemmi-studio`) managed through npm workspaces: `client/` (React), `server/` (Express), and `Landing Page/` (Next.js marketing site).
- **Client**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS 4, shadcn/ui, React Router 7, Sonner toasts, Hero Icons, Embla carousel, Jotai, Pikaso canvas helpers, local font stack.
- **Server**: Express 5, Prisma 6 with Supabase Postgres, Supabase Auth/Storage, `@google/genai` 1.19, `canvas` 3.2, `node-vibrant` 4.0, Archiver, Multer, Axios.
- **Landing Page**: Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui components for marketing and public-facing content.
- **Shared tooling**: ESLint 9, Nodemon, dotenv, fs-extra, UUID, browser image compression, custom tmp directory management.

## End-to-End Workflow
1. **Launchpad** – Authenticated users land on `StudioDashboard`, pull recent projects, and can jump to `ProjectHistory` for full search/browse. Anonymous helpers (image description/heading generation) remain open.
2. **Step 1 · Upload** – Users supply app metadata, language, target device, and up to 10 screenshots. Client-side compression and aspect-ratio validation enforce portrait sizing per device.
3. **Step 2 · Describe** – Optional AI-assisted descriptions (`/api/images/generate-description`) enrich each screenshot. Manual edits persist before generation.
4. **Step 3 · Generate & Edit** – `/api/generate-and-save` (auth + FormData) creates an ASO package and framed marketing images while uploading originals and renditions to Supabase.
5. **Studio Tabs** – `ProjectContent` surfaces dedicated tabs for Images, App Store Content, Project Overview, and Landing Page tooling. Per-field regeneration, autosave, and project deletion live here.
6. **Refine Assets** – `ImageEditor` lets users reposition frames, tweak fonts/themes, and persist immutable versions through `/api/projects/:projectId/images/:imageId` with Supabase versioning.
7. **Publish & Reuse** – Users can download singles, authenticated ZIPs (`/api/images/download/:projectId`), legacy ZIP bundles, or generate landing-page packages via `/api/projects/:id/landing-page` (includes logo handling and stored metadata).

## Backend Surface
### Routes & Contracts
- **System** (`/`)
  - `GET /` root greeting.
  - `GET /health-check` validates Prisma connectivity.
- **Content** (`/api` prefix)
  - `POST /generate-content` legacy disk flow.
  - `POST /generate-and-save` (auth) main pipeline for ASO + images.
  - `POST /regenerate-with-ai` regenerates the full ASO bundle.
  - `POST /regenerate-content-part` targets `title`, `subtitle`, `promotionalText`, `description`, or `keywords` individually.
  - `POST /regenerate-with-ai-legacy` keeps historic clients working.
  - `POST /download-images-zip` legacy unauthenticated ZIP helper.
  - `GET /fonts` lists server-font families used by both canvas pipelines.
- **Images** (`/api/images`)
  - `POST /generate-description` (no auth) produces screenshot copy.
  - `POST /generate-heading-subheading` (no auth) drafts marketing headings from an image + app context.
  - `POST /regenerate-image` and `PUT /update-image-config` (auth) rebuild marketing images; `update-image-config` re-uploads Supabase versions and stores configuration JSON.
  - `GET /download/:projectId` (auth) streams Supabase-backed ZIPs.
  - `POST /download-zip` and `POST /regenerate-legacy` remain for backwards compatibility.
- **Projects** (`/api/projects`)
  - `GET /` returns the authenticated user’s projects with paging/sorting.
  - `GET /:id` fetches a single project plus generated assets.
  - `PUT /:id` updates metadata (`inputAppName`, `inputAppDescription`, etc.).
  - `PUT /:id/content` persists edited ASO JSON structures.
  - `DELETE /:id` removes the project (Supabase cleanup still TODO).
  - `POST /:projectId/images/:imageId` uploads edited blobs (legacy canvas flow).
  - `POST /save-legacy` stores legacy project payloads.
  - `GET /:id/landing-page` returns stored config/meta; `POST /:id/landing-page` (auth + optional logo upload) rebuilds the landing page ZIP and caches download URLs + timestamps.
- **Users** (`/api/users`)
  - Profile CRUD, stats aggregation, account deletion (all auth gated).

All authenticated routes rely on `middleware/auth.js`, which validates Supabase JWTs (`Authorization: Bearer <token>`) and attaches `req.user`.

### Services
- `geminiService` – Structured JSON prompting for ASO copy with Apple-compliant formatting, limits, and multilingual output.
- `imageGenerationService` – Node Canvas pipeline that registers fonts, extracts accent colors via `node-vibrant`, renders headings/subheadings, composites device frames, and returns accent metadata.
- `imageDescriptionService` – Uses Gemini to create screenshot descriptions **and** heading/subheading suggestions based on visual context.
- `storageService` – Supabase Storage helpers for uploads, versioned replaces, signed URLs, and cleanup.
- `landingPageAIService` – Gemini prompts that produce structured landing page content + translated static copy.
- `landingPageService` – EJS templating + Canvas mockups to assemble downloadable landing-page bundles.
- `zipService` – Archiver wrapper for marketing image ZIPs and legacy downloads.
- `tmpService` – Central temp directory lifecycle manager with scheduled cleanup.
- `fileUploadService` – Multer configuration supporting memory uploads and logo handling for landing pages.

### Data Model (Prisma excerpt)
```prisma
model User {
  id        String    @id @default(uuid())
  email     String?   @unique
  name      String?
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")
  projects  Project[]
}

model Project {
  id                       String    @id @default(cuid())
  name                     String
  inputAppName             String
  inputAppDescription      String
  language                 String?
  device                   String?
  generatedAsoText         Json?
  landingPageConfig        Json?
  landingPageZipUrl        String?
  landingPageZipUpdatedAt  DateTime?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
  userId                   String
  user                     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  generatedImages          GeneratedImage[]
}

model GeneratedImage {
  id                  String   @id @default(cuid())
  sourceScreenshotUrl String
  generatedImageUrl   String
  accentColor         String?
  configuration       Json?
  description         String?
  createdAt           DateTime @default(now())
  projectId           String
  project             Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

## Frontend Surface
### Application Shell & Navigation
- `AppRouter` branches between auth flows (`/login`, `/signup`) and the protected shell (`MainLayout` + `ProtectedRoute`).
- Contexts: `AuthContext` (Supabase session + fetch helpers), `ProjectContext` (current project metadata for top panels and landing page state), `BreadcrumbContext`, theme toggles, and upload utilities.
- Primary screens include `StudioHome` (recent projects launchpad), `ProjectHistory` (searchable archive with quick filters), `ProjectWorkspace` (multi-step studio), `SettingsPage`, and `PrivacyPolicyPage`.

### Project Workspace Flow
1. **Step 1 – Intake & Upload**
   - `Step1` couples `AppDescriptionForm` with `GalleryUpload`.
   - Enforces portrait aspect ratios per selected device, compresses images with `browser-image-compression`, and surfaces device-specific guidance.
2. **Step 2 – Describe Screenshots**
   - `Step2` shows a grid of thumbnails with editable descriptions and per-image "✨ Generate with AI" buttons hitting `/api/images/generate-description`.
   - Transitions to a `GeneratingContent` loader while the main generation request is in flight.
3. **Step 3 – Studio Tabs (`ProjectContent`)**
   - **ImagesTab**: Full-screen canvas editor (screenshots.pro-style) with multi-screenshot editing, unified gradient backgrounds, and real-time preview. Auto-saves configuration every 2 seconds.
   - **AppStoreContentTab**: field-by-field editors with character counters, copy-to-clipboard, and AI regeneration per field (`/api/regenerate-content-part`).
   - **ProjectOverviewTab**: metadata summaries, inline updates persisted via `PUT /api/projects/:id`, danger-zone deletion, and activity timestamps.
   - **LandingPageTab**: landing page builder with App Store ID field, generated image picker, optional logo upload (2 MB max), mockup previews, existing build download, and success view once a ZIP exists.

### Image Editing Stack (Studio Editor)
**Architecture:** Multi-screenshot canvas editor inspired by screenshots.pro, replacing the previous dialog-based single-image editor.

**Components:**
- `StudioEditorLayout` – Full-screen editor shell with top toolbar, left sidebar, bottom toolbar, and canvas area
- `StudioEditorContext` – Central state management for all screenshots, selections, view settings, and auto-save logic
- `MultiScreenshotCanvas` – Renders individual 1200×2600px canvases per screenshot with unified gradient backgrounds
- `EditorTopToolbar` – Context-aware toolbar showing TextToolbar or MockupToolbar based on selection, plus save status indicator
- `EditorLeftSidebar` – Icon-only sidebar with collapsible panels (Background, Screenshots, Layers)
- `EditorBottomToolbar` – Zoom controls and view settings
- `TextToolbar` – Font family selector, font size (10-128px), text input for heading/subheading
- `MockupToolbar` – Device frame selector, mockup scale slider

**Key Features:**
- **Auto-save with 2-second debounce** – Configuration persists to DB automatically after changes
- **Configuration-only saves** – Images NOT regenerated on save (performance optimization)
- **On-demand image generation** – Final images generated only when user downloads
- **Real-time canvas preview** – Client-side rendering at 1200×2600px, displayed at ~350px
- **Multi-element editing** – Drag heading, subheading, and device mockup independently
- **Font scaling** – 3.4x multiplier (toolbar size × 3.4 = canvas size) for proper visual scale
- **Text wrapping** – Automatic line breaks at 90% canvas width (1080px max)
- **Unified backgrounds** – Gradient or solid colors flow seamlessly across all screenshots
- **Visual save feedback** – "Saving..." (spinner) or "Saved" (green checkmark) in top toolbar

**Auto-Save Implementation:**
```tsx
// Debounced auto-save in StudioEditorContext
const isFirstRenderRef = useRef(true); // Skip first render
const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    return;
  }
  
  setIsSaving(true); // Show "Saving..." immediately
  
  const timeout = setTimeout(() => {
    saveConfiguration(); // API call after 2 seconds
  }, 2000);
  
  return () => clearTimeout(timeout);
}, [screenshots, global]);
```

**Configuration Storage (GeneratedImage.configuration):**
```json
{
  "heading": "Text content",
  "subheading": "Subtitle text",
  "headingFont": "Inter",
  "headingFontSize": 64,
  "subheadingFontSize": 32,
  "mockupX": 0, "mockupY": 0,
  "mockupScale": 1.0,
  "headingX": 100, "headingY": 100,
  "subheadingX": 100, "subheadingY": 200,
  "theme": "light",
  "deviceFrame": "iPhone 15 Pro",
  "backgroundType": "gradient",
  "backgroundGradient": {
    "startColor": "#667eea",
    "endColor": "#764ba2",
    "angle": 135
  }
}
```

**API Endpoint:**
- `PUT /api/projects/:projectId/images/:imageId` – Saves configuration JSON, no image regeneration

**Canvas Specifications:**
- Canvas size: 1200×2600px (full resolution)
- Display size: ~350px width (CSS scaling)
- Mockup base size: 700×1400px
- Font scaling: toolbar size × 3.4 = canvas size
- Text max width: 1080px (90% of canvas)

**AI Helpers:**
- `/api/images/generate-heading-subheading` – Suggests captions from image + app context
- `/api/images/regenerate-image` – Server-side image rebuild (legacy support)

### Landing Page Builder
- Fetches existing config via `/api/projects/:id/landing-page`, preserves last generated ZIP timestamp, and exposes quick download for the latest bundle.
- Device-aware mockup previews mirror server rendering, using canvas compositing of source screenshots in-frame.
- Validates App Store ID, generated image selection, and logo uploads before calling the landing page POST endpoint.
- On success, surfaces a completion view and stores logo metadata for later sessions.

### Additional UX Notes
- Textareas use `whitespace-pre-wrap` to preserve server formatting and double line breaks.
- Toast feedback via Sonner for fetch states, downloads, and errors.
- Large imagery loads through `LazyImage` and zoom interactions to balance fidelity and performance.
- Sidebar navigation mirrors route segments (`/project/:id/{images|text-content|overview|landing-page}`) to keep deep links stable.

## Environment & Tooling
- **Local dev**: `npm run dev` (runs client + server + landing page concurrently). Use `npm run dev:client`, `npm run dev:server`, or `npm run dev:lp` for focused work.
- **Build**: `npm run build --workspace=client` for the React app, `npm run build:lp` for the landing page (TypeScript project references `tsconfig.app.json`). Server runs directly via Node today—introduce build tooling only if TypeScript or bundling is added.
- **Lint**: `npm run lint --workspace=client` for the app, `npm run lint:lp` for the landing page (flat ESLint config). Add server linting when Express codebase grows.
- **Fonts**: Place assets in `client/public/fonts/<Family>/`, `server/assets/fonts/<Family>/`, and `Landing Page/public/fonts/<Family>/`, update Tailwind/global CSS (`client/src/index.css`), and mirror names in `imageGenerationService`. Maintain consistent naming (`Family-Weight.ttf`).
- **Env vars** (set via `.env`): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, optional TMP controls (`TMP_MAX_FILE_AGE_HOURS`, `TMP_CLEANUP_INTERVAL_MINUTES`).

## Coding Guidelines
1. **Investigate before editing** – Trace symbols across client and server before altering shared types like `GeneratedText`, `GeneratedImage`, or API payloads.
2. **Maintain API contracts** – Update both sides when changing response shapes. Keep JSON casing and enum values stable.
3. **Respect MVC/service separation** – Controllers orchestrate HTTP concerns; services own business logic and integrations.
4. **Preserve UX patterns** – Keep hover reveals, spacing (Tailwind), aria labels, and shadcn/ui composition consistent. Reuse shared UI primitives.
5. **Use official tooling** – Install new primitives via `npx shadcn@latest add <component>`; avoid copy-paste drift from docs.
6. **Icon discipline** – Prefer Hero Icons (`@heroicons/react/24/outline|solid`) at `h-4 w-4` unless design dictates otherwise.
7. **Formatting standards** – For AI copy, keep double line breaks between paragraphs and single line breaks for bullet-like content. Respect App Store character limits.
8. **Error handling** – Provide actionable client toasts, log server failures, and supply fallbacks (fonts, colors). Never swallow errors silently.
9. **Authentication awareness** – Protected fetches must include the Supabase access token (`Authorization: Bearer ...`). Anonymous helpers (`/api/images/generate-description`, `/api/images/generate-heading-subheading`, legacy ZIP) stay public.
10. **Temp file hygiene** – Always use `tmpService` helpers for temporary artifacts and allow scheduled cleanup to remove leftovers.

## Recent Major Changes (October 2025)

### Studio Editor Refactor
Transformed the image editor from a dialog-based single-image editor to a full-screen multi-screenshot canvas editor inspired by screenshots.pro.

**Key Architectural Changes:**
1. **Configuration-First Approach** – All edits save configuration JSON to DB, images generated only on download
2. **Auto-Save System** – 2-second debounced saves with visual feedback (no manual save button)
3. **Multi-Screenshot Canvas** – Edit all screenshots simultaneously with unified backgrounds
4. **Real-Time Preview** – Client-side canvas rendering at full resolution (1200×2600px)
5. **Layout Refactor** – Full-screen editor with context-aware toolbars and collapsible panels

**Implementation Highlights:**
- `StudioEditorContext` manages state for all screenshots + auto-save logic
- `isFirstRenderRef` prevents infinite loop by skipping initial mount
- Font scaling (3.4x multiplier) ensures visual consistency between toolbar and canvas
- Text wrapping at 90% canvas width (1080px) with multi-line support
- Mockup positioning and scaling with real-time drag handles
- Unified gradient backgrounds flow seamlessly across screenshots

**Breaking Changes:**
- Old `ImageEditor` dialog replaced with `StudioEditorLayout` full-screen editor
- `PUT /api/projects/:projectId/images/:imageId` now saves configuration only (no image generation)
- Images generated on-demand during download instead of on every edit

**Migration Notes:**
- Existing projects load configuration from `GeneratedImage.configuration` JSON field
- Legacy image URLs remain valid but may not reflect latest edits until regeneration
- Download triggers fresh image generation using stored configuration

**Performance Benefits:**
- 🚀 Instant feedback (no server round-trip for preview)
- 🚀 Reduced server load (no constant image regeneration)
- 🚀 Smaller payloads (JSON config vs. full images)
- 🚀 Faster editing workflow (auto-save + real-time preview)

### Known Issues & Workarounds

**Issue: Auto-save shows "Saving..." continuously**
- **Cause:** `saveConfiguration` in useEffect dependency array creates infinite loop
- **Fix:** Remove function from dependencies, add `isFirstRenderRef` to skip initial render
- **Code:** See `client/src/context/StudioEditorContext.tsx` lines 295-315

**Issue: Layout padding causes editor to be cramped**
- **Fix:** Conditional padding in `MainLayout.tsx` based on `/images` route
- **Code:** `${isEditorPage ? '' : 'py-6 pr-6 pl-6'}` for symmetric spacing

**Issue: Font sizes look wrong on canvas**
- **Cause:** Canvas renders at full 1200px but displayed at ~350px
- **Fix:** 3.4x font scaling multiplier for proper visual scale
- **Code:** `ctx.font = bold ${fontSize * 3.4}px ${fontFamily}`

## Validation & Quality
- After modifying runnable code, run targeted checks (e.g., `npm run lint --workspace=client`, smoke the studio flow) before shipping.
- Test auto-save: Make edits, wait 2 seconds, verify DB updates with configuration JSON
- Test canvas rendering: Ensure text wraps correctly, mockups scale properly, gradients flow across screenshots
- Test image generation: Download images, verify they match canvas preview
- dont create summary or summary documents unless explicitly requested!

