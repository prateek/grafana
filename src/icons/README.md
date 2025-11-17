# Extension Icons

Place your extension icons in this directory:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extensions page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons

You can use any design tool to create icons. Recommended:
- Simple, recognizable design
- Use blue/teal colors to match Grafana's branding
- Include a visual element suggesting AI or assistance (e.g., sparkles, chat bubble)

## Placeholder Icons

For development, you can generate simple placeholder icons using this command:

```bash
# Install ImageMagick if you don't have it
# Then create placeholder icons:
convert -size 16x16 xc:#33a2e5 icon16.png
convert -size 48x48 xc:#33a2e5 icon48.png
convert -size 128x128 xc:#33a2e5 icon128.png
```

Or use an online icon generator like:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/
