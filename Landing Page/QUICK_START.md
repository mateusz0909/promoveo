# 🚀 Quick Start Guide - Lemmi Studio Landing Page

This is your **ready-to-use** landing page for Lemmi Studio (AppStoreFire).

## ✅ What's Been Done

- ✅ Updated all copy to match your `_landing_page_content.md`
- ✅ Configured for static export (no server required)
- ✅ Removed authentication (Clerk) - not needed for landing page
- ✅ Updated navigation links to point to your React app
- ✅ Customized branding (Lemmi Studio)
- ✅ Updated features, pricing, testimonials
- ✅ Added anchor links for smooth navigation
- ✅ Created build scripts and deployment guides

## 🎯 Immediate Next Steps

### 1. Test the Landing Page

```bash
cd lp_template/astra

# Install dependencies (if not done already)
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` - you should see the landing page!

### 2. Verify Links

The landing page has buttons that link to your React app:
- "Start Free" / "Get Started" → `http://localhost:5173/signup`
- "Sign In" → `http://localhost:5173/login`

**Make sure your React app is running** on port 5173 to test these links:

```bash
# In another terminal
cd ../../client
npm run dev
```

### 3. Build for Production

When you're ready to deploy:

```bash
# From lp_template/astra
npm run build
```

This creates an `out/` directory with static files.

### 4. Integrate with Express

See `DEPLOYMENT_GUIDE.md` in the project root for complete Express integration.

Quick version - add to your `server/index.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// API routes first
app.use('/api', apiRoutes);

// Landing page
const landingPagePath = path.join(__dirname, '../lp_template/astra/out');
app.use('/_next', express.static(path.join(landingPagePath, '_next')));
app.use('/icons', express.static(path.join(landingPagePath, 'icons')));
app.use('/assets', express.static(path.join(landingPagePath, 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(landingPagePath, 'index.html'));
});

// React app
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

## 📝 Customization

### Update Content

All content is in these files:

1. **Features, Pricing, Testimonials**: `src/constants/index.ts`
2. **SEO & Metadata**: `src/config/index.ts`
3. **Main Page Copy**: `src/app/(marketing)/page.tsx`
4. **Navigation**: `src/components/home/navigation/navbar.tsx`
5. **Footer**: `src/components/home/navigation/footer.tsx`

### Update Branding

Replace these files with your own:
- `public/icons/logo.svg` - Your logo
- `public/icons/favicon.ico` - Browser tab icon
- `public/assets/og-image.png` - Social media preview image

### Update Colors

Edit `src/styles/globals.css` to change the color scheme.

## 🔧 Configuration

### Environment Variables

**Development** (`.env.local` - already created):
```env
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

**Production** (`.env.production` - already created):
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Update the production URL when you deploy.

## 📦 Build Output

After running `npm run build`, you'll have:

```
out/
├── index.html           ← Landing page
├── _next/
│   └── static/         ← Optimized CSS/JS
├── icons/              ← Favicons
└── assets/             ← Images
```

This entire `out/` directory is what gets served by Express.

## 🧪 Testing Checklist

Start both apps and test:

1. **Landing Page Loads**
   - Visit: `http://localhost:3000/`
   - Check: All sections visible (Hero, Features, Pricing, etc.)

2. **Navigation Links Work**
   - Click: "Start Free" → Should redirect to React app signup
   - Click: "Sign In" → Should redirect to React app login
   - Click: Nav links (#features, #pricing, etc.) → Should scroll

3. **Responsive Design**
   - Test: Mobile view (DevTools)
   - Check: Navigation hamburger, responsive layout

4. **Content Accuracy**
   - Verify: All copy matches your content doc
   - Check: Pricing cards show correct plans
   - Check: Testimonials display properly

## 🚨 Troubleshooting

### "Cannot find module 'next/...'" errors in editor
- **This is expected** in VS Code while editing
- These resolve when Next.js runs (`npm run dev`)

### Links not working in development
- Make sure `NEXT_PUBLIC_APP_URL` is set in `.env.local`
- Ensure your React app is running on the specified port
- Check browser console for errors

### Build fails
```bash
# Clear everything and rebuild
rm -rf .next out node_modules
npm install
npm run build
```

## 📚 Documentation

- **Complete Deployment**: See `../../DEPLOYMENT_GUIDE.md`
- **Express Integration**: See `../../EXPRESS_INTEGRATION_GUIDE.js`
- **Build Script**: Run `../../build-all.sh` to build everything

## 🎉 You're Ready!

The landing page is **production-ready**. You can:

1. ✅ Run it locally (`npm run dev`)
2. ✅ Build it (`npm run build`)
3. ✅ Deploy it (follow `DEPLOYMENT_GUIDE.md`)

The design is modern, responsive, and optimized. All you need to do is:
- Customize any copy you want to change
- Replace logo/images with your own
- Build and deploy!

---

**Questions?** Check the main `DEPLOYMENT_GUIDE.md` or the detailed `README_LEMMI.md`.
