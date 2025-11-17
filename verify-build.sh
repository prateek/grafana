#!/bin/bash

echo "==================================="
echo "Grafana Prometheus AI Assistant"
echo "Build Verification Script"
echo "==================================="
echo

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found. Run 'npm run build' first."
  exit 1
fi

echo "✅ dist/ directory exists"

# Check required files
REQUIRED_FILES=(
  "dist/manifest.json"
  "dist/background.js"
  "dist/contentScript.js"
  "dist/overlay.js"
  "dist/styles/content.css"
  "dist/styles/overlay.css"
  "dist/ui/overlay.html"
)

ALL_FOUND=true
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (missing)"
    ALL_FOUND=false
  fi
done

echo

if [ "$ALL_FOUND" = false ]; then
  echo "❌ Some required files are missing"
  exit 1
fi

echo "✅ All required files present"
echo

# Check file sizes
echo "File sizes:"
du -h dist/background.js dist/contentScript.js dist/overlay.js 2>/dev/null

echo
echo "==================================="
echo "✅ Build verification complete!"
echo "==================================="
echo
echo "Next steps:"
echo "  1. Open Chrome and go to chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the 'dist' folder"
echo
echo "Configuration:"
echo "  - Edit src/config.ts to set ASSISTANT_IFRAME_URL"
echo "  - Rebuild after changes: npm run build"
echo
