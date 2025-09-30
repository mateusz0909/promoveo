---
applyTo: '**'
---
# AppStoreFire AI Agent Instructions

## Role
You operate as a senior full-stack engineer with deep expertise in React, TypeScript, Node.js/Express, Prisma, Supabase, Canvas-based graphics, and Gemini AI integrations. Prioritize maintainability, performance, UX quality, and clear communication. Treat the existing architecture as the source of truth and extend it without breaking contracts.

## Architecture at a Glance
- **Monorepo** managed through npm workspaces: `client/` (React) and `server/` (Express).
- **Client**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS 4, shadcn/ui, React Router 7, Sonner toasts, Hero Icons, local font stack.
- **Server**: Express 5, Prisma 6 with Supabase Postgres, Supabase Auth/Storage, `@google/genai` 1.19, `canvas` 3.2, `node-vibrant` 4.0, Archiver.
- **Shared tooling**: ESLint 9, Nodemon, dotenv, fs-extra, UUID, custom tmp directory management.

## End-to-End Workflow
1. **Upload** – Users authenticate with Supabase, provide app metadata, choose language/device, and upload screenshots (Step 1). Files are compressed in-browser before upload.
2. **Describe** – Optional AI-assisted screenshot descriptions are collected to improve prompt fidelity (Step 2 via `/api/images/generate-description`).
3. **Generate** – `/api/generate-and-save` (auth required) streams FormData (metadata + files). Gemini produces ASO copy; `imageGenerationService` builds framed marketing images; both originals and generated assets upload to Supabase Storage; Prisma persists project + image records.
4. **Edit** – Project workspace (Step 3) surfaces tabs for images, ASO content, project meta, and landing page tooling. Users can regenerate copy, fine-tune assets, and save changes back to the database.
5. **Refine Images** – `ImageEditor` (canvas) allows drag/drop positioning, font tweaks, theme swaps, and saves immutable image versions through `/api/projects/:projectId/images/:imageId`.
6. **Export** – Users download single images, project-wide ZIPs (`/api/download-images-zip` legacy or `/api/images/download/:projectId` authenticated), or generate AI-authored landing page bundles via `/api/projects/:id/landing-page`.

## Backend Surface
### Routes & Contracts
- **System** (`/`): root greeting, `/health-check` validates Prisma connectivity.
- **Content** (`/api` prefix):
  - `POST /generate-content` legacy disk-based flow.
  - `POST /generate-and-save` (auth, FormData) main workflow.
  - `POST /regenerate-with-ai` regenerates full ASO package.
  - `POST /regenerate-content-part` regenerates specific fields (`title`, `subtitle`, `promotionalText`, `description`, `keywords`).
  - `POST /regenerate-with-ai-legacy` kept for backwards compatibility.
  - `POST /download-images-zip` legacy unauthenticated ZIP download.
  - `GET /fonts` enumerates available font families (mapped to server font directories).
- **Images** (`/api/images`):
  - `POST /generate-description` (unauthenticated) produces screenshot copy.
  - `POST /regenerate-image`, `PUT /update-image-config` (auth) regenerate marketing images using stored configuration.
  - `GET /download/:projectId` (auth) streams Supabase-backed image ZIPs.
  - `POST /download-zip` and `POST /regenerate-legacy` exist for backward compatibility.
- **Projects** (`/api/projects`):
  - `GET /` lists user projects (supports `limit`, `sortBy=createdAt|updatedAt|name`, `order=asc|desc`).
  - `GET /:id` fetches a project with generated images.
  - `PUT /:id` updates metadata (`inputAppName`, `inputAppDescription`, etc.).
  - `PUT /:id/content` persists edited ASO JSON structures.
  - `DELETE /:id` removes project (TODO: Supabase cleanup).
  - `POST /:projectId/images/:imageId` saves edited image blobs (legacy but in use).
  - `POST /save-legacy` handles legacy project persistence.
  - Landing page helpers: `GET /:id/landing-page` returns stored config/meta; `POST /:id/landing-page` accepts FormData (`appStoreId`, `selectedImageId`, optional `logo`).
- **Users** (`/api/users`): profile CRUD, stats, account deletion (auth enforced).

All authenticated routes rely on `middleware/auth.js` which validates Supabase JWTs (`Authorization: Bearer <token>`) and attaches `req.user`.

### Services
- `geminiService` – Structured JSON prompts for ASO copy respecting Apple guidelines, formatting, character limits, multi-language support.
- `imageGenerationService` – Node Canvas pipeline that registers fonts, analyzes accent colors via `node-vibrant`, renders headings/subheadings, and composites device frames (`iPhone`, `iPad`). Offers mockup buffer helper for landing pages.
- `imageDescriptionService` – Sends screenshots to Gemini for descriptive text used in prompts.
- `storageService` – Supabase Storage helpers (upload, versioned replace, temp downloads, asset cleanup, project asset helpers).
- `landingPageAIService` – Gemini prompts producing structured landing page content plus translated static text.
- `landingPageService` – EJS templating + asset packaging, generates device mockups using server Canvas before ZIP creation.
- `zipService` – Wraps Archiver to build downloadable bundles.
- `tmpService` – Central temp directory management with scheduled cleanup, path safety, and helper writers.
- `fileUploadService` – Multer configuration for memory/disk strategies.

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
  id                  String    @id @default(cuid())
  name                String
  inputAppName        String
  inputAppDescription String
  language            String?
  device              String?
  generatedAsoText    Json?
  landingPageConfig   Json?
  landingPageZipUrl   String?
  landingPageZipUpdatedAt DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  generatedImages     GeneratedImage[]
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
### Application Shell & Context
- `AppRouter` gates routes through `AuthRouter` and `ProtectedRoute`, sharing layout via `MainLayout`.
- Contexts: `AuthContext` (Supabase session), `ProjectContext` (selected project metadata for top panels), `BreadcrumbContext`, theme toggles, file upload helpers.
- `StudioHome` dashboard surfaces recent projects with quick navigation; `ProjectHistory` provides searchable archive.

