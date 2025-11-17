# Grafana Prometheus AI Assistant

A Chrome extension that augments Grafana's default Prometheus query builder with an AI assistant, without modifying Grafana itself.

## Features

- 🔍 **Automatic Detection**: Detects Prometheus query editors in Grafana automatically
- 🎯 **Non-Invasive**: Injects an "AI Assistant" button into the query editor UI
- 💬 **Chat Interface**: Opens an overlay panel with an AI assistant for PromQL help
- 🔄 **Query Insertion**: AI can suggest queries that are inserted directly into the editor
- 📊 **Multi-Editor Support**: Handles multiple query editors on the same page
- 🎨 **Grafana-Native Styling**: Matches Grafana's UI design language
- 🌐 **SPA-Aware**: Works with Grafana's single-page application navigation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Chrome browser (or Chromium-based browser)
- A Grafana instance with Prometheus datasource

### Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd grafana-prometheus-ai-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Configuration

Before using the extension, you need to configure it to point to your AI assistant service.

### Basic Configuration

Edit `src/config.ts` to customize the extension behavior:

```typescript
export const config: Config = {
  // URL of your assistants-ui iframe
  ASSISTANT_IFRAME_URL: 'https://your-assistant-url.com/embed?mode=promql',

  // Allowed origins for postMessage (for security)
  ALLOWED_IFRAME_ORIGINS: [
    'https://your-assistant-url.com',
    'http://localhost:3000', // for development
  ],

  // Host patterns where extension runs
  GRAFANA_HOST_PATTERNS: [
    'https://*/grafana/*',
    'https://grafana.*/*',
    'http://localhost:*/*',
  ],

  // UI settings
  UI: {
    buttonLabel: 'AI Assistant',
    autoCloseOverlayOnInsert: false, // Close overlay after inserting query
    overlayZIndex: 10000,
  },

  // Enable debug logging
  DEBUG: true,
};
```

### Advanced: Adjusting Editor Detection

If the extension doesn't detect editors in your Grafana version, you can adjust the selectors in `config.ts`:

```typescript
PROM_EDITOR_SELECTORS: {
  // Add your Grafana-specific selectors here
  rootContainerSelectors: [
    '[data-testid="query-editor-row"]',
    '.query-editor-row',
    // Add custom selectors...
  ],
  
  prometheusIndicators: [
    '[data-testid*="prometheus"]',
    // Add custom indicators...
  ],
  
  queryInputSelectors: [
    'textarea[placeholder*="query"]',
    // Add custom input selectors...
  ],
}
```

### Host Permissions

To use the extension on your Grafana instance, update the host permissions in `src/manifest.json`:

```json
{
  "host_permissions": [
    "https://your-grafana-domain.com/*",
    "http://localhost:3000/*"
  ]
}
```

After changing configuration, rebuild the extension:

```bash
npm run build
```

Then reload the extension in Chrome (click the refresh icon on the extension card).

## Development

### Development Mode

Run the build in watch mode:

```bash
npm run dev
```

This will rebuild the extension automatically when you make changes. You'll need to reload the extension in Chrome after each build.

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test:watch
```

### Code Quality

Lint the code:

```bash
npm run lint
```

Format the code:

```bash
npm run format
```

## Architecture

### Project Structure

```
src/
├── manifest.json              # Extension manifest (Manifest V3)
├── config.ts                  # Centralized configuration
├── types.ts                   # TypeScript type definitions
├── background.ts              # Background service worker
├── contentScript.ts           # Main content script (runs on Grafana pages)
├── promEditorDetector.ts      # Logic for detecting Prometheus editors
├── ui/
│   ├── overlay.html          # Overlay page (minimal)
│   └── overlay.ts            # Overlay script
├── styles/
│   ├── content.css           # Styles for injected button
│   └── overlay.css           # Styles for overlay panel
└── tests/
    ├── setup.ts              # Test configuration
    ├── promEditorDetector.test.ts
    ├── contentScript.test.ts
    └── integration.test.ts
```

### How It Works

1. **Detection**: The content script uses a `MutationObserver` to detect when Prometheus query editors appear in the DOM.

2. **Injection**: When an editor is detected, an "AI Assistant" button is injected into the editor's toolbar.

3. **Overlay**: Clicking the button opens an overlay panel containing an iframe to the configured assistant URL.

4. **Communication**: The extension uses `postMessage` to communicate with the iframe:
   - Extension → Iframe: Sends current query context
   - Iframe → Extension: Receives query suggestions

5. **Query Insertion**: When a query is received, the extension programmatically sets the editor's value and triggers appropriate events so Grafana recognizes the change.

### Message Protocol

#### From Extension to Iframe

```typescript
{
  type: 'promql_context',
  editorId: string,
  currentQuery: string,
  datasource: 'prometheus'
}
```

#### From Iframe to Extension

```typescript
{
  type: 'promql_suggestion',
  editorId: string,
  query: string
}
```

## Troubleshooting

### Extension doesn't detect editors

1. Check that you're on a Grafana page with a Prometheus datasource
2. Open DevTools console and look for `[PromQL AI]` debug messages
3. Try adjusting `PROM_EDITOR_SELECTORS` in `config.ts` for your Grafana version

### Button doesn't appear

1. Verify the content script is running (check console)
2. Inspect the DOM to see if the editor structure matches the selectors
3. Try refreshing the page or navigating to a different dashboard

### Query insertion doesn't work

1. Different Grafana versions use different editor types (Monaco, CodeMirror, plain textarea)
2. The extension tries multiple methods; check the console for errors
3. You may need to adjust the `setQuery` logic in `promEditorDetector.ts`

### Overlay doesn't open

1. Check that `ASSISTANT_IFRAME_URL` is configured correctly
2. Verify the iframe URL is accessible (try opening it directly in a browser)
3. Check browser console for security errors

### postMessage not working

1. Ensure `ALLOWED_IFRAME_ORIGINS` includes your assistant's origin
2. Check that the iframe is loading successfully
3. Verify there are no CORS or CSP issues

## Browser Compatibility

This extension is built for Chromium-based browsers:
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Opera

Firefox support would require a separate build due to differences in Manifest V3 implementation.

## Security

### Origin Validation

The extension validates the origin of all postMessage events against the `ALLOWED_IFRAME_ORIGINS` list. Make sure to keep this list restrictive.

### Permissions

The extension requests minimal permissions:
- `scripting`: Required for content script injection
- Host permissions: Only for configured Grafana domains

### Data Handling

- The extension only sends query text to the assistant iframe
- No user data is stored locally or transmitted elsewhere
- All communication happens client-side

## Testing Against a Real Grafana Instance

### Using Docker

1. Start a Grafana instance with Prometheus:

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana
```

2. Access Grafana at `http://localhost:3000` (default credentials: admin/admin)

3. Add a Prometheus datasource and create a dashboard with a query panel

4. The extension should detect the query editor and inject the AI button

### Using Local Grafana

If you have Grafana installed locally, ensure the extension's host permissions match your Grafana URL.

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm test`)
2. Code is linted (`npm run lint`)
3. Code is formatted (`npm run format`)
4. New features include tests

## License

[Specify your license here]

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Note**: This extension requires an external AI assistant service (configured via `ASSISTANT_IFRAME_URL`). The extension itself does not provide AI capabilities; it only integrates with an existing assistant service.
