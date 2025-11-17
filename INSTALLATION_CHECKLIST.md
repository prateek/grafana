# Installation Checklist

Use this checklist to verify successful installation and setup.

## Pre-Installation

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Chrome browser available
- [ ] Grafana instance accessible
- [ ] Grafana has Prometheus datasource configured

## Installation Steps

### 1. Project Setup
- [ ] Repository cloned or downloaded
- [ ] Navigate to project directory
- [ ] Run `npm install`
- [ ] All dependencies installed without errors

### 2. Configuration
- [ ] Open `src/config.ts`
- [ ] Set `ASSISTANT_IFRAME_URL` to your assistant service URL
- [ ] Add assistant origin to `ALLOWED_IFRAME_ORIGINS`
- [ ] (Optional) Adjust `GRAFANA_HOST_PATTERNS` for your Grafana URL
- [ ] (Optional) Customize `PROM_EDITOR_SELECTORS` if needed
- [ ] Save changes

### 3. Build
- [ ] Run `npm run build`
- [ ] Build completes successfully
- [ ] `dist/` folder created
- [ ] Run `./verify-build.sh` (all files present)

### 4. Chrome Installation
- [ ] Open Chrome
- [ ] Navigate to `chrome://extensions/`
- [ ] Enable "Developer mode" toggle (top-right)
- [ ] Click "Load unpacked"
- [ ] Select `dist` folder
- [ ] Extension appears in extension list
- [ ] No error messages in extension card

### 5. Verification
- [ ] Extension icon visible (or placeholder shown)
- [ ] Click extension for details - shows version 1.0.0
- [ ] No errors in Chrome DevTools console

## First Use Test

### 1. Open Grafana
- [ ] Navigate to your Grafana instance
- [ ] Log in if required
- [ ] Extension content script should activate (check console for `[PromQL AI]` logs if DEBUG enabled)

### 2. Create/Edit Panel
- [ ] Open existing dashboard or create new one
- [ ] Add or edit a panel
- [ ] Select Prometheus datasource
- [ ] Query editor appears

### 3. Find AI Button
- [ ] "AI Assistant" button visible in query editor toolbar
- [ ] Button has proper styling
- [ ] Button appears blue/teal with icon

### 4. Test Overlay
- [ ] Click "AI Assistant" button
- [ ] Overlay appears
- [ ] Overlay has dark backdrop
- [ ] Panel appears centered/docked
- [ ] Close button (X) visible
- [ ] Iframe loads (or shows loading state)

### 5. Test Closing
- [ ] Click X button - overlay closes
- [ ] Click "AI Assistant" again - overlay reopens
- [ ] Click backdrop (outside panel) - overlay closes

### 6. Test Query Insertion (if assistant is configured)
- [ ] Enter a query in Grafana editor (e.g., "up")
- [ ] Click "AI Assistant"
- [ ] Current query should be sent to assistant
- [ ] (If assistant suggests query) Query inserted into editor
- [ ] Grafana recognizes the change
- [ ] "Run query" button is clickable

## Troubleshooting

If any step fails, refer to:
- [ ] README.md - General troubleshooting
- [ ] QUICKSTART.md - Common issues
- [ ] TESTING.md - Debugging guide

## Optional: Enable Debug Mode

For detailed logging:
- [ ] Edit `src/config.ts`
- [ ] Set `DEBUG: true`
- [ ] Rebuild: `npm run build`
- [ ] Reload extension in Chrome
- [ ] Check browser console for `[PromQL AI]` debug messages

## Optional: Run Tests

- [ ] Run `npm test`
- [ ] All 22 tests pass
- [ ] No errors or warnings

## Optional: Development Setup

For ongoing development:
- [ ] Run `npm run dev` (watch mode)
- [ ] Make a small change to `src/config.ts`
- [ ] File automatically rebuilds
- [ ] Reload extension to see changes

## Success Criteria

✅ Extension loads without errors
✅ Button appears in Prometheus query editor
✅ Overlay opens and closes properly
✅ Query insertion works (if assistant configured)

---

**Status: Ready for use!**

If you encounter issues, check the documentation or open an issue on GitHub.
