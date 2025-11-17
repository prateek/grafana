# Testing Guide

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm test:watch
```

### With Coverage

```bash
npm test -- --coverage
```

## Test Structure

Tests are organized in `src/tests/`:

- `setup.ts`: Test configuration and mocks
- `promEditorDetector.test.ts`: Editor detection unit tests
- `contentScript.test.ts`: Content script unit tests
- `integration.test.ts`: End-to-end integration tests

## Writing Tests

### Testing Editor Detection

```typescript
import { findEditors } from '../promEditorDetector';

it('should detect my custom editor', () => {
  document.body.innerHTML = `
    <div class="my-custom-editor" data-ds="prometheus">
      <textarea></textarea>
    </div>
  `;

  const editors = findEditors();
  expect(editors).toHaveLength(1);
  expect(editors[0].getQuery()).toBe('');
});
```

### Testing Button Injection

```typescript
import { scanAndInjectButtons } from '../contentScript';

it('should inject button for my editor', () => {
  document.body.innerHTML = `<!-- Your editor HTML -->`;
  
  scanAndInjectButtons();
  
  const button = document.querySelector('.prom-ai-assistant-button');
  expect(button).toBeTruthy();
});
```

### Testing Query Insertion

```typescript
import { handleQuerySuggestion } from '../contentScript';

it('should insert suggested query', () => {
  // Setup editor
  document.body.innerHTML = `<!-- Your editor HTML -->`;
  scanAndInjectButtons();
  
  const editorId = Array.from(editorRegistry.keys())[0];
  
  // Simulate suggestion
  handleQuerySuggestion({
    type: 'promql_suggestion',
    editorId,
    query: 'up{job="test"}',
  });
  
  // Verify
  const textarea = document.querySelector('textarea');
  expect(textarea.value).toBe('up{job="test"}');
});
```

## Manual Testing

### Setup Test Environment

1. **Option A: Docker Grafana**

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana
```

Access at http://localhost:3000 (admin/admin)

2. **Option B: Local Grafana**

Use your existing Grafana installation.

### Testing Checklist

- [ ] Extension loads without errors
- [ ] Button appears in Prometheus query editor
- [ ] Button has correct styling
- [ ] Clicking button opens overlay
- [ ] Overlay has correct z-index (above Grafana UI)
- [ ] Iframe loads (check Network tab)
- [ ] Close button works
- [ ] Backdrop click closes overlay
- [ ] Multiple editors on same page work independently
- [ ] Query insertion works (mock message from iframe)
- [ ] SPA navigation doesn't break detection
- [ ] Dark theme support looks good

### Simulating postMessage

To test without a real assistant iframe, open browser console:

```javascript
// Find the iframe
const iframe = document.querySelector('.prom-ai-overlay-iframe');

// Simulate a suggestion
window.postMessage({
  type: 'promql_suggestion',
  editorId: 'editor-panel-1', // Replace with actual editor ID
  query: 'rate(http_requests_total[5m])',
}, '*');
```

### Testing Different Grafana Versions

1. **Grafana 9.x**: Uses Monaco editor
2. **Grafana 8.x**: May use CodeMirror or Monaco
3. **Grafana 7.x**: Primarily CodeMirror

Test detection and insertion on each version if possible.

## Debugging

### Enable Debug Logging

In `src/config.ts`:

```typescript
DEBUG: true
```

Rebuild and reload extension. Check console for `[PromQL AI]` messages.

### Common Debug Steps

1. **Button not appearing?**
   - Check if editors are detected: Look for "Found N Prometheus editors" log
   - Inspect DOM to see if editor structure matches selectors
   - Try adjusting `PROM_EDITOR_SELECTORS` in config

2. **Query not inserting?**
   - Check which editor type is detected
   - Verify events are being dispatched (use event listener in test)
   - Try different event combinations

3. **Overlay not working?**
   - Check if overlay element is created in DOM
   - Verify iframe URL is accessible
   - Look for CSP errors in console

### Browser DevTools Tips

- **Elements Tab**: Inspect injected button and overlay structure
- **Console Tab**: Check for errors and debug logs
- **Network Tab**: Verify iframe loads
- **Sources Tab**: Set breakpoints in extension code

## Performance Testing

### Measuring Scan Performance

```typescript
console.time('scan');
scanAndInjectButtons();
console.timeEnd('scan');
```

Typical scan should complete in <50ms for a page with 5-10 editors.

### Memory Leak Testing

1. Open Grafana dashboard with multiple panels
2. Navigate between dashboards repeatedly
3. Check Memory tab in DevTools
4. Verify editor registry is cleaned up (check size)

## Integration Testing

### Real Grafana Instance

1. Set up local Grafana with Prometheus datasource
2. Create test dashboard with multiple query panels
3. Load extension
4. Test all features end-to-end

### Mock Assistant Service

Create a simple HTML page for testing:

```html
<!DOCTYPE html>
<html>
<head><title>Mock Assistant</title></head>
<body>
  <button onclick="sendSuggestion()">Send Test Query</button>
  <script>
    function sendSuggestion() {
      window.parent.postMessage({
        type: 'promql_suggestion',
        editorId: prompt('Editor ID?'),
        query: 'up{job="test"}',
      }, '*');
    }
    
    window.addEventListener('message', (e) => {
      console.log('Received:', e.data);
    });
  </script>
</body>
</html>
```

Point `ASSISTANT_IFRAME_URL` to this page for testing.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run build
```

## Test Coverage Goals

- **Editor Detection**: 90%+ coverage
- **Content Script**: 85%+ coverage
- **Integration**: Key workflows covered

Run coverage report:

```bash
npm test -- --coverage
```

Open `coverage/index.html` to view detailed report.

## Troubleshooting Test Failures

### Tests fail with "Failed to resolve import"

Ensure `vitest.config.ts` has correct `include` and `exclude` patterns.

### Mock Chrome API issues

Check `src/tests/setup.ts` has all required Chrome API mocks.

### DOM tests fail

Ensure `jsdom` environment is configured in vitest config.

### Timing issues

If tests are flaky, add small delays or use `waitFor` utilities.
