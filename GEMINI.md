# Project Scope

This project is a full-stack application designed to assist indie developers in creating compelling App Store marketing materials. It consists of a Node.js/Express backend and a React frontend.

## Backend Features:

-   **Google GenAI Integration**: Utilizes the `@google/genai` SDK for content generation, including App Store optimization (ASO) text (headings, descriptions, keywords).
-   **Database**: Uses Supabase for the database and Prisma as an ORM.
-   **Authentication**: Implements email/password and social logins (Google/GitHub) using Supabase Auth.
-   **Storage**: Uses Supabase Storage for storing user screenshots and generated images.
-   **Local Image Generation Service**: A custom service built with the `canvas` library to generate App Store images.
    -   **App Store Image Generation**: Creates images with custom fonts, text wrapping, left alignment, and an integrated iPhone mockup.
    -   **iPhone Mockup Integration**: Screenshots are placed inside an iPhone frame, resized, centered, and cropped with rounded corners to align with the frame.
-   **Image Description Generation**: Leverages Gemini to automatically generate descriptive text for uploaded screenshots.
-   **Font Customization**: Allows users to select different fonts for headings and subheadings on the generated images.
-   **Image Regeneration**: Provides an endpoint to regenerate images with different text or font settings without re-uploading screenshots.
-   **ZIP file download**: The user can download all images in one zip file.
-   **Modular Architecture**: The backend logic is divided into services for better organization: `geminiService`, `fileUploadService`, `imageGenerationService`, `imageDescriptionService`, `storageService` and `zipService`.
-   **API Endpoints**:
    -   `POST /api/generate-and-save`: The core endpoint that takes an app name, description, and screenshots to generate ASO text and images, and saves the entire project.
    -   `POST /api/generate-content`: An endpoint that takes an app name, description, and screenshots to generate ASO text and images.
    -   `POST /api/generate-image-description`: Generates a description for a single image.
    -   `POST /api/download-images-zip`: Bundles generated images into a single downloadable ZIP archive.
    -   `POST /api/regenerate-images`: Regenerates images with new headings and font styles.
    -   `POST /api/regenerate-with-ai`: Regenerates ASO text and images using AI.
    -   `GET /api/fonts`: Lists available fonts for image generation.
    -   `GET /api/projects`: Retrieves a list of all projects for a user.
    -   `GET /api/projects/:id`: Retrieves a single project by its ID.
    -   `DELETE /api/projects/:id`: Deletes a project by its ID.
    -   `POST /api/auth/signup`: User sign up.
    -   `POST /api/auth/login`: User login.
    -   `POST /api/save-project`: Saves the generated project data.
-   **Development Enhancements**: The server is configured to reload automatically on code changes using `nodemon`.
-   **Environment Variables**: API keys (e.g., `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) are loaded from a `.env` file using `dotenv`.

## Frontend Features:

-   **Project Management**:
    -   **Project List**: A central dashboard to view, manage, and delete all created projects.
    -   **Project Workspace**: A dedicated space to create new projects or edit existing ones.
-   **Multi-Step Workflow**: A user-friendly interface guides the user through a three-step process for creating new projects:
    1.  **Step 1: Input App Details**: Users provide the app name, description, and upload screenshots.
    2.  **Step 2: Describe Images**: Users can add descriptions for each screenshot, which are used to generate more accurate headings.
    3.  **Step 3: View Generated Content**: Displays the generated ASO text and images, with options to regenerate, customize, and download.
-   **Component-Based Architecture**: Built with React and Vite, featuring a clear separation of concerns with components like `Navbar`, `ProjectList`, and `ProjectWorkspace`.
-   **Routing**: Uses `react-router-dom` to handle client-side routing between the project list and workspace.
-   **UI Components**: Utilizes `shadcn/ui` for a modern and consistent look and feel, including components for buttons, labels, selects, and more.
-   **State Management**: Uses React hooks (`useState`) and `jotai` for global state management, along with `AuthContext` to manage the application's state, including the current step, form data, and generated content.
-   **API Integration**: Communicates with the backend to generate content, regenerate images, and download assets.
-   **Error Handling and Retries**: Implements a retry mechanism with exponential backoff when the backend model is overloaded.
-   **Theming**: Includes a theme provider for easy customization of the application's appearance using `next-themes`.

---

To ensure stability and prevent regressions, all code modifications—especially those generated by AI—must adhere to the following principles. The primary directive is: **Do not break existing functionality by ignoring dependencies.**

-   **Analyze Before You Edit:** Before modifying any file, understand its role and its connections to other parts of the application. A change in one component can have unintended consequences elsewhere. For example, editing the state handling in `FileUpload.tsx` must not break the form submission logic within the main `App.tsx` component.

-   **Trace Dependencies:** When asked to change a component, function, or state variable, you **must** first trace its usage across the entire codebase.
    -   *Example:* If you modify a state variable in `App.tsx` (e.g., the state holding the uploaded image files), you must verify that child components like `FileUpload.tsx` and the API submission logic are updated to correctly handle the new state structure.

-   **Respect the Frontend-Backend Contract:** The Node.js/Express backend and the React frontend have a clear and simple API contract defined at the `/api/generate-content` endpoint.
    -   When editing the frontend API call in `App.tsx`, ensure the `FormData` or JSON payload still matches what the `server/index.js` route expects (e.g., field names for screenshots, app name, and description).
    -   Conversely, do not change the backend's response structure without also updating the frontend component (`GeneratedContent.tsx`) that consumes and displays that data.

-   **Be Cautious with Core State Management:** The React state (`useState`, `useEffect`) within `App.tsx` serves as the application's single source of truth. Modifying its structure requires updating **every single component** that reads that state via props or sets it via callback functions.

-   **Preserve API Data Structures:** The JSON structure returned by the `/api/generate-content` endpoint is a critical data contract. Do not change the keys or data types in the response object (e.g., `generatedText`, `generatedImage`) without also updating the `GeneratedContent.tsx` component that consumes and displays that data. Any modifications must be applied to both the server and the client to maintain consistency.

-  **Use MCP** When adding new components always refer to shadcn mcp registry, where is the whole documentation about them. Do not copy paste component but install them using npx shadcn@latest add {component name}

- **Icons** Important!!! please always use Hero icons (https://heroicons.com/) that are already installed dependency !!!