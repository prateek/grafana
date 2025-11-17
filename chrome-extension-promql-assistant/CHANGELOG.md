# Changelog

## [1.0.0] - Initial Release

### Added
- Prometheus query editor detection with support for Monaco, CodeMirror, and textarea inputs
- AI Assistant button injection into each Prometheus query editor
- Overlay chat panel with iframe integration
- postMessage communication protocol between content script and iframe
- MutationObserver for handling SPA navigation
- Editor registry for managing multiple editors
- Comprehensive test suite
- Configuration system for easy customization
- Documentation (README, QUICKSTART)

### Features
- Works with vanilla Grafana (no modifications required)
- Supports multiple query editors on the same page
- Handles dynamic DOM changes (SPA navigation)
- Secure origin validation for postMessage
- Configurable selectors for different Grafana versions
- Dark mode support

### Technical
- Manifest V3 compliant
- TypeScript throughout
- Vite build system
- Vitest test framework
- ESLint + Prettier for code quality
