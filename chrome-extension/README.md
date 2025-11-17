# Grafana Prometheus AI Assistant Chrome Extension

A production-quality Chrome extension that augments Grafana's Prometheus query builder with an AI Assistant, enabling users to generate and improve PromQL queries through a conversational interface.

## Features

- 🎯 **Smart Detection**: Automatically detects Prometheus query editors in Grafana dashboards and explore views
- 🔄 **SPA Support**: Handles Grafana's single-page application architecture with MutationObserver
- 🎨 **Non-Intrusive UI**: Injects a clean "AI Assistant" button directly into query editor toolbars
- 💬 **Overlay Chat Panel**: Opens an embedded assistants-ui interface for natural language query generation
- 🔌 **Multiple Editor Support**: Handles Monaco Editor, CodeMirror, and plain textarea inputs
- 🔐 **Secure Communication**: Uses postMessage protocol with origin validation
- ⚡ **TypeScript**: Fully typed codebase for better maintainability
- ✅ **Well Tested**: Comprehensive test suite with Vitest

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Grafana Page                       │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │   Prometheus Query Editor                  │   │
│  │   ┌─────────────────────────────────┐      │   │
│  │   │  Query Input (Monaco/CodeMirror) │      │   │
│  │   └─────────────────────────────────┘      │   │
│  │   [Run Query] [AI Assistant] ← Injected   │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  When clicked:                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Overlay Panel                        │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  PromQL Assistant                      │  │  │
│  │  │  ┌──────────────────────────────────┐  │  │  │
│  │  │  │  iframe: assistants-ui           │  │  │  │
│  │  │  │  (Chat interface)                │  │  │  │
│  │  │  └──────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                      ↕ postMessage                  │
│              (Context & Suggestions)                │
└─────────────────────────────────────────────────────┘
```

## Project Structure

```
chrome-extension/
├── src/
│   ├── config.ts                    # Central configuration
│   ├── types.ts                     # TypeScript type definitions
│   ├── contentScript.ts             # Main content script
│   ├── background.ts                # Service worker
│   ├── manifest.json                # Extension manifest (V3)
│   ├── detection/
│   │   └── promEditorDetector.ts   # Detects Prometheus editors
│   ├── query/
│   │   └── queryInjector.ts        # Handles query get/set
│   ├── registry/
│   │   └── editorRegistry.ts       # Tracks detected editors
│   ├── injection/
│   │   └── buttonInjector.ts       # Injects AI button
│   ├── overlay/
│   │   ├── overlayManager.ts       # Manages overlay panel
│   │   ├── overlay.html            # Overlay HTML (reference)
│   │   └── overlay.ts              # Overlay script
│   ├── messaging/
│   │   └── messageHandler.ts       # iframe ↔ content script comm
│   └── styles/
│       ├── content.css              # Content script styles
│       └── overlay.css              # Overlay styles
├── tests/
│   ├── detection.test.ts
│   ├── queryInjector.test.ts
│   ├── registry.test.ts
│   ├── injection.test.ts
│   ├── overlay.test.ts
│   └── messaging.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Chrome or Chromium-based browser

### Build from Source

1. **Clone or navigate to the extension directory:**

   ```bash
   cd chrome-extension
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the extension:**

   ```bash
   npm run build
   ```

   This creates a `dist/` directory with the compiled extension.

4. **Load the extension in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `chrome-extension/dist` directory
   - The extension should now be loaded and active

## Configuration

All configurable options are in `src/config.ts`. Key settings:

### Assistant URL

Update the iframe URL to point to your AI assistant interface:

```typescript
ASSISTANT_IFRAME_URL: 'https://your-assistant.com/embed?mode=promql',
ASSISTANT_IFRAME_ORIGIN: 'https://your-assistant.com',
```

**Important**: The `ASSISTANT_IFRAME_ORIGIN` must match the origin of the iframe URL for security.

### Grafana Host Patterns

If your Grafana instance is at a specific URL, update the patterns:

```typescript
GRAFANA_HOST_PATTERNS: [
  'https://your-grafana.com/*',
  'https://*/grafana/*',
  'http://localhost:*/*',
],
```

Also update the same patterns in `src/manifest.json`:

```json
"matches": [
  "https://your-grafana.com/*",
  "https://*/grafana/*",
  "http://localhost:*/*"
]
```

### Editor Detection Selectors

If you're using a different Grafana version and the detection fails, adjust:

```typescript
PROM_EDITOR_SELECTORS: {
  containerSelectors: [
    '.query-editor-row',           // Add your custom selectors
    '[data-testid="query-editor"]',
  ],
  // ... other selectors
}
```

### Overlay Behavior

```typescript
OVERLAY_CONFIG: {
  autoCloseOnInsert: false,  // Set true to auto-close after query insertion
  // ... other options
}
```

## Usage

1. **Navigate to Grafana**: Open any Grafana dashboard or explore view
2. **Edit a panel**: Enter edit mode for a panel with a Prometheus datasource
3. **Find the AI button**: Look for the "AI Assistant" button next to the query input
4. **Click to open**: The overlay panel with the chat interface will appear
5. **Interact with AI**: Describe the metrics you want or ask for query improvements
6. **Accept suggestion**: The AI will send back a PromQL query which is automatically inserted into the editor

## Development

### Development Mode

Watch for changes and rebuild automatically:

```bash
npm run dev
```

Then reload the extension in Chrome (click the refresh icon in `chrome://extensions/`).

