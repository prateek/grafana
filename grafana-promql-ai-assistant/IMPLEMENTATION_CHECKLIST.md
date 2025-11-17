# Implementation Checklist

## ✅ Completed

### Core Functionality
- [x] Manifest V3 configuration
- [x] TypeScript setup with proper types
- [x] Content script with editor detection
- [x] Page context bridge for overlay management
- [x] Editor detection (Monaco, CodeMirror, textarea)
- [x] Query injection with event dispatching
- [x] Editor registry with cleanup
- [x] Button injection into editor toolbars
- [x] Overlay UI with iframe integration
- [x] postMessage communication protocol
- [x] SPA navigation handling (MutationObserver)
- [x] Multiple editor support

### Build & Development
- [x] Vite build configuration
- [x] TypeScript compilation
- [x] Asset copying (manifest, styles, icons)
- [x] Development scripts (build, dev, test)
- [x] Linting and formatting setup

### Testing
- [x] Editor detection tests
- [x] Query injection tests
- [x] Registry management tests
- [x] Type guard tests
- [x] Vitest + jsdom setup

### Documentation
- [x] README with setup instructions
- [x] QUICKSTART guide
- [x] Configuration documentation
- [x] Communication protocol documentation
- [x] Troubleshooting guide

### Configuration
- [x] Centralized config.ts
- [x] Configurable selectors
- [x] Configurable iframe URL
- [x] Configurable host patterns
- [x] Configurable overlay behavior

## 📋 Before First Use

### Required Steps
1. [ ] Add extension icons:
   - `icons/icon16.png` (16x16)
   - `icons/icon48.png` (48x48)
   - `icons/icon128.png` (128x128)

2. [ ] Configure assistant iframe URL in `src/config.ts`:
   ```typescript
   assistantIframeUrl: 'https://your-actual-url.com/embed?mode=promql'
   ```

3. [ ] Install dependencies:
   ```bash
   npm install
   ```

4. [ ] Build the extension:
   ```bash
   npm run build
   ```

5. [ ] Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `dist/` directory

### Optional Customization
- [ ] Adjust editor selectors in `config.ts` if needed for your Grafana version
- [ ] Customize button label or styling
- [ ] Adjust overlay size or behavior
- [ ] Add custom host patterns if needed

## 🧪 Testing Checklist

### Manual Testing
- [ ] Extension loads without errors
- [ ] Button appears in Prometheus query editors
- [ ] Overlay opens when button is clicked
- [ ] Iframe loads correctly
- [ ] Context message is sent to iframe
- [ ] Query suggestion is received and inserted
- [ ] Multiple editors work independently
- [ ] SPA navigation doesn't break functionality
- [ ] Editor cleanup works when panels are removed

### Automated Testing
- [ ] All unit tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`

## 🔧 Known Limitations & Future Enhancements

### Current Limitations
- Icons must be manually added (not generated)
- Iframe URL must be configured manually
- Editor selectors may need adjustment for different Grafana versions
- No built-in error reporting/analytics

### Potential Enhancements
- [ ] Auto-detect Grafana version and adjust selectors
- [ ] Add options page for user configuration
- [ ] Support for other query languages (Loki, InfluxDB, etc.)
- [ ] Keyboard shortcuts
- [ ] Overlay resizing/dragging
- [ ] Query history
- [ ] Better error handling and user feedback
- [ ] Integration tests with Playwright/Puppeteer

## 📝 Notes

- The `overlay.ts` and `overlay.html` files in `src/ui/` are reference implementations and not currently used. The overlay is created dynamically in `pageContextBridge.ts`.
- The extension uses defensive programming to handle different Grafana versions, but selectors may need adjustment if Grafana's DOM structure changes significantly.
- All communication uses validated postMessage with origin checking for security.
