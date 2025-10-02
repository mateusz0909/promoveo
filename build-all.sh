#!/bin/bash

# Build script for complete AppStoreFire deployment
# Builds both the landing page (Next.js) and main app (React)

set -e  # Exit on error

echo "======================================"
echo "Building AppStoreFire Complete Stack"
echo "======================================"
echo ""

# Build Landing Page
echo "📄 Building Landing Page (Next.js)..."
cd lp_template/astra
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Landing page built successfully"
else
    echo "❌ Landing page build failed"
    exit 1
fi
cd ../..
echo ""

# Build React Client
echo "⚛️  Building React Client (Vite)..."
cd client
npm run build
if [ $? -eq 0 ]; then
    echo "✅ React client built successfully"
else
    echo "❌ React client build failed"
    exit 1
fi
cd ..
echo ""

echo "======================================"
echo "✨ Build Complete!"
echo "======================================"
echo ""
echo "Build artifacts:"
echo "  Landing page: lp_template/astra/out/"
echo "  React app:    client/dist/"
echo ""
echo "Next steps:"
echo "  1. Configure your Express server to serve both builds"
echo "  2. Test locally: npm run start (from server directory)"
echo "  3. Deploy to production"
echo ""
