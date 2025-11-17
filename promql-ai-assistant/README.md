# Grafana PromQL AI Assistant extension

This project packages a Manifest V3 Chrome extension that augments Grafana's Prometheus query builders with an AI-powered assistant overlay. The extension injects an **AI Assistant** button into each detected Prometheus query editor, opens a configurable chat iframe, and lets the iframe post `promql_suggestion` messages back to Grafana.

## Before you begin

Ensure you have the following:

- Node.js 18+ and npm
- Access to a Grafana environment that exposes the Prometheus query builder
- An assistants UI endpoint you can embed inside the overlay iframe

## Development workflow

- `npm install`: Install dependencies.
- `npm run dev`: Build the content script and background worker in watch mode.
- `npm run build`: Produce a production bundle in `dist/` (runs `tsup` and copies static assets).
- `npm run lint`: Run ESLint using the TypeScript-aware config.
- `npm run test`: Execute Vitest unit tests inside jsdom.

Loading the unpacked extension:

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the generated `dist/` directory.
4. Visit a Grafana dashboard or Explore view that uses the Prometheus datasource.

## Configuration

All runtime tweaks live in `src/config.ts`:

- **`ASSISTANT_IFRAME_URL`**: URL the overlay iframe loads (defaults to `https://assistant.example.com/embed?mode=promql`).
- **`ASSISTANT_IFRAME_ALLOWED_ORIGINS`**: Derived whitelist used to validate `postMessage` traffic from the assistant iframe.
- **`GRAFANA_HOST_PATTERNS`**: Mirrors the manifest's `content_scripts.matches` array so you can keep browser host permissions in sync.
- **`PROM_EDITOR_SELECTORS`**: Centralized selectors for detecting Grafana Prometheus query rows, toolbar regions, and run buttons.
- **`AUTO_CLOSE_OVERLAY_ON_INSERT`**: When set to `true`, the overlay hides automatically after inserting a suggestion.

Adjust the selectors or iframe URL if Grafana updates its markup or you host your own assistants UI.

## Architecture highlights

- **Detector and registry**: `promEditorDetector.ts` scans for Prometheus editors using MutationObserver-driven rescans, while `EditorRegistry` tracks DOM lifecycles and injected buttons.
- **UI elements**: `ensureAssistantButton` injects namespaced controls that avoid Grafana CSS collisions, and `OverlayController` mounts the reusable overlay HTML/CSS template.
- **Messaging**: `createAssistantMessageHandler` ensures only trusted origins can insert queries, re-sends editor context on request, and optionally triggers Grafana's run button.
- **Query insertion**: `querySetter.ts` handles Monaco, CodeMirror, and fallback `<textarea>` inputs by dispatching the same events Grafana expects from manual editing.

## Testing

Unit tests (Vitest + jsdom) cover:

- Prometheus editor detection, query reads, and writes
- Toolbar button injection idempotency
- Registry lifecycle and cleanup when DOM nodes disappear
- Overlay controller mounting, open, and close behavior
- `postMessage` handling for both context requests and query suggestions

Run `npm run test` to execute the suite or `npm run test:watch` while iterating.

## Next steps

- Wire the iframe to a real assistants UI endpoint that understands the documented `promql_context`/`promql_suggestion` protocol.
- Extend `PROM_EDITOR_SELECTORS` if your Grafana theme or version uses custom markup.
- Consider persisting per-panel chat history by pairing `editorId` with storage in the background service worker.
