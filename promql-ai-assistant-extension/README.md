# Grafana PromQL AI assistant

This Chrome extension adds an AI-driven overlay to Grafana's Prometheus query editor without modifying Grafana itself. It detects every visible Prometheus editor, injects an **AI Assistant** button, and lets you accept PromQL suggestions that are written directly into the editor before Grafana's native refresh workflow runs.

## Before you begin

- Chrome 115 or later
- Node.js 18 or later
- npm 9 or later

## Install dependencies

```sh
cd promql-ai-assistant-extension
npm install
```

## Build the extension

```sh
npm run build
```

The compiled extension is emitted into `dist/`. Load that folder as an unpacked extension from `chrome://extensions`.

For watch mode use:

```sh
npm run dev
```

JavaScript bundles rebuild automatically. Re-run the command after editing static assets (manifest, HTML, or CSS).

## Configure behavior

All tunable values live in `src/config.ts`.

- **Assistant iframe**: `ASSISTANT_IFRAME_URL` defaults to the bundled sandbox UI (`chrome-extension://…/ui/overlay.html`). Point it to any hosted assistants-ui panel, for example `https://assistant.example.com/embed?mode=promql`.
- **Host patterns**: `GRAFANA_HOST_PATTERNS` lists the default match patterns that also appear in `src/manifest.json`. Adjust both places if your Grafana instances live elsewhere.
- **Selectors**: `PROM_EDITOR_SELECTORS` stores every DOM selector used to find editor containers, toolbars, and Monaco/CodeMirror inputs. Update these hints if Grafana changes its markup.
- **Overlay behavior**: Toggle `AUTO_CLOSE_OVERLAY_ON_INSERT` or `AUTO_RUN_QUERY_AFTER_INSERT` to control whether the overlay closes or Grafana's **Run query** button is triggered after inserting a suggestion.

## Tests and linting

```sh
npm test          # Runs Vitest with jsdom
npm run lint      # ESLint + TypeScript rules
```

The Vitest suite covers:

- Editor detection and query insertion
- Assistant button injection
- Overlay lifecycle and queued context delivery
- Registry cleanup rules
- Content-script postMessage handling and Grafana refresh triggers

## Project structure

- `src/manifest.json` – Chrome MV3 manifest with default Grafana host permissions.
- `src/contentScript.ts` – MutationObserver-driven logic that detects editors, injects UI, opens the overlay, and handles messages from the assistant iframe.
- `src/promEditorDetector.ts` – Defensive heuristics for finding Prometheus editors plus Monaco/CodeMirror/textarea adapters.
- `src/overlayController.ts` – Creates and manages the page overlay container and iframe messaging.
- `src/ui/overlay.html` + `src/ui/overlay.ts` – Minimal sandbox chat UI that can send PromQL strings back to Grafana.
- `src/styles/*.css` – Namespaced styles for injected buttons and the overlay panel.
- `scripts/build.mjs` – esbuild-based bundler plus static asset copier.
- `tests/` – Vitest + jsdom unit tests.

## Validating inside Grafana

1. Run `npm run build` and load `dist/` in Chrome as an unpacked extension.
2. Open any Grafana dashboard, Explore view, or panel editor backed by a Prometheus data source.
3. When the query editor renders, look for the new **AI Assistant** button beside Grafana's native controls.
4. Click the button to open the overlay. The extension posts the current editor context to the iframe as `{ type: "promql_context", editorId, currentQuery }`.
5. When the iframe posts back `{ type: "promql_suggestion", editorId, query }`, the content script writes the query into Monaco/CodeMirror, dispatches `input` and `change` events, and optionally triggers **Run query** so Grafana refreshes as usual.
6. Multiple editors on a page remain isolated because each button carries its own `editorId`.

## Extending the assistant

- Wire the iframe to your actual assistants-ui deployment by changing `ASSISTANT_IFRAME_URL`.
- Implement richer drag or resize behavior by enhancing `content.css` and `overlayController.ts`.
- Add analytics or telemetry in `background.ts` or via message passing if your security model allows it.

## Troubleshooting

- If buttons stop showing up, double-check `PROM_EDITOR_SELECTORS` against the Grafana DOM (use DevTools to inspect `.query-editor-row`).
- When Grafana blocks the iframe origin, host the assistant behind an allowlisted domain or keep using the bundled sandbox UI.
- If the assistant fails to insert queries, confirm that Grafana's Monaco editor exposes the hidden `<textarea>` element or adjust the `setPromQuery` logic for your version.
