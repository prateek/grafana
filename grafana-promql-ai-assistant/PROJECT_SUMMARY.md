# Project Summary

## Overview

This Chrome extension augments Grafana's Prometheus query builder with an AI assistant overlay. It detects Prometheus query editors, injects "AI Assistant" buttons, and provides a chat interface for generating and refining PromQL queries.

## Architecture

### Core Components

1. **Content Script** (`contentScript.ts`)
   - Runs in isolated content script context
   - Detects Prometheus editors using MutationObserver
   - Injects AI Assistant buttons
   - Manages editor registry
   - Handles query injection

2. **Page Context Bridge** (`pageContextBridge.ts`)
   - Runs in page context (not isolated)
   - Manages overlay DOM
   - Handles communication with iframe
   - Bridges content script and page context

3. **Editor Detection** (`promEditorDetector.ts`)
   - Scans DOM for Prometheus query editors
   - Supports multiple editor types (Monaco, CodeMirror, textarea)
   - Generates unique editor IDs

4. **Query Injection** (`queryInjector.ts`)
   - Handles different editor implementations
   - Dispatches appropriate events for Grafana
   - Supports Monaco, CodeMirror, and plain textarea

5. **Editor Registry** (`editorRegistry.ts`)
   - Tracks detected editors
   - Handles cleanup when editors are removed
   - Provides lookup by editor ID

### Communication Flow

```
Content Script ←→ Page Context Bridge ←→ Iframe (assistants-ui)
     (postMessage)      (custom events)      (postMessage)
```

1. User clicks "AI Assistant" button
2. Content script dispatches `prom-ai-open-overlay` event
3. Page context bridge creates overlay and sends context to iframe
4. User interacts with AI assistant in iframe
5. Iframe sends `promql_suggestion` message
6. Page context bridge forwards to content script via custom event
7. Content script injects query into editor

## File Structure

```
src/
├── manifest.json              # Chrome extension manifest (V3)
├── background.ts              # Service worker (minimal)
├── contentScript.ts           # Main content script
├── pageContextBridge.ts       # Page context bridge
├── config.ts                  # Central configuration
├── types.ts                   # TypeScript types
├── promEditorDetector.ts      # Editor detection
├── queryInjector.ts           # Query injection
├── editorRegistry.ts          # Editor management
├── styles/
│   ├── content.css           # Button styles
│   └── overlay.css           # Overlay styles
└── ui/
    └── overlay.html          # (Optional, not currently used)

tests/
├── promEditorDetector.test.ts
├── queryInjector.test.ts
├── editorRegistry.test.ts
└── types.test.ts
```

## Key Features

- ✅ Manifest V3 compliance
- ✅ TypeScript throughout
- ✅ Automatic editor detection
- ✅ Multiple editor support
- ✅ SPA navigation handling
- ✅ Configurable selectors
- ✅ Secure message passing
- ✅ Comprehensive tests
- ✅ Production-ready build setup

## Configuration Points

All configuration is in `src/config.ts`:

- **Assistant URL**: `assistantIframeUrl`
- **Host Patterns**: `grafanaHostPatterns`
- **Editor Selectors**: `promEditorSelectors` (adjustable for Grafana versions)
- **Overlay Behavior**: `overlay.autoCloseOnInsert`, sizing, etc.

## Testing

Tests cover:
- Editor detection with various DOM structures
- Query injection for different editor types
- Registry management and cleanup
- Type guards for message validation

Run tests with: `npm test`

## Build Output

The build process creates:
- `dist/contentScript.js` - Content script bundle
- `dist/background.js` - Service worker bundle
- `dist/pageContextBridge.js` - Page context bridge (IIFE)
- `dist/manifest.json` - Extension manifest
- `dist/styles/*.css` - Style files
- `dist/icons/*.png` - Extension icons (must be provided)

## Next Steps

1. Add extension icons (16x16, 48x48, 128x128 PNG files)
2. Configure `assistantIframeUrl` in `config.ts`
3. Build: `npm run build`
4. Load unpacked extension from `dist/` directory
5. Test against a real Grafana instance

## Notes

- The extension uses defensive programming to handle different Grafana versions
- Selectors can be adjusted in `config.ts` if Grafana's DOM structure changes
- The page context bridge is necessary because content scripts run in an isolated context
- All communication uses validated postMessage with origin checking
