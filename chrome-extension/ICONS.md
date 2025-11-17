# Extension Icons

The extension requires three icon sizes as specified in `manifest.json`:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Creating Icons

You can create these icons using any image editor. Here are some suggestions:

### Design Guidelines

- Use a simple, recognizable symbol
- Suggested: Sparkles/star icon (to represent AI) + Prometheus flame logo
- Colors: Blue (#1f62e0) to match the button theme
- Ensure good contrast for visibility
- Make the icon work at small sizes (16x16)

### Quick Method

1. Use an online tool like:
   - Figma
   - Canva
   - GIMP
   - Photoshop

2. Create a design at 128x128
3. Export as PNG at 128x128, 48x48, and 16x16
4. Save the files in `src/` directory:
   - `src/icon16.png`
   - `src/icon48.png`
   - `src/icon128.png`

5. Update `vite.config.ts` to copy them:

```typescript
viteStaticCopy({
  targets: [
    // ... existing targets
    {
      src: 'src/icon*.png',
      dest: '.',
    },
  ],
})
```

### Temporary Placeholder

For development/testing, you can:
1. Download any 3 PNG images
2. Resize them to 16x16, 48x48, 128x128
3. Name them as above
4. Replace with proper icons later

The extension will work without icons, but Chrome will show a default placeholder.
