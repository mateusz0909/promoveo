# Lemmi Studio Landing Page

This is the marketing landing page for Lemmi Studio, built with Next.js and configured for static export.

## Overview

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Export Type**: Static (no server required)
- **Deployment**: Can be served from Express or any static host

## Architecture

This landing page is a **standalone Next.js application** that will be built as static HTML/CSS/JS and served by your main Express server. It links to your React app's authentication routes (`/login`, `/signup`).

```
Landing Page (Next.js Static) → Links to → Main App (React + Vite)
     Served at: /                            Served at: /login, /signup, /projects, etc.
```

## Development Setup

### 1. Install Dependencies

```bash
cd lp_template/astra
npm install
# or
pnpm install
```

### 2. Configure Environment

The landing page needs to know where your main React app is running:

**For Development** (`.env.local`):
```env
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

**For Production** (`.env.production`):
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

## Building for Production

### Build the Static Site

```bash
npm run build
```

This creates an `out/` directory with static HTML, CSS, and JS files.

### Output Structure

```
out/
├── index.html
├── _next/
│   ├── static/
│   └── ...
├── icons/
├── assets/
└── ...
```

## Integration with Express Server

You need to configure your Express server to serve the static landing page at the root `/` while your React app handles authenticated routes.

### Express Configuration Example

Add this to your `server/index.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve landing page static files
app.use(express.static(path.join(__dirname, '../lp_template/astra/out')));

// API routes (should come before catch-all)
app.use('/api', apiRoutes);

// Serve React app for authenticated routes
app.use('/login', express.static(path.join(__dirname, '../client/dist')));
app.use('/signup', express.static(path.join(__dirname, '../client/dist')));
app.use('/projects', express.static(path.join(__dirname, '../client/dist')));

// Landing page catch-all (serve index.html for root)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../lp_template/astra/out/index.html'));
});

// React app catch-all for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### Better Approach: Route Priority

```javascript
// 1. API routes first
app.use('/api', apiRoutes);

// 2. Landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../lp_template/astra/out/index.html'));
});

// 3. Serve landing page static assets
app.use('/_next', express.static(path.join(__dirname, '../lp_template/astra/out/_next')));
app.use('/icons', express.static(path.join(__dirname, '../lp_template/astra/out/icons')));
app.use('/assets', express.static(path.join(__dirname, '../lp_template/astra/out/assets')));

// 4. React app for authenticated routes
app.use(express.static(path.join(__dirname, '../client/dist')));

// 5. React app catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

## Build Script for Full Deployment

Create `build-all.sh` at project root:

```bash
#!/bin/bash

echo "Building Landing Page..."
cd lp_template/astra
npm run build
cd ../..

echo "Building React Client..."
cd client
npm run build
cd ..

echo "Build complete!"
echo "Landing page: lp_template/astra/out/"
echo "React app: client/dist/"
```

Make it executable:
```bash
chmod +x build-all.sh
```

Run it:
```bash
./build-all.sh
```

## Content Management

The landing page content is configured in:

- **`src/constants/index.ts`** - Features, pricing, testimonials, steps
- **`src/config/index.ts`** - SEO metadata, site title, description
- **`src/app/(marketing)/page.tsx`** - Main page structure and copy
- **`src/components/home/navigation/navbar.tsx`** - Navigation links
- **`src/components/home/navigation/footer.tsx`** - Footer content

## Features

✅ **Hero Section** - "Stop Engineering, Start Shipping"
✅ **Problem Statement** - The finish line that isn't
✅ **How It Works** - 4-step process
✅ **Features** - AI visuals, ASO copy, landing pages
✅ **Pricing** - Free, Pro, Studio tiers
✅ **Testimonials** - Social proof from developers
✅ **Final CTA** - Newsletter signup

## Key Changes from Template

1. ✅ Removed Clerk authentication (not needed for landing page)
2. ✅ Configured for static export (`output: 'export'`)
3. ✅ Updated all copy to match AppStoreFire/Lemmi Studio
4. ✅ Changed CTAs to link to main app's auth routes
5. ✅ Updated branding (name, tagline, messaging)
6. ✅ Simplified middleware (no auth required)

## Navigation Flow

```
Landing Page (/) 
    ↓ Click "Start Free" or "Get Started"
    → /signup (React App)
    → User creates account
    → /projects (React App - authenticated)

Landing Page (/)
    ↓ Click "Sign In"
    → /login (React App)
    → User logs in
    → /projects (React App - authenticated)
```

## Customization

### Update Branding
- Logo: Replace `public/icons/logo.svg`
- Favicon: Replace `public/icons/favicon.ico`
- OG Image: Replace `public/assets/og-image.png`

### Update Colors
Edit `src/styles/globals.css` to change the color scheme.

### Update Copy
All marketing copy is in `src/app/(marketing)/page.tsx` and `src/constants/index.ts`.

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next out node_modules
npm install
npm run build
```

### Links Not Working
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify Express routing priority (API routes should come first)

### Styles Not Loading
- Ensure `express.static` middleware serves `_next/` directory
- Check browser console for 404 errors on static assets

## Production Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` in `.env.production`
- [ ] Build both landing page and React app
- [ ] Test all navigation links
- [ ] Verify Express routing serves landing page at `/`
- [ ] Test signup/login flow
- [ ] Check mobile responsiveness
- [ ] Verify SEO metadata (title, description, OG image)
- [ ] Test newsletter signup (if implemented)

## License

Same as main AppStoreFire project.
