# Architecture Documentation

## Overview

This Chrome extension augments Grafana's Prometheus query builder by detecting query editors in the DOM and injecting an AI assistant button. When clicked, the button opens an overlay panel with an embedded iframe that communicates via `postMessage` to insert query suggestions.

## Core Components

### 1. Content Script (`contentScript.ts`)

The main orchestrator that runs on Grafana pages.

**Responsibilities:**
- Scans the page for Prometheus query editors using `MutationObserver`
- Manages an in-memory registry of detected editors
- Injects AI Assistant buttons into editor toolbars
- Creates and manages the overlay panel
- Handles `postMessage` communication with the iframe
- Inserts suggested queries back into editors

**Key Functions:**
- `scanAndInjectButtons()`: Finds editors and injects buttons
- `openOverlay(editorId)`: Shows the overlay for a specific editor
- `closeOverlay()`: Hides the overlay
- `handleIframeMessage(event)`: Processes messages from the assistant iframe
- `handleQuerySuggestion(message)`: Applies query suggestions to editors

### 2. Editor Detector (`promEditorDetector.ts`)

Defensive detection logic for finding Prometheus query editors.

**Responsibilities:**
- Scans DOM for editor containers based on configurable selectors
- Validates that containers are Prometheus editors (not other datasources)
- Detects editor type (Monaco, CodeMirror, or plain textarea)
- Provides unified API for getting/setting query text
- Handles event dispatching to ensure Grafana recognizes changes

**Key Functions:**
- `findEditors()`: Returns array of `EditorContext` objects
- `findToolbarForEditor(editor)`: Locates toolbar for button injection
- `detectEditorType(element)`: Identifies Monaco/CodeMirror/textarea
- `createQueryGetter(element, type)`: Creates query text getter
- `createQuerySetter(element, type)`: Creates query text setter with events

**Editor Support:**
- Monaco Editor: Accesses via API or underlying textarea
- CodeMirror: Uses CodeMirror instance or fallback textarea
- Plain Textarea: Direct value manipulation with comprehensive event dispatching

### 3. Configuration (`config.ts`)

Centralized configuration for all extension behavior.

**Key Settings:**
- `ASSISTANT_IFRAME_URL`: URL of the assistant service
- `ALLOWED_IFRAME_ORIGINS`: Whitelist for `postMessage` security
- `PROM_EDITOR_SELECTORS`: Customizable DOM selectors for detection
- `UI`: Button label, z-index, auto-close behavior
- `DEBUG`: Console logging toggle

### 4. Background Service Worker (`background.ts`)

Minimal service worker for extension lifecycle.

**Responsibilities:**
- Logs installation/update events
- Maintains service worker alive
- Placeholder for future background features

### 5. Overlay UI (`ui/`)

Modal overlay containing the assistant iframe.

**Structure:**
- Semi-transparent backdrop (clickable to close)
- Centered/docked panel with header and close button
- Iframe loading `ASSISTANT_IFRAME_URL`
- Styled to match Grafana's aesthetic

### 6. Styles (`styles/`)

**content.css:**
- AI Assistant button styling
- Overlay backdrop and panel
- Dark theme support

**overlay.css:**
- Minimal styles for overlay.html page

## Data Flow

### 1. Editor Detection Flow

```
Page Load/DOM Change
    ↓
MutationObserver detects changes
    ↓
scanAndInjectButtons()
    ↓
findEditors() scans DOM
    ↓
For each editor:
    - Validate it's Prometheus
    - Create EditorContext
    - Add to registry
    - Inject AI button
```

### 2. Query Suggestion Flow

```
User clicks AI button
    ↓
openOverlay(editorId)
    ↓
Create/show overlay with iframe
    ↓
Send 'promql_context' message to iframe
    (includes current query, editor ID)
    ↓
User interacts with assistant
    ↓
Iframe sends 'promql_suggestion' message
    (includes new query, editor ID)
    ↓
handleQuerySuggestion()
    ↓
Lookup editor in registry
    ↓
editor.setQuery(newQuery)
    ↓
Dispatch events (input, change, etc.)
    ↓
Grafana recognizes query change
```

## Message Protocol

### From Extension to Iframe

```typescript
{
  type: 'promql_context',
  editorId: string,        // Unique editor identifier
  currentQuery: string,    // Current query text
  datasource: 'prometheus' // Always 'prometheus'
}
```

Sent when:
- Overlay opens
- User switches editors (future feature)

### From Iframe to Extension

```typescript
{
  type: 'promql_suggestion',
  editorId: string,  // Must match a known editor
  query: string      // New PromQL query to insert
}
```

