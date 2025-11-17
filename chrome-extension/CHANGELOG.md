# Changelog

All notable changes to the Grafana PromQL AI Assistant extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-17

### Added
- Initial release of Grafana PromQL AI Assistant Chrome extension
- Manifest V3 Chrome extension implementation
- TypeScript-based codebase with strict typing
- Vite build system with hot reload support
- Comprehensive test suite (83 tests, 100% passing)
- ESLint and Prettier configuration for code quality

#### Core Features
- **Editor Detection**: Automatically detects Prometheus query editors in Grafana
  - Supports Monaco Editor
  - Supports CodeMirror
  - Supports plain textarea
  - Configurable selectors for different Grafana versions
  - Handles multiple editors on the same page

- **Button Injection**: Injects "✨ AI Assistant" button into query editor toolbar
  - Idempotent injection (no duplicates)
  - Custom SVG icon
  - Namespaced CSS to avoid conflicts
  - Styled to match Grafana aesthetic

- **Overlay Panel**: AI assistant chat interface
  - Right-side docked panel (configurable)
  - Iframe-based AI assistant integration
  - Semi-transparent backdrop
  - Slide-in animation
  - Responsive design
  - Dark theme support

- **PostMessage Communication**: Secure iframe communication
  - `promql_context` message (content script → iframe)
  - `promql_suggestion` message (iframe → content script)
  - `close_overlay` message (iframe → content script)
  - Origin validation
  - Type-safe message interfaces

- **SPA Navigation**: Handles Grafana's single-page application navigation
  - MutationObserver for DOM changes
  - Debounced re-scanning
  - Automatic cleanup of stale editors
  - Registry-based editor tracking

- **Configuration System**: Centralized config in `src/config.ts`
  - Configurable iframe URL and origin
  - Configurable Grafana host patterns
  - Configurable editor selectors
  - Configurable UI options (button label, overlay behavior)
  - Debug logging options

#### Testing
- Editor detection tests (13 tests)
- Button injection tests (15 tests)
- Editor registry tests (17 tests)
- Overlay manager tests (24 tests)
- Message handler tests (14 tests)
- Test setup with Vitest and jsdom

#### Documentation
- `README.md`: Comprehensive documentation
- `QUICKSTART.md`: 5-minute setup guide
- `CONTRIBUTING.md`: Developer guide
- `ICONS.md`: Icon creation guide
- `PROJECT_SUMMARY.md`: Project overview and verification
- Inline code comments throughout

#### Development Tools
- NPM scripts for build, dev, test, lint, format
- TypeScript configuration with strict mode
- Vite configuration for extension bundling
- ESLint rules for code quality
- Prettier rules for consistent formatting
- Git ignore file
- Verification script

#### Browser Support
- Chrome (Manifest V3)
- Chromium-based browsers (Edge, Brave, etc.)

### Developer Experience
- Clean, modular architecture
- Type-safe codebase
- Well-documented code
- Easy to extend and customize
- Fast build times (~200ms)
- Small bundle size (~12KB total)

### Security
- Minimal permissions (only what's needed)
- PostMessage origin validation
- Iframe sandboxing
- No external network requests from extension
- Configurable allowed origins

## [Unreleased]

### Planned Features
- Support for additional datasources (Loki, etc.)
- Configurable keyboard shortcuts
- Query history tracking
- User preferences storage
- Chrome Web Store publication
- Firefox port (WebExtensions)

### Known Issues
- Extension icons are placeholders (need custom icons)
- Grafana selector configuration may need updates for specific versions
- No visual feedback while query is being inserted

---

## Version History

- **1.0.0** (2025-11-17): Initial release

[1.0.0]: https://github.com/yourusername/grafana-promql-ai-assistant/releases/tag/v1.0.0
