# Grafana PromQL AI Assistant Chrome extension

## Overview

This Manifest V3 extension augments Grafana's default Prometheus query editor by detecting each editor instance, injecting an **AI Assistant** button, and opening a rich overlay that embeds an assistants-ui chat experience. When the chat returns a PromQL suggestion, the extension writes the query into the respective Grafana editor and triggers the native run flow so you can immediately re-execute the query.

## Project layout

- `src/manifest.json` – MV3 manifest with default host patterns for Grafana deployments.
- `src/contentScript.ts` – detection logic, registry management, overlay orchestration, and `postMessage` handling.
- `src/detection/promEditorDetector.ts` – configurable heuristics for finding Prometheus editors and reading/writing their query inputs (Monaco, CodeMirror, textarea, or contenteditable).
- `src/ui/overlay.html` / `src/ui/overlay.ts` – template and controller for the assistants overlay, including iframe messaging.
- `src/styles/*` – isolated CSS for the injected button and overlay.
- `src/background.ts` – lightweight service worker stub.
- `tests/**/*.ts` – Vitest + jsdom unit tests covering detection, registry, overlay behavior, and button injection.

## Getting started

```sh
npm install
npm run build
```

Load the generated `dist/` directory as an unpacked extension in `chrome://extensions`.

### Development scripts

- `npm run dev` – watch build that re-emits assets on change.
- `npm run build` – production bundle written to `dist/`.
- `npm run test` – Vitest unit suite (jsdom environment).
- `npm run lint` – ESLint + TypeScript checks.
- `npm run typecheck` – `tsc --noEmit` verification.
- `npm run format` – Prettier over source and tests.

## Configuration

Centralized configuration lives in `src/config.ts`:

- `ASSISTANT_IFRAME_URL` – the assistants-ui embed URL (defaults to `https://assistant.example.com/embed?mode=promql`).
- `GRAFANA_HOST_PATTERNS` – reference patterns for Grafana instances (mirrors `manifest.json`).
- `PROM_EDITOR_SELECTORS` – selectors used by the detector to identify Prometheus editors, query inputs, and run buttons. Update these when Grafana's markup shifts.
- `AUTO_CLOSE_OVERLAY_ON_INSERT` – whether to hide the overlay automatically after inserting a suggestion.
- `OVERLAY_APPEARANCE` / `OVERLAY_STRINGS` – width, height, z-index, and display strings for the overlay chrome.

Whenever you change host patterns or selectors, update both `src/config.ts` and `src/manifest.json` so the extension has the right permissions.

## Overlay messaging contract

The extension communicates with the assistants-ui iframe via `window.postMessage`:

- From extension ➜ iframe: `{ type: 'promql_context', editorId, datasource: 'prometheus', currentQuery }` when the overlay opens or the user targets a new editor.
- From iframe ➜ extension: `{ type: 'promql_suggestion', editorId, query }`. The extension resolves the correct editor, injects the query via Monaco/CodeMirror/textarea APIs, dispatches the standard Grafana events, and clicks the editor's native **Run query** action.

Messages from any origin other than `ASSISTANT_IFRAME_URL` are ignored.

## Testing and validation

Vitest + jsdom cover the critical behaviors:

1. Editor detection and read/write support.
2. Button injection idempotency and click wiring.
3. Registry cleanup when editors disappear due to SPA navigation.
4. Overlay rendering and suggestion handling via `postMessage`.

For end-to-end validation against a local Grafana stack, you can adapt Playwright or Puppeteer to:

1. Launch Grafana via `docker compose`.
2. Load the unpacked extension.
3. Navigate to a dashboard with a Prometheus panel.
4. Use Playwright to click the injected AI button and validate query replacement.

## Loading the extension

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.
4. Browse to a Grafana dashboard whose host matches the manifest patterns. Each Prometheus query editor row now shows the **AI Assistant** button.

Use `src/config.ts` as the single source of truth when pointing to your production assistants-ui endpoint or customizing overlay sizing.
