# Grafana PromQL AI Assistant - Chrome Extension

A production-quality Chrome extension that augments Grafana's default Prometheus query builder UI with AI-powered assistance. This extension injects a custom "AI Assistant" button into each Prometheus query editor and provides an interactive chat panel for query building.

## 🚀 Features

- **Non-invasive Integration**: Works without modifying Grafana itself - runs entirely as a Chrome extension
- **Smart Detection**: Automatically detects Prometheus query editors in Grafana dashboards, explore views, and panel edits
- **Multiple Editor Support**: Handles multiple query editors on the same page independently
- **Editor Type Agnostic**: Supports Monaco Editor, CodeMirror, and plain textarea implementations
- **SPA Navigation**: Uses MutationObserver to handle Grafana's single-page application navigation
- **Secure Communication**: Uses postMessage API with origin validation for iframe communication
- **Clean UI**: Minimal, non-intrusive button design that fits Grafana's aesthetic
- **Extensible**: Configurable selectors and behavior for different Grafana versions

## 📋 Prerequisites

- Node.js 18+ and npm
- Chrome browser (or Chromium-based browser)
- A Grafana instance with Prometheus datasource (for testing)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd chrome-extension
npm install
```

### 2. Configure the Extension

Edit `src/config.ts` to set your AI assistant iframe URL:

```typescript
export const config = {
  // Set this to your AI assistant endpoint
  ASSISTANT_IFRAME_URL: 'https://your-ai-assistant.example.com/embed?mode=promql',

  // Must match the iframe URL's origin
  ASSISTANT_IFRAME_ORIGIN: 'https://your-ai-assistant.example.com',

  // ... other config options
};
```

### 3. Build the Extension

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev
```

This creates a `dist/` folder with the compiled extension.

### 4. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project
5. The extension should now appear in your extensions list

### 5. Test with Grafana

1. Navigate to your Grafana instance (matching host patterns in manifest.json)
2. Open a dashboard or explore view
3. Edit a panel with a Prometheus datasource
4. You should see an "✨ AI Assistant" button in the query editor toolbar

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npx vitest --ui
```

The test suite includes:
- Editor detection tests
- Button injection tests
- Editor registry management tests
- Overlay behavior tests
- Message handling tests

## 📁 Project Structure

```
chrome-extension/
├── src/
│   ├── manifest.json              # Chrome extension manifest (Manifest V3)
│   ├── config.ts                  # Centralized configuration
│   ├── types.ts                   # TypeScript type definitions
│   ├── contentScript.ts           # Main content script entry point
│   ├── background.ts              # Service worker
│   ├── promEditorDetector.ts      # Detects Prometheus editors in DOM
│   ├── editorRegistry.ts          # Manages detected editor instances
│   ├── buttonInjector.ts          # Injects AI button into editors
│   ├── overlayManager.ts          # Manages overlay panel
│   ├── messageHandler.ts          # Handles postMessage communication
│   ├── ui/
│   │   ├── overlay.html           # Overlay panel HTML
│   │   └── overlay.ts             # Overlay panel script
│   └── styles/
│       ├── content.css            # Button styles
│       └── overlay.css            # Overlay panel styles
├── tests/
│   ├── setup.ts                   # Test setup and mocks
│   ├── promEditorDetector.test.ts
│   ├── buttonInjector.test.ts
│   ├── editorRegistry.test.ts
│   ├── overlayManager.test.ts
│   └── messageHandler.test.ts
├── dist/                          # Built extension (generated)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## ⚙️ Configuration

### Grafana Host Patterns

By default, the extension runs on:
- `https://*/grafana/*`
- `https://grafana.*/*`
- `http://localhost:*/*`

To customize, edit both:
1. `src/manifest.json` - Update `matches` in `content_scripts` and `host_permissions`
2. `src/config.ts` - Update `GRAFANA_HOST_PATTERNS` for documentation

### Editor Detection Selectors

If Grafana's DOM structure changes in different versions, update selectors in `src/config.ts`:

