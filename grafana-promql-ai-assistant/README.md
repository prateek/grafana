# Grafana PromQL AI Assistant Chrome Extension

A Chrome extension that augments Grafana's default Prometheus query builder UI with an AI assistant overlay. The extension injects an "AI Assistant" button into each Prometheus query editor, allowing users to interact with an AI-powered chat interface to generate and refine PromQL queries.

## Features

- **Automatic Detection**: Detects Prometheus query editors in Grafana dashboards, explore views, and panel edit views
- **Multiple Editor Support**: Handles multiple query editors on the same page independently
- **SPA Navigation**: Works seamlessly with Grafana's single-page application navigation
- **Editor Compatibility**: Supports Monaco, CodeMirror, and plain textarea editors
- **Overlay Chat Panel**: Opens a configurable overlay with an embedded AI assistant iframe
- **Query Injection**: Automatically inserts suggested queries into the editor and triggers Grafana's query refresh

## Project Structure

```
grafana-promql-ai-assistant/
├── src/
│   ├── manifest.json              # Chrome extension manifest (Manifest V3)
│   ├── background.ts              # Service worker (minimal)
│   ├── contentScript.ts           # Main content script logic
│   ├── pageContextBridge.ts       # Bridge script for page context
│   ├── config.ts                  # Central configuration
│   ├── types.ts                   # TypeScript type definitions
│   ├── promEditorDetector.ts      # Prometheus editor detection
│   ├── queryInjector.ts           # Query injection logic
│   ├── editorRegistry.ts          # Editor instance management
│   ├── ui/
│   │   └── overlay.html           # Overlay HTML (optional, not used in current implementation)
│   └── styles/
│       ├── content.css            # Styles for injected buttons
│       └── overlay.css            # Styles for overlay panel
├── tests/                         # Test files
├── dist/                          # Build output (generated)
└── package.json
```

## Prerequisites

- Node.js 18+ and npm
- Chrome or Chromium-based browser

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Configuration

All configuration is centralized in `src/config.ts`. Key settings:

### Assistant Iframe URL

```typescript
assistantIframeUrl: 'https://assistant.example.com/embed?mode=promql'
```

Update this to point to your actual assistants-ui endpoint.

### Host Patterns

The extension is configured to run on:
- `https://*/grafana/*`
- `https://grafana.*/*`
- `http://localhost:*/*`

To modify these, update `grafanaHostPatterns` in `config.ts` and the corresponding `matches` in `manifest.json`.

### Editor Selectors

If Grafana's DOM structure changes in future versions, you may need to adjust the selectors in `promEditorSelectors`:

```typescript
promEditorSelectors: {
  editorRowContainer: '.query-editor-row, [class*="query-editor"]',
  prometheusIndicator: '[class*="prometheus"], [data-datasource*="prometheus"]',
  queryInput: 'textarea.monaco-mouse-cursor-text, .CodeMirror textarea, textarea[class*="query"]',
}
```

### Overlay Behavior

```typescript
overlay: {
  autoCloseOnInsert: false,  // Set to true to auto-close after inserting a query
  iframeWidth: 600,
  iframeHeight: 700,
}
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

This will rebuild the extension automatically when source files change.

### Testing

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Usage

1. **Open Grafana** in your browser (on a configured host pattern)
2. **Navigate to a dashboard** or explore view with a Prometheus datasource
3. **Edit a panel** or create a new query
4. **Look for the "AI Assistant" button** in the Prometheus query editor toolbar
5. **Click the button** to open the overlay chat panel
6. **Interact with the AI assistant** to generate or refine PromQL queries
7. **Insert queries** by sending a `promql_suggestion` message from the iframe

## Communication Protocol

### Content Script → Iframe

When the overlay opens, the content script sends a context message:

```typescript
{
  type: 'promql_context',
  editorId: string,
  currentQuery: string,
  datasource: 'prometheus'
}
```

### Iframe → Content Script

To insert a query, the iframe sends:

```typescript
{
  type: 'promql_suggestion',
  editorId: string,
  query: string
}
```

The content script will:
1. Look up the editor by `editorId`
2. Inject the query using `setPromQuery()`
3. Optionally close the overlay (if `autoCloseOnInsert` is enabled)

## How It Works

1. **Content Script Injection**: The extension injects a content script on Grafana pages
2. **Editor Detection**: Uses `MutationObserver` to detect when Prometheus query editors appear in the DOM
3. **Button Injection**: Injects an "AI Assistant" button into each detected editor's toolbar
4. **Overlay Management**: When clicked, injects a bridge script into the page context that creates and manages the overlay
5. **Message Passing**: Uses `postMessage` and custom events to communicate between:
   - Content script ↔ Page context bridge
   - Page context bridge ↔ Iframe
6. **Query Injection**: Handles different editor types (Monaco, CodeMirror, textarea) and dispatches appropriate events

## Troubleshooting

### Button Not Appearing

- Check that you're on a Grafana page with a Prometheus datasource
- Verify the host pattern matches your Grafana URL
- Check the browser console for errors
- Ensure the editor selectors in `config.ts` match your Grafana version

### Query Not Inserting

- Verify the editor detection is working (check console logs)
- Ensure the query input element is being found
- Check that events are being dispatched correctly
- Try manually updating the selectors in `config.ts`

### Overlay Not Opening

- Check that `pageContextBridge.js` is being loaded (check Network tab)
- Verify the iframe URL is accessible
- Check browser console for CORS or security errors

## Testing Against Real Grafana

To test the extension against a real Grafana instance:

1. Set up a local Grafana instance (see [Grafana documentation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/))
2. Configure a Prometheus datasource
3. Create a dashboard with a Prometheus panel
4. Load the extension in Chrome
5. Navigate to the dashboard and edit the panel
6. Verify the "AI Assistant" button appears
7. Test the overlay and query injection

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers with Manifest V3 support

## Security Considerations

- The extension only requests minimal permissions (`scripting`, `activeTab`)
- Host permissions are limited to configured Grafana patterns
- `postMessage` communication validates origin before processing
- Iframe uses sandbox attributes for additional security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the repository.
