#!/bin/bash
# Simple script to create placeholder icons using ImageMagick (if available)
# Or provides instructions for manual creation

if command -v convert &> /dev/null; then
  echo "Creating placeholder icons with ImageMagick..."
  mkdir -p icons
  
  # Create a simple icon with text
  convert -size 16x16 xc:#1f77b4 -pointsize 10 -fill white -gravity center -annotate +0+0 "AI" icons/icon16.png
  convert -size 48x48 xc:#1f77b4 -pointsize 24 -fill white -gravity center -annotate +0+0 "AI" icons/icon48.png
  convert -size 128x128 xc:#1f77b4 -pointsize 64 -fill white -gravity center -annotate +0+0 "AI" icons/icon128.png
  
  echo "Icons created successfully!"
else
  echo "ImageMagick not found. Please create icons manually:"
  echo "  - icons/icon16.png (16x16 pixels)"
  echo "  - icons/icon48.png (48x48 pixels)"
  echo "  - icons/icon128.png (128x128 pixels)"
  echo ""
  echo "You can use any image editor or online tool to create simple icons."
  echo "Suggested design: Blue background (#1f77b4) with white 'AI' text or sparkle icon."
fi