### Run Tests

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

### Type Checking

```bash
npm run type-check
```

## How It Works

### 1. Detection

The `promEditorDetector` scans the DOM for Prometheus query editor containers using:

- CSS selectors (e.g., `.query-editor-row`)
- Data attributes (e.g., `data-datasource-type="prometheus"`)
- Text content analysis (looking for "Prometheus" labels)

It then identifies:

- The query input element (Monaco, CodeMirror, or textarea)
- The editor type
- The toolbar where the button should be injected

### 2. Registration

Each detected editor is registered in the `editorRegistry` with:

- Unique ID
- References to DOM elements
- Functions to get/set query text
- Reference to the injected button

### 3. Button Injection

The `buttonInjector` creates a styled button and appends it to the query editor toolbar. The button is idempotent (won't inject duplicates) and includes click handlers.

### 4. Overlay Management

When the button is clicked:

- `overlayManager` creates or shows a modal overlay
- Embeds an iframe pointing to the configured assistant URL
- Sends the current query context to the iframe via `postMessage`

### 5. Message Handling

The `messageHandler` listens for `postMessage` events from the iframe:

```typescript
{
  type: 'promql_suggestion',
  payload: {
    editorId: 'editor-1',
    query: 'rate(http_requests_total[5m])'
  }
}
```

It validates the origin, looks up the editor, and calls `setQuery()` to insert the suggested query.

### 6. Query Injection

The `queryInjector` handles different editor types:

- **Monaco**: Uses Monaco API if available, falls back to textarea manipulation
- **CodeMirror**: Uses CodeMirror API if available, falls back to textarea
- **Textarea**: Directly sets `value` and dispatches `input`/`change` events

This ensures Grafana recognizes the change as if the user typed it.

### 7. SPA Handling

A `MutationObserver` watches `document.body` for DOM changes. When nodes are added/removed:

- Re-runs detection
- Registers new editors
- Cleans up stale editors (removed from DOM)

This handles Grafana's SPA navigation and dynamic panel creation.

## Troubleshooting

### Button doesn't appear

- **Check selectors**: Grafana's DOM structure may have changed. Update `PROM_EDITOR_SELECTORS` in `config.ts`
- **Check console**: Look for detection logs (if `DEBUG.enabled: true`)
- **Verify datasource**: Ensure the query editor is actually for a Prometheus datasource

### Query insertion doesn't work

- **Check editor type**: The extension auto-detects Monaco/CodeMirror/textarea
- **Console errors**: Look for errors in the browser console
- **Event dispatching**: Some Grafana versions may need additional events; modify `dispatchInputEvents()` in `queryInjector.ts`

### Overlay doesn't open

- **Check URL**: Ensure `ASSISTANT_IFRAME_URL` is correct
- **CORS/CSP**: The iframe URL must allow embedding
- **Console errors**: Check for iframe loading errors

### Messages not received

- **Origin mismatch**: `ASSISTANT_IFRAME_ORIGIN` must exactly match the iframe's origin
- **Message format**: Ensure the iframe sends messages in the expected format (see `types.ts`)

### Extension not loading

- **Manifest errors**: Check `chrome://extensions/` for error messages
- **Permissions**: Ensure host permissions match your Grafana URL
- **Build issues**: Try `npm run build` again and check for errors

## Testing Against Real Grafana

For integration testing with a real Grafana instance:

1. **Run Grafana locally**:

   ```bash
   docker run -d -p 3000:3000 grafana/grafana
   ```

2. **Add Prometheus datasource**: Configure a Prometheus datasource in Grafana

3. **Create a test dashboard**: Add a panel with a Prometheus query

4. **Load the extension**: Follow installation steps above

5. **Verify**:
   - AI Assistant button appears
   - Overlay opens on click
   - Query insertion works

## Advanced: Playwright/Puppeteer Testing

For automated E2E tests (not included in v1, but here's how to set up):

```bash
npm install --save-dev @playwright/test
```

Create `tests/e2e/extension.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('should inject AI button in Grafana', async ({ page }) => {
  await page.goto('http://localhost:3000/grafana');
  // ... login, navigate to dashboard
  const button = await page.waitForSelector('.prom-ai-assistant-button');
  expect(button).toBeTruthy();
});
```

## Contributing

Contributions are welcome! Please:

1. Write tests for new features
2. Follow the existing code style
3. Run `npm run lint` and `npm run format` before committing
4. Update documentation as needed

## License

MIT

## Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Note**: This extension is designed to work with Grafana 8.x - 10.x. If you encounter issues with a specific version, please adjust the selectors in `config.ts` or report the issue.