Sent when:
- User accepts an AI suggestion
- Assistant generates a query

## Security

### Origin Validation

All `postMessage` events are validated against `ALLOWED_IFRAME_ORIGINS` config. Messages from unauthorized origins are silently ignored.

### CSP Considerations

The iframe must be accessible and not blocked by Content Security Policy. The extension uses `web_accessible_resources` to expose necessary files.

### Permissions

- `scripting`: Required for content script injection
- Host permissions: Restricted to configured Grafana domains
- No `tabs`, `webRequest`, or other broad permissions

## Extension Points

### Adding New Editor Types

To support a new editor type (e.g., custom Monaco build):

1. Add detection logic in `detectEditorType()`
2. Implement getter in `createQueryGetter()`
3. Implement setter in `createQuerySetter()`
4. Test with sample DOM structure

### Adjusting Selectors

For different Grafana versions, modify `config.ts`:

```typescript
PROM_EDITOR_SELECTORS: {
  rootContainerSelectors: [
    // Add your version's selectors
    '[data-testid="my-custom-editor"]',
  ],
  prometheusIndicators: [
    // Add indicators
    '[data-ds-type="prometheus"]',
  ],
  // ...
}
```

### Custom Overlay UI

To replace the iframe with a custom UI:

1. Modify `createOverlay()` in `contentScript.ts`
2. Replace iframe with your React/Vue/etc. component
3. Implement your own query generation logic
4. Call `handleQuerySuggestion()` with results

## Browser Compatibility

- **Chrome 88+**: Full support (target)
- **Edge 88+**: Should work (untested)
- **Firefox**: Would require MV3 adaptation
- **Safari**: Not supported (no Manifest V3)

## Performance Considerations

### DOM Scanning

- Uses debounced `MutationObserver` (300ms delay)
- Periodic full scan every 5 seconds (backup)
- Registry cleanup removes deleted editors

### Memory Management

- Editors removed from DOM are cleaned from registry
- Overlay is created once and reused
- Event listeners are properly scoped

### Bundle Size

- contentScript.js: ~17 KB (gzipped: ~4.6 KB)
- background.js: ~1 KB
- overlay.js: ~0.1 KB

## Testing Strategy

### Unit Tests

- `promEditorDetector.test.ts`: Editor detection logic
- `contentScript.test.ts`: Button injection, registry management

### Integration Tests

- `integration.test.ts`: Full workflow from detection to query insertion

### Manual Testing

See README.md for instructions on testing against a real Grafana instance.

## Future Enhancements

### Planned Features

1. **Multi-Editor Support**: Allow overlay to switch between multiple editors
2. **Query History**: Cache previous queries and suggestions
3. **Keyboard Shortcuts**: Open overlay with keyboard
4. **Metrics Context**: Send current dashboard/panel context to assistant
5. **Offline Mode**: Basic query assistance without iframe
6. **Options Page**: UI for configuration (not just code)

### Potential Improvements

- Smarter detection using Grafana's internal React/Angular state
- Direct integration with Monaco/CodeMirror completion providers
- Support for other datasources (Loki, Elasticsearch)
- Telemetry for usage analytics (opt-in)

## Troubleshooting

### Common Issues

**Extension doesn't detect editors:**
- Check console for debug logs (`config.DEBUG = true`)
- Verify selectors match your Grafana version
- Ensure page is fully loaded before detection

**Query insertion doesn't work:**
- Different Grafana versions use different editors
- Check which editor type is detected
- May need to adjust `setQuery` logic for your version

**Overlay doesn't open:**
- Verify `ASSISTANT_IFRAME_URL` is accessible
- Check browser console for CSP errors
- Ensure iframe origin is in `ALLOWED_IFRAME_ORIGINS`

**postMessage not received:**
- Confirm iframe is loaded (check Network tab)
- Verify origin validation isn't blocking messages
- Check iframe console for errors

## Development Workflow

1. Make code changes
2. Run `npm run build` (or `npm run dev` for watch mode)
3. Reload extension in Chrome (`chrome://extensions/`)
4. Test on Grafana page
5. Run `npm test` to verify tests pass
6. Commit changes

## Build Process

Vite handles the build:

1. TypeScript compilation (`tsc`)
2. Bundle generation (Rollup via Vite)
3. Static file copying (`manifest.json`, HTML, CSS)
4. Output to `dist/` directory

## Deployment

To distribute:

1. Build: `npm run build`
2. Zip the `dist/` folder
3. Upload to Chrome Web Store (optional)
4. Or distribute as unpacked extension

No server-side components required - purely client-side.
