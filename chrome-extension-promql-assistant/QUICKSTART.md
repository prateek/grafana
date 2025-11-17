# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- Chrome or Chromium-based browser

## Setup

1. **Install dependencies:**

```sh
npm install
```

2. **Create placeholder icons (optional):**

If you have ImageMagick installed:
```sh
./scripts/create-placeholder-icons.sh
```

Otherwise, create three PNG files manually:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

3. **Build the extension:**

```sh
npm run build
```

This creates a `dist/` directory with all extension files.

4. **Load in Chrome:**

- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode" (toggle in top right)
- Click "Load unpacked"
- Select the `dist/` directory

## Testing

Run the test suite:

```sh
npm test
```

## Configuration

Before building, edit `src/config.ts` to configure:

- `ASSISTANT_IFRAME_URL`: URL of your AI assistant iframe
- `GRAFANA_HOST_PATTERNS`: URLs where the extension should run
- `PROM_EDITOR_SELECTORS`: CSS selectors for detecting Prometheus editors

## Development

For watch mode:

```sh
npm run dev
```

This rebuilds automatically when files change.

## Troubleshooting

### Extension doesn't load

- Check that `dist/manifest.json` exists and is valid JSON
- Verify all required files are in `dist/`
- Check Chrome's extension error page (`chrome://extensions/` → "Errors")

### Button doesn't appear

- Open DevTools console and look for `[PromQL Assistant]` messages
- Verify Grafana URL matches patterns in `manifest.json`
- Check that selectors in `config.ts` match your Grafana version

### Query doesn't insert

- Check console for errors
- Verify the editor type (Monaco/CodeMirror/textarea) is supported
- Ensure `input`/`change` events are being dispatched
