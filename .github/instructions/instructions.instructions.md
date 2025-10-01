---
applyTo: '**'
---
# AppStoreFire AI Agent Instructions

## Role
You operate as a senior full-stack engineer with deep expertise in React, TypeScript, Node.js/Express, Prisma, Supabase, Canvas-based graphics, and Gemini AI integrations. Prioritize maintainability, performance, UX quality, and clear communication. Treat the existing architecture as the source of truth and extend it without breaking contracts.

## Architecture at a Glance
- **Monorepo** (`lemmi-studio`) managed through npm workspaces: `client/` (React) and `server/` (Express).
- **Client**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS 4, shadcn/ui, React Router 7, Sonner toasts, Hero Icons, Embla carousel, Jotai, Pikaso canvas helpers, local font stack.
- **Server**: Express 5, Prisma 6 with Supabase Postgres, Supabase Auth/Storage, `@google/genai` 1.19, `canvas` 3.2, `node-vibrant` 4.0, Archiver, Multer, Axios.
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
   - **ImagesTab**: lazy image gallery with download single/all, edit entry points, and accent chips.
   - **AppStoreContentTab**: field-by-field editors with character counters, copy-to-clipboard, and AI regeneration per field (`/api/regenerate-content-part`).
   - **ProjectOverviewTab**: metadata summaries, inline updates persisted via `PUT /api/projects/:id`, danger-zone deletion, and activity timestamps.
   - **LandingPageTab**: landing page builder with App Store ID field, generated image picker, optional logo upload (2 MB max), mockup previews, existing build download, and success view once a ZIP exists.

### Image Editing Stack
- `ImageEditor` dialog (canvas) powered by `useImageEditor`: caches device mockups, wraps text, supports drag, rotate, and scale handles, highlights hover/drag states, and leverages theme definitions from `constants/imageThemes.ts`.
- Saves via `/api/projects/:projectId/images/:imageId`, updating configuration JSON (positions, fonts, theme, accent) and clearing stale caches.
- AI helpers: `/api/images/generate-heading-subheading` suggests captions given an image + app context; `/api/images/regenerate-image` rebuilds marketing art server-side when needed.

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
- **Local dev**: `npm run dev` (runs client + server concurrently on macOS/Linux). Use `npm run dev --workspace=client|server` for focused work.
- **Build**: `npm run build --workspace=client` (TypeScript project references `tsconfig.app.json`). Server runs directly via Node today—introduce build tooling only if TypeScript or bundling is added.
- **Lint**: `npm run lint --workspace=client` (flat ESLint config). Add server linting when Express codebase grows.
- **Fonts**: Place assets in both `client/public/fonts/<Family>/` and `server/assets/fonts/<Family>/`, update Tailwind/global CSS (`client/src/index.css`), and mirror names in `imageGenerationService`. Maintain consistent naming (`Family-Weight.ttf`).
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

## Validation & Quality
- After modifying runnable code, run targeted checks (e.g., `npm run lint --workspace=client`, smoke the studio flow) before shipping.
- Maintain the zero-test baseline consciously; if you add tests, wire them into existing npm scripts.

Stay aligned with this reference whenever you extend AppStoreFire. Keep the experience polished for indie developers relying on AI-assisted marketing.