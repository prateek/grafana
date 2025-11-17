# Quick Start Guide

Get up and running with the Grafana Prometheus AI Assistant extension in 5 minutes.

## Prerequisites

- Node.js 18+ and npm
- Chrome browser (or Chromium-based browser)
- A Grafana instance with Prometheus datasource

## Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd grafana-prometheus-ai-assistant
npm install
```

### 2. Configure

Edit `src/config.ts`:

```typescript
export const config: Config = {
  // REQUIRED: Point to your AI assistant service
  ASSISTANT_IFRAME_URL: 'https://your-assistant-url.com/embed?mode=promql',
  
  // REQUIRED: Whitelist your assistant's origin for security
  ALLOWED_IFRAME_ORIGINS: [
    'https://your-assistant-url.com',
  ],
  
  // Optional: Adjust for your Grafana installation
  GRAFANA_HOST_PATTERNS: [
    'https://*/grafana/*',
    'http://localhost:*/*', // Local development
  ],
};
```

### 3. Build

```bash
npm run build
```

This creates the extension in the `dist/` folder.

### 4. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list

## First Use

### 1. Open Grafana

Navigate to your Grafana instance (e.g., http://localhost:3000)

### 2. Create/Edit a Dashboard

- Open an existing dashboard, or create a new one
- Add or edit a panel with a Prometheus datasource

### 3. Find the AI Button

In the query editor, you should see an **"AI Assistant"** button:

```
[Query Editor Row]
  Prometheus ▼  [Code] [Builder]
  
  [Your PromQL Query Here...]
  
  [+ Query] [AI Assistant] [Run query]
```

### 4. Try It Out

1. Click the **AI Assistant** button
2. An overlay should appear with your assistant interface
3. The assistant receives the current query (if any)
4. When the assistant suggests a query, it's inserted automatically

## Troubleshooting

### Extension Doesn't Load

- Check for errors in Chrome DevTools console
- Verify `manifest.json` exists in `dist/` folder
- Try reloading the extension

### AI Button Doesn't Appear

**Option 1: Enable Debug Mode**

Set `DEBUG: true` in `src/config.ts`, rebuild, reload extension.

Check browser console for messages like:

```
[PromQL AI] Content script initializing
[PromQL AI] Found 1 Prometheus editors
[PromQL AI] Injected AI button for editor editor-panel-1
```

**Option 2: Check Grafana Version**

The extension uses configurable selectors. If your Grafana version has different markup:

1. Inspect the query editor DOM in DevTools
2. Note the class names and data attributes
3. Update selectors in `src/config.ts`:

```typescript
PROM_EDITOR_SELECTORS: {
  rootContainerSelectors: [
    // Add your custom selectors
    '.your-custom-editor-class',
  ],
  // ...
}
```

4. Rebuild and reload

### Overlay Doesn't Open

- Verify `ASSISTANT_IFRAME_URL` is accessible (open it directly in a browser)
- Check browser console for CSP (Content Security Policy) errors
- Ensure the URL is in `ALLOWED_IFRAME_ORIGINS`

### Query Insertion Doesn't Work

Different Grafana versions use different editors:

- **Monaco** (Grafana 9+): Most common
- **CodeMirror** (Grafana 7-8): Still supported
- **Plain textarea**: Rare

The extension auto-detects editor type. If insertion fails:

1. Check console logs to see which type was detected
2. Manually test by opening browser console and running:

```javascript
// Find textarea
const textarea = document.querySelector('textarea');
textarea.value = 'test query';
textarea.dispatchEvent(new Event('input', {bubbles: true}));
```

If manual test works, the extension should too. If not, file an issue.

## Next Steps

### Customize the UI

Edit `src/styles/content.css` to change button appearance:

```css
.prom-ai-assistant-button {
  color: #your-color;
  border-color: #your-color;
}
```

### Adjust Behavior

In `src/config.ts`:

```typescript
UI: {
  buttonLabel: 'My Custom Label',
  autoCloseOverlayOnInsert: true, // Close overlay after inserting query
  overlayZIndex: 10000, // Adjust if overlay is behind other elements
}
```

### Test Changes

```bash
npm run dev  # Watch mode - rebuilds on file changes
```

After rebuilding, click the reload icon on the extension card in Chrome.

### Run Tests

```bash
npm test
```

## Development Workflow

1. Edit files in `src/`
2. Run `npm run dev` (watch mode) or `npm run build`
3. Reload extension in Chrome
4. Refresh Grafana page
5. Test changes
6. Run `npm test` to verify tests pass

## Example: Mock Assistant for Testing

Don't have an assistant service yet? Create a simple mock:

**mock-assistant.html:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mock PromQL Assistant</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    button { padding: 10px; margin: 5px; }
  </style>
</head>
<body>
  <h2>Mock PromQL Assistant</h2>
  <p>Current query: <span id="current"></span></p>
  <button onclick="suggest('up{job=&quot;prometheus&quot;}')">Suggest: up</button>
  <button onclick="suggest('rate(http_requests_total[5m])')">Suggest: rate</button>
  
  <script>
    // Listen for context
    window.addEventListener('message', (e) => {
      if (e.data.type === 'promql_context') {
        document.getElementById('current').textContent = e.data.currentQuery || '(empty)';
        window.editorId = e.data.editorId;
      }
    });
    
    // Send suggestion
    function suggest(query) {
      window.parent.postMessage({
        type: 'promql_suggestion',
        editorId: window.editorId,
        query: query,
      }, '*');
    }
  </script>
</body>
</html>
```

Serve this file locally:

```bash
npx serve .
```

Update `config.ts`:

```typescript
ASSISTANT_IFRAME_URL: 'http://localhost:3000/mock-assistant.html',
ALLOWED_IFRAME_ORIGINS: ['http://localhost:3000'],
```

Rebuild and test!

## Support

- Check `README.md` for detailed documentation
- See `ARCHITECTURE.md` for technical details
- See `TESTING.md` for testing guide
- Open an issue on GitHub for bugs or questions

## Common Issues

### "Failed to load extension"

Make sure you're loading the `dist` folder, not the root folder.

### "Could not load icon"

Icon files are optional. You can ignore this or add placeholder icons to `dist/icons/`.

### Extension not working after Grafana update

Grafana's DOM structure may have changed. Update selectors in `src/config.ts`.

### Overlay iframe is blank

Check that the iframe URL loads correctly. Open it in a new tab to test.

---

**Ready?** Load the extension and start using AI assistance for your PromQL queries!