```typescript
PROM_EDITOR_SELECTORS: {
  containerSelectors: [
    '[data-testid="query-editor-row"]',
    '.query-editor-row',
    // Add more selectors for your Grafana version
  ],

  prometheusIndicators: [
    '[data-testid*="prometheus"]',
    '[data-ds-type="prometheus"]',
    // Add more indicators
  ],

  queryInputSelectors: [
    '.monaco-editor textarea',
    '.CodeMirror',
    'textarea[placeholder*="query" i]',
    // Add more input selectors
  ],

  toolbarSelectors: [
    '[data-testid="query-editor-toolbar"]',
    '.query-editor-row__actions',
    // Add more toolbar selectors
  ],
}
```

### UI Customization

Customize button label and overlay behavior:

```typescript
UI: {
  BUTTON_LABEL: '✨ AI Assistant',
  AUTO_CLOSE_OVERLAY_ON_INSERT: false,
  OVERLAY: {
    width: '500px',
    height: '600px',
    position: 'right', // or 'center'
    zIndex: 10000,
  },
}
```

### Debug Logging

Enable or disable console logging:

```typescript
DEBUG: {
  ENABLE_LOGGING: true,  // Set to false in production
  LOG_PREFIX: '[PromQL AI]',
}
```

## 🔌 AI Assistant Integration

### PostMessage Protocol

The extension communicates with the AI assistant iframe using `postMessage`. The iframe must implement this protocol:

#### Messages FROM content script TO iframe:

**Context Message** - Sent when overlay opens:
```typescript
{
  type: 'promql_context',
  editorId: string,
  currentQuery: string,
  datasource: 'prometheus',
  timestamp: number
}
```

#### Messages FROM iframe TO content script:

**Query Suggestion** - Send this to insert a query:
```typescript
{
  type: 'promql_suggestion',
  editorId: string,
  query: string,
  timestamp: number
}
```

**Close Overlay** - Request overlay closure:
```typescript
{
  type: 'close_overlay',
  timestamp: number
}
```

### Example AI Assistant Implementation

Your iframe should listen for messages and respond:

```javascript
// In your AI assistant iframe
window.addEventListener('message', (event) => {
  // Validate origin
  if (event.origin !== 'chrome-extension://YOUR_EXTENSION_ID') return;

  const message = event.data;

  if (message.type === 'promql_context') {
    // User opened AI assistant
    console.log('Current query:', message.currentQuery);
    console.log('Editor ID:', message.editorId);

    // Display current query and offer suggestions
    displayQuery(message.currentQuery);
  }
});

// When user accepts a suggestion
function sendQueryToGrafana(query) {
  window.parent.postMessage({
    type: 'promql_suggestion',
    editorId: currentEditorId, // From the context message
    query: query,
    timestamp: Date.now()
  }, '*'); // In production, specify the exact origin
}
```

## 🎨 Styling

The extension includes two CSS files:

- **content.css**: Styles for the injected AI Assistant button
  - Responsive design
  - Dark theme support
  - Matches Grafana's visual style

- **overlay.css**: Styles for the overlay panel
  - Slide-in animation
  - Right-side docked (or centered)
  - Dark theme support
  - Responsive for mobile

All CSS classes are namespaced with `prom-ai-` prefix to avoid conflicts.

## 🧩 Architecture

### Content Script Flow

1. **Initialization**: Content script loads when Grafana page loads
2. **Detection**: `promEditorDetector` scans DOM for Prometheus editors
3. **Registration**: Found editors are registered in `editorRegistry`
4. **Injection**: `buttonInjector` adds AI button to each editor's toolbar
5. **Monitoring**: `MutationObserver` watches for DOM changes (SPA navigation)
6. **Interaction**: Button click opens overlay via `overlayManager`
7. **Communication**: `messageHandler` manages iframe communication

### Query Insertion Flow

