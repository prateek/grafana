# Quick Start Guide

## Prerequisites
- Node.js 18+ and npm installed
- Chrome browser
- A Grafana instance to test with

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
cd chrome-extension
npm install
```

### 2. Configure Your AI Assistant URL
Edit `src/config.ts`:
```typescript
export const config = {
  ASSISTANT_IFRAME_URL: 'https://your-ai-assistant.example.com/embed?mode=promql',
  ASSISTANT_IFRAME_ORIGIN: 'https://your-ai-assistant.example.com',
  // ...
};
```

### 3. Build the Extension
```bash
npm run build
```

### 4. Load in Chrome
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist/` folder
6. ✅ Extension loaded!

### 5. Test It Out
1. Go to your Grafana instance
2. Open any dashboard
3. Edit a panel with Prometheus datasource
4. You should see "✨ AI Assistant" button
5. Click it to open the AI overlay

## Development Workflow

### Watch Mode (Auto-rebuild on changes)
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint & Format
```bash
npm run lint:fix
npm run format
```

### Reload Extension
After making changes:
1. Run `npm run build` (or use watch mode)
2. Go to `chrome://extensions/`
3. Click reload icon on your extension
4. Refresh Grafana tab

## Troubleshooting

**Button doesn't appear?**
- Check console for errors
- Verify you're editing a Prometheus query
- Adjust selectors in `src/config.ts` for your Grafana version

**Tests failing?**
```bash
npm test -- --reporter=verbose
```

**Build errors?**
```bash
npm run type-check
```

## Next Steps

1. **Add Icons**: See `ICONS.md` for creating extension icons
2. **Customize UI**: Edit `src/styles/content.css` and `overlay.css`
3. **Adjust Selectors**: Update `src/config.ts` for different Grafana versions
4. **Build AI Assistant**: Implement the iframe that receives/sends PromQL suggestions

## File Structure Overview

```
chrome-extension/
├── src/
│   ├── config.ts                 # ← Configure here first
│   ├── contentScript.ts           # Main extension logic
│   ├── promEditorDetector.ts      # Detects editors
│   └── styles/                    # Button & overlay CSS
├── tests/                         # 83 passing tests
├── dist/                          # Built extension (load this)
├── package.json                   # npm scripts
└── README.md                      # Full documentation
```

## Testing the Extension

### Manual Test Checklist
- [ ] Extension loads without errors
- [ ] Button appears in Prometheus query editor
- [ ] Button click opens overlay
- [ ] Overlay displays iframe
- [ ] Multiple editors get separate buttons
- [ ] Works after SPA navigation
- [ ] Overlay closes on backdrop click
- [ ] Overlay closes on X button

### Automated Tests
All 83 tests passing ✓

## Production Deployment

### Package for Distribution
```bash
npm run build
cd dist
zip -r ../grafana-promql-ai-assistant.zip .
```

Then distribute the ZIP file or publish to Chrome Web Store.

### Chrome Web Store
1. Create developer account
2. Upload ZIP file
3. Fill in store listing
4. Submit for review

## Support

- 📖 See `README.md` for full documentation
- 🐛 Check browser console for errors
- 🧪 Run tests: `npm test`
- ⚙️ Adjust config: `src/config.ts`

---

Built with TypeScript, Vite, and Vitest
