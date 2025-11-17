# Quick Start Guide

## First Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add extension icons** (required):
   - Create or download three PNG icons:
     - `icons/icon16.png` (16x16 pixels)
     - `icons/icon48.png` (48x48 pixels)
     - `icons/icon128.png` (128x128 pixels)
   - Place them in the `icons/` directory
   - These icons will appear in the Chrome extensions page

3. **Configure the assistant iframe URL**:
   - Open `src/config.ts`
   - Update `assistantIframeUrl` to point to your actual assistants-ui endpoint:
     ```typescript
     assistantIframeUrl: 'https://your-assistant-url.com/embed?mode=promql'
     ```
   - Update `messaging.allowedOrigin` if needed (it's auto-derived from the URL)

4. **Build the extension**:
   ```bash
   npm run build
   ```

5. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

6. **Test**:
   - Open a Grafana instance (matching the configured host patterns)
   - Navigate to a dashboard with a Prometheus datasource
   - Edit a panel - you should see the "AI Assistant" button
   - Click it to open the overlay

## Development Workflow

1. **Make changes** to source files in `src/`

2. **Rebuild** (or use watch mode):
   ```bash
   npm run build
   # OR
   npm run dev  # watches for changes
   ```

3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension card
   - Refresh the Grafana page

4. **Run tests**:
   ```bash
   npm test
   ```

## Common Issues

### Build fails
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (requires 18+)

### Button doesn't appear
- Check browser console for errors
- Verify you're on a Grafana page with Prometheus datasource
- Check that host patterns in `manifest.json` match your Grafana URL
- Verify editor selectors in `config.ts` match your Grafana version

### Overlay doesn't open
- Check that `pageContextBridge.js` is loading (Network tab in DevTools)
- Verify the iframe URL is accessible and CORS is configured correctly
- Check browser console for errors

### Query doesn't insert
- Verify the editor is detected (check console logs)
- Ensure the query input element selector matches your editor type
- Check that events are being dispatched (use DevTools Event Listeners panel)