1. User interacts with AI assistant in iframe
2. Iframe sends `promql_suggestion` message via postMessage
3. `messageHandler` validates origin and message format
4. Handler looks up editor in `editorRegistry`
5. Calls `editor.setQuery()` to insert the query
6. Editor-specific logic handles Monaco/CodeMirror/textarea
7. Events are dispatched to notify Grafana of the change

## 🔧 Development

### Code Quality

```bash
# Lint
npm run lint

# Lint and fix
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Hot Reload During Development

1. Run `npm run dev` to build in watch mode
2. Make code changes
3. In Chrome extensions page, click reload icon on the extension
4. Refresh your Grafana tab to see changes

### Debugging

- Enable debug logging in `src/config.ts`
- Open Chrome DevTools on Grafana page
- Check Console tab for `[PromQL AI]` prefixed logs
- Use Sources tab to set breakpoints in extension code

## 🐛 Troubleshooting

### Button doesn't appear

1. Check that you're on a page matching the host patterns in `manifest.json`
2. Verify you're editing a Prometheus query (not another datasource)
3. Check browser console for errors
4. Try adjusting `PROM_EDITOR_SELECTORS` in config for your Grafana version

### Query insertion doesn't work

1. Verify the editor type is correctly detected (check console logs)
2. For Monaco: Check if `window.monaco` is available
3. For CodeMirror: Check if `.CodeMirror` element has the CodeMirror instance
4. Try updating `setQueryText` logic in `promEditorDetector.ts`

### Overlay doesn't open

1. Check that `ASSISTANT_IFRAME_URL` is set correctly in config
2. Verify iframe loads (check Network tab in DevTools)
3. Check for CSP (Content Security Policy) issues in console

### PostMessage not working

1. Verify `ASSISTANT_IFRAME_ORIGIN` matches your iframe's origin exactly
2. Check browser console for origin validation errors
3. Ensure iframe is sending messages to `window.parent`

### Multiple buttons appear

- This shouldn't happen due to idempotency checks
- If it does, check that editor IDs are truly unique
- Verify cleanup logic in `editorRegistry.cleanupStaleEditors()`

## 📝 Extending the Extension

### Adding Support for New Editor Types

Edit `src/promEditorDetector.ts`:

```typescript
function detectEditorType(element: HTMLElement): EditorType {
  // Add new editor type detection
  if (element.classList.contains('your-editor-class')) {
    return 'your-editor-type';
  }
  // ...
}

// Add get/set methods for the new type
function getYourEditorQueryText(element: HTMLElement): string {
  // Implementation
}

function setYourEditorQueryText(element: HTMLElement, query: string): void {
  // Implementation
}
```

### Adding New Message Types

1. Add type to `src/types.ts`:
```typescript
export interface YourNewMessage {
  type: MessageType.YOUR_NEW_TYPE;
  // fields
}
```

2. Update `messageHandler.ts` to handle it

### Customizing Button Appearance

Edit `src/styles/content.css` and/or `src/buttonInjector.ts` to change:
- Button colors
- Icon (update SVG in `getIconSVG()`)
- Size and spacing
- Hover effects

## 🧪 Testing in Different Grafana Versions

The extension is designed to work across Grafana versions, but you may need to adjust selectors:

1. Open Grafana instance
2. Inspect a Prometheus query editor (right-click → Inspect)
3. Note the DOM structure and class names
4. Update selectors in `src/config.ts` to match
5. Rebuild and test

## 📜 License

MIT

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Support for additional editor types
- Better error handling
- Accessibility improvements
- Performance optimizations
- Support for other datasources (Loki, etc.)

## 🔒 Security Considerations

- The extension only runs on specified Grafana host patterns
- PostMessage communication validates origins
- No sensitive data is stored or transmitted by the extension
- Iframe is sandboxed with limited permissions
- No external network requests from the extension itself (only iframe)

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Verify configuration in `src/config.ts`
4. Open an issue with reproduction steps and Grafana version

---

Built with ❤️ for the Grafana and Prometheus community
