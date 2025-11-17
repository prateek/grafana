# Grafana PromQL AI Assistant Chrome Extension

A Chrome extension that augments Grafana's default Prometheus query builder UI with an AI assistant, without modifying Grafana itself.

## Overview

This extension:

- **Detects** Prometheus query editors in Grafana dashboards, explore views, and panel edit views
- **Injects** an "AI Assistant" button into each Prometheus query editor
- **Opens** an overlay chat panel when the button is clicked
- **Communicates** with an AI assistant iframe via `postMessage`
- **Inserts** suggested PromQL queries back into the editor programmatically

## Features

- ✅ Works with vanilla Grafana (no modifications required)
- ✅ Supports multiple query editors on the same page
- ✅ Handles SPA navigation via MutationObserver
- ✅ Compatible with Monaco and CodeMirror editors
- ✅ Secure postMessage communication with origin validation
- ✅ Configurable selectors for different Grafana versions
- ✅ Comprehensive test suite

## Project Structure

```
chrome-extension-promql-assistant/
├── src/
│   ├── manifest.json          # Chrome extension manifest (V3)
│   ├── background.ts          # Service worker (minimal)
│   ├── contentScript.ts       # Main content script entry point
│   ├── config.ts              # Centralized configuration
│   ├── types.ts               # TypeScript type definitions
│   ├── promEditorDetector.ts  # Prometheus editor detection logic
│   ├── buttonInjector.ts      # Button injection logic
│   ├── styles/
│   │   ├── content.css        # Styles for injected button
│   │   └── overlay.css        # Styles for overlay panel
│   └── ui/
│       ├── overlay.ts         # Overlay panel management
│       └── overlay.html      # Overlay HTML template
├── tests/                     # Test files
├── dist/                      # Build output (generated)
└── icons/                     # Extension icons
```

## Building and Installation

### Prerequisites

- Node.js 18+ and npm
- Chrome or Chromium-based browser

### Build Steps

1. **Install dependencies:**

```sh
npm install
```

2. **Build the extension:**

```sh
npm run build
```

This will create a `dist/` directory with the compiled extension files.

3. **Load the extension in Chrome:**

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" (toggle in top right)
- Click "Load unpacked"
- Select the `dist/` directory

### Development

For watch mode during development:

```sh
npm run dev
```

This will rebuild automatically when files change.

## Configuration

All configuration is centralized in `src/config.ts`. Key settings:

### Assistant Iframe URL

Set the URL of the AI assistant iframe:

```typescript
export const ASSISTANT_IFRAME_URL =
  process.env.ASSISTANT_IFRAME_URL || 'https://assistant.example.com/embed?mode=promql';
```

You can override this via environment variable:

```sh
ASSISTANT_IFRAME_URL=https://your-assistant.com/embed npm run build
```

### Grafana Host Patterns

Configure which URLs the extension should run on in `src/manifest.json`:

```json
"matches": [
  "https://*/grafana/*",
  "https://grafana.*/*",
  "http://localhost:*/*"
]
```

### Prometheus Editor Selectors

If Grafana's DOM structure changes, update the selectors in `src/config.ts`:

```typescript
export const PROM_EDITOR_SELECTORS: PromEditorSelectors = {
  containerSelectors: [
    '.query-editor-row',
    '[data-testid*="prometheus-"]',
    // Add more selectors as needed
  ],
  // ...
};
```

### Other Settings

- `AUTO_CLOSE_OVERLAY_ON_INSERT`: Whether to close the overlay after inserting a query (default: `false`)
- `BUTTON_LABEL`: Text label for the AI Assistant button (default: `"AI Assistant"`)
- `OVERLAY_CONFIG`: Overlay dimensions and z-index

## How It Works

### Editor Detection

The extension uses a `MutationObserver` to watch for DOM changes (handling Grafana's SPA navigation). When query editors appear:

1. Scans for containers matching Prometheus editor selectors
2. Verifies the datasource is Prometheus (via text content or data attributes)
3. Locates the query input element (Monaco, CodeMirror, or textarea)
4. Creates an `EditorContext` with get/set query functions
5. Registers the editor in an in-memory map

### Button Injection

For each detected editor:

1. Finds the toolbar/action area in the editor container
2. Creates and injects an "AI Assistant" button
3. Attaches a click handler that opens the overlay
4. Ensures idempotency (no duplicate buttons)

### Overlay Communication

The overlay panel:

1. Creates an iframe pointing to `ASSISTANT_IFRAME_URL`
2. Sends context via `postMessage` when opened:
   ```typescript
   {
     type: 'promql_context',
     editorId: string,
     currentQuery: string,
     datasource: 'prometheus'
   }
   ```
3. Listens for suggestions:
   ```typescript
   {
     type: 'promql_suggestion',
     editorId: string,
     query: string
   }
   ```
4. Validates message origins for security

### Query Insertion

When a suggestion is received:

1. Looks up the editor by `editorId`
2. Calls `setQuery()` which:
   - Sets the value on the underlying input element
   - Dispatches `input` and `change` events
   - Handles Monaco/CodeMirror-specific APIs if needed
3. Optionally closes the overlay (if `AUTO_CLOSE_OVERLAY_ON_INSERT` is true)

## Testing

Run the test suite:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

### Test Coverage

Tests cover:

- ✅ Editor detection (Monaco, CodeMirror, textarea)
- ✅ Multiple editors on the same page
- ✅ Query get/set functionality
- ✅ Event dispatching
- ✅ Button injection and removal
- ✅ Overlay open/close
- ✅ Message handling

## Troubleshooting

### Button Not Appearing

1. **Check console logs:** Open DevTools and look for `[PromQL Assistant]` messages
2. **Verify selectors:** Grafana's DOM structure may have changed. Update selectors in `config.ts`
3. **Check host permissions:** Ensure the Grafana URL matches patterns in `manifest.json`

### Query Not Inserting

1. **Check editor type:** The extension supports Monaco, CodeMirror, and plain textarea. If Grafana uses a different editor, you may need to extend `promEditorDetector.ts`
2. **Verify events:** Use DevTools to check if `input`/`change` events are being dispatched
3. **Check console:** Look for errors in the content script console

### Overlay Not Opening

1. **Check iframe URL:** Verify `ASSISTANT_IFRAME_URL` is correct and accessible
2. **Check CSP:** Some Grafana instances may have Content Security Policy restrictions
3. **Verify z-index:** The overlay uses `z-index: 999999`. If Grafana has higher z-index elements, adjust in `overlay.css`

## Security Considerations

- **Origin Validation:** All `postMessage` messages are validated against the configured iframe origin
- **Minimal Permissions:** Extension only requests `scripting` and `activeTab` permissions
- **No External Scripts:** All code is bundled and runs in the content script context

## Browser Compatibility

- Chrome/Chromium 88+ (Manifest V3 support)
- Edge 88+
- Other Chromium-based browsers with Manifest V3 support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` and `npm run lint`
6. Submit a pull request

## License

MIT

## Support

For issues, feature requests, or questions:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Open an issue with:
   - Chrome version
   - Grafana version
   - Steps to reproduce
   - Relevant console logs