### Project Workspace (multi-step)
1. **Step1** – Intake form + screenshot gallery (`GalleryUpload`) with Dropzone + client compression; validates portrait aspect ratios per selected device (iPhone/iPad). Language options: English, Spanish, French, German, Japanese, Polish.
2. **Step2** – Screenshot description grid with AI auto-fill button per image. Loading states handled via `GeneratingContent` spinner when generation runs.
3. **Step3** – Tabbed studio (`Tabs` component) exposing:
   - **ImagesTab** – Lazy-loaded gallery with hover actions (download, edit), optional view of original screenshots, ZIP download, accent color chips.
   - **AppStoreContentTab** – Sectioned ASO editor with character counters, copy actions, per-field regeneration hitting `/api/regenerate-content-part`, inline editing with validation.
   - **ProjectOverviewTab** – Metadata cards (created/updated timestamps, language/device), autosave-on-blur for name/description, danger zone for deletion, badges for counts.
   - **LandingPageTab** – Form for App Store ID, hero image selection, optional logo upload (2 MB limit). Fetches/saves config, tracks previous build timestamp, generates and downloads landing page ZIP, reuses existing assets, renders live previews using canvas helpers.

### Image Editing Stack
- `ImageEditor` dialog uses canvas via `useImageEditor` hook: caches device mockups, wraps text, tracks draggable elements (mockup/heading/subheading), highlights hover/drag states.
- Themes defined in `constants/imageThemes.ts` with accent, gradient, ribbon overlays. Selections update heading/subheading colors and backgrounds, with accent fallback to extracted palette or default `#4F46E5`.
- Saving posts FormData blob to `/api/projects/:projectId/images/:imageId`, stores configuration (positions, fonts, colors, theme). Supabase Storage responds with immutable URLs; client clears caches to avoid stale content.

### Additional UX Notes
- All multiline copy rendered with `whitespace-pre-wrap` to respect server-sent formatting.
- Toast feedback via Sonner for copy, download, errors.
- Large assets load through `LazyImage` and `ImageZoom` for performance and accessibility.
- Sidebar navigation mirrors route segments (`/project/:id/{images|text-content|overview|landing-page}`) to keep tabs deep-linkable.

## Environment & Tooling
- **Local dev**: `npm run dev` (concurrently runs client + server), or `npm run dev --workspace=client|server` individually.
- **Build**: `npm run build --workspace=client` (tsc references `tsconfig.app.json`). Server currently runs directly via Node; add build steps if TS introduced.
- **Lint**: `npm run lint --workspace=client` using flat ESLint config.
- **Fonts**: Add files to both `client/public/fonts/<Family>/` and `server/assets/fonts/<Family>/`; update CSS (`client/src/index.css`) and server font mapping in `imageGenerationService`. Use consistent naming (`Family-Weight.ttf`).
- **Env vars** (store in `.env`): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, optional TMP controls (`TMP_MAX_FILE_AGE_HOURS`, `TMP_CLEANUP_INTERVAL_MINUTES`).

## Coding Guidelines
1. **Investigate before editing** – Trace symbols across client and server before altering shared types like `GeneratedText` or API payloads.
2. **Maintain API contracts** – Any backend response change requires corresponding frontend updates. Keep JSON keys stable unless coordinated.
3. **Respect MVC/service separation** – Put business logic in services; controllers only orchestrate HTTP concerns.
4. **Preserve UX patterns** – Use hover-reveal buttons, consistent spacing (Tailwind), accessible labels, meaningful toasts. Follow existing shadcn/ui composition patterns.
5. **Use official tooling** – Install new UI primitives via `npx shadcn@latest add <component>`; do not paste from the docs.
6. **Icon discipline** – Use Hero Icons (`@heroicons/react/24/outline` or `/solid`), typical size `h-4 w-4` unless a design calls for larger.
7. **Formatting standards** – For AI-generated copy, preserve double line breaks for paragraphs and single line breaks for bullet lists. Ensure character limits remain within App Store constraints.
8. **Error handling** – Provide actionable messages, log failures server-side, and surface friendly toasts client-side. Use fallbacks (default fonts, colors) when external resources fail.
9. **Authentication awareness** – Client fetches that reach protected endpoints must pass the Supabase access token. Keep anonymous helpers (`/api/images/generate-description`, legacy ZIP) unchanged unless product decision.
10. **Temp file hygiene** – When creating files under `tmp/`, rely on `tmpService` helpers and schedule cleanup if leaving background tasks.

## Validation & Quality
- After modifying runnable code, build or run targeted checks (e.g., `npm run lint --workspace=client`, quick smoke by loading project workspace) whenever feasible.
- Maintain the zero-test baseline consciously; if you introduce tests ensure they run via npm scripts.


Stay aligned with this reference whenever you extend AppStoreFire. Keep the experience polished for indie developers relying on AI-assisted marketing.