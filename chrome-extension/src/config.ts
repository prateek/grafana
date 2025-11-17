/**
 * Central configuration for the Grafana Prometheus AI Assistant extension.
 * Modify these values to customize behavior for different Grafana versions or environments.
 */

export const CONFIG = {
  /**
   * URL of the assistants-ui iframe to embed in the overlay.
   * This should point to your AI assistant chat interface.
   */
  ASSISTANT_IFRAME_URL: 'https://assistant.example.com/embed?mode=promql',

  /**
   * Allowed origin for postMessage communication with the iframe.
   * MUST match the origin of ASSISTANT_IFRAME_URL for security.
   */
  ASSISTANT_IFRAME_ORIGIN: 'https://assistant.example.com',

  /**
   * Grafana host patterns for extension activation.
   * These are also defined in manifest.json - keep them in sync.
   */
  GRAFANA_HOST_PATTERNS: [
    'https://*/grafana/*',
    'https://grafana.*/*',
    'http://localhost:*/*',
  ],

  /**
   * CSS selectors and detection heuristics for finding Prometheus query editors.
   * Adjust these if Grafana's DOM structure changes across versions.
   *
   * The detector will look for containers matching these patterns and
   * verify they contain Prometheus-related elements.
   */
  PROM_EDITOR_SELECTORS: {
    /**
     * Selectors for the main query editor container.
     * The detector tries these in order until it finds matches.
     */
    containerSelectors: [
      // Modern Grafana (9.x+): Look for query editor rows
      '.query-editor-row',
      '[data-testid="query-editor-row"]',
      '.query-editor',
      // Older versions: Look for explore query rows
      '.explore-query-row',
      // Generic fallback: any div containing query-related classes
      'div[class*="query"]',
    ],

    /**
     * Selectors to identify Prometheus datasource within a container.
     * At least one of these should be present to confirm it's a Prom editor.
     */
    datasourceIndicators: [
      // Data attributes
      '[data-testid*="prometheus"]',
      '[data-datasource-type="prometheus"]',
      // Labels or text content
      'label:contains("Prometheus")',
      // Dropdown/select values
      'select option[value*="prometheus"]:checked',
      // Plugin info
      '[data-plugin-id="prometheus"]',
    ],

    /**
     * Selectors for the actual query input element.
     * These are searched within the editor container.
     */
    queryInputSelectors: [
      // Monaco editor (common in newer Grafana)
      '.monaco-editor textarea',
      '.monaco-editor [contenteditable="true"]',
      // CodeMirror (older versions)
      '.CodeMirror textarea',
      // Plain textarea fallback
      'textarea[placeholder*="query"]',
      'textarea[name*="query"]',
      'textarea.query-input',
    ],

    /**
     * Selectors for the toolbar/actions area where we'll inject our button.
     * We'll try to append to an existing button container.
     */
    toolbarSelectors: [
      '.query-editor-actions',
      '.query-actions',
      '[data-testid="query-editor-actions"]',
      '.explore-toolbar',
      '.toolbar',
    ],
  },

  /**
   * AI Assistant button configuration
   */
  BUTTON_CONFIG: {
    label: 'AI Assistant',
    className: 'prom-ai-assistant-button',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm1 10H7v-5h2v5z"/>
    </svg>`,
  },

  /**
   * Overlay panel configuration
   */
  OVERLAY_CONFIG: {
    title: 'PromQL Assistant',
    width: '600px',
    height: '700px',
    position: 'right', // 'center' | 'right' | 'left'
    zIndex: 10000,
    /**
     * Whether to automatically close/minimize the overlay after inserting a query
     */
    autoCloseOnInsert: false,
    /**
     * Whether the overlay is draggable (not implemented in v1, placeholder for future)
     */
    draggable: false,
  },

  /**
   * Message types for iframe communication
   */
  MESSAGE_TYPES: {
    // Content script -> iframe
    CONTEXT: 'promql_context',
    // Iframe -> content script
    SUGGESTION: 'promql_suggestion',
  },

  /**
   * Debugging and logging
   */
  DEBUG: {
    enabled: true,
    prefix: '[Grafana Prom AI]',
  },

  /**
   * MutationObserver configuration
   */
  OBSERVER_CONFIG: {
    // Debounce delay for DOM mutations (ms)
    debounceDelay: 300,
    // MutationObserver options
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: false,
    },
  },
} as const;

/**
 * Logger utility that respects DEBUG config
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (CONFIG.DEBUG.enabled) {
      console.log(CONFIG.DEBUG.prefix, ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (CONFIG.DEBUG.enabled) {
      console.warn(CONFIG.DEBUG.prefix, ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(CONFIG.DEBUG.prefix, ...args);
  },
};
