# Changelog

All notable changes to the Grafana Prometheus AI Assistant extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-17

### Added

#### Core Features
- **Automatic Editor Detection**: Detects Prometheus query editors in Grafana using configurable DOM selectors
- **AI Assistant Button**: Injects "AI Assistant" button into each detected query editor toolbar
- **Overlay Panel**: Modal overlay with embedded iframe for AI assistant interaction
- **Query Insertion**: Programmatic query insertion into editors with full event dispatching
- **Multi-Editor Support**: Handles multiple query editors on the same page independently
- **SPA Navigation**: Robust handling of Grafana's single-page application navigation

#### Editor Support
- Monaco Editor detection and query manipulation
- CodeMirror editor detection and query manipulation
- Plain textarea detection and query manipulation
- Fallback mechanisms for each editor type

#### Communication
- Secure postMessage protocol between extension and assistant iframe
- Origin validation for security
- Bidirectional communication:
  - Extension sends query context to iframe
  - Iframe sends query suggestions back to extension

#### Configuration
- Centralized configuration system (`config.ts`)
- Configurable iframe URL
- Customizable DOM selectors for different Grafana versions
- UI customization (button label, z-index, auto-close behavior)
- Debug logging toggle

#### Developer Experience
- TypeScript throughout
- Vite build system with watch mode
- Comprehensive test suite (Vitest + jsdom)
- ESLint and Prettier configuration
- Source maps for debugging

#### Testing
- Unit tests for editor detection
- Unit tests for content script functionality
- Integration tests for full workflow
- 22 test cases with 100% pass rate

#### Documentation
- Detailed README with setup instructions
- Architecture documentation (ARCHITECTURE.md)
- Testing guide (TESTING.md)
- Quick start guide (QUICKSTART.md)
- Contributing guidelines (CONTRIBUTING.md)

#### Styling
- Grafana-native button styling
- Dark theme support
- Responsive overlay design
- Accessible UI elements

### Technical Details

#### Manifest
- Manifest V3 compliance
- Minimal permissions (scripting + host permissions only)
- Proper content script configuration

#### Build Output
- contentScript.js: 17.13 KB (4.58 KB gzipped)
- background.js: 0.93 KB (0.40 KB gzipped)
- overlay.js: 0.09 KB
- Total bundle: ~18 KB

#### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers (Brave, Opera)

### Security
- Origin validation for all postMessage events
- No external dependencies in production
- Minimal permission scope
- No data collection or telemetry

### Known Limitations
- Requires external AI assistant service (not included)
- Icon placeholders need to be added manually
- Firefox support not yet implemented
- Only supports Prometheus datasource (by design)

---

## [Unreleased]

### Planned Features
- Multi-editor overlay switching
- Query history tracking
- Keyboard shortcuts
- Options/settings page (UI-based configuration)
- Metrics context passing
- Support for Loki and other datasources
- Firefox Manifest V3 adaptation

### Potential Improvements
- Direct Monaco/CodeMirror completion provider integration
- Smarter detection using Grafana internal state
- Telemetry (opt-in)
- Chrome Web Store publication
