#!/bin/bash

# Verification script for Grafana PromQL AI Assistant extension
# Run this to verify the extension is built and ready to load

echo "🔍 Verifying Grafana PromQL AI Assistant Extension..."
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ folder not found. Run 'npm run build' first."
  exit 1
fi
echo "✅ dist/ folder exists"

# Check required files
REQUIRED_FILES=(
  "dist/manifest.json"
  "dist/contentScript.js"
  "dist/background.js"
  "dist/overlay.js"
  "dist/styles/content.css"
  "dist/styles/overlay.css"
  "dist/ui/overlay.html"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    exit 1
  fi
  echo "✅ Found: $file"
done

echo ""
echo "🎉 Extension is ready to load!"
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist/' folder from this project"
echo "5. Open Grafana and edit a Prometheus query"
echo "6. Look for the '✨ AI Assistant' button"
echo ""
echo "📖 See README.md or QUICKSTART.md for more details"
