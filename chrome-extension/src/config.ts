/**
 * Centralized configuration for the Grafana PromQL AI Assistant extension
 * Modify these values to customize behavior for different environments
 */

export const config = {
  /**
   * URL of the AI assistant iframe to embed in the overlay
   * Example: 'https://assistant.example.com/embed?mode=promql'
   */
  ASSISTANT_IFRAME_URL: 'https://assistant.example.com/embed?mode=promql',

  /**
   * Allowed origin for postMessage communication
   * Must match the domain of ASSISTANT_IFRAME_URL for security
   */
  ASSISTANT_IFRAME_ORIGIN: 'https://assistant.example.com',

  /**
   * Host patterns for Grafana instances where this extension should run
   * These should match the patterns in manifest.json
   */
  GRAFANA_HOST_PATTERNS: [
    'https://*/grafana/*',
    'https://grafana.*/*',
    'http://localhost:*/*',
  ],

  /**
   * CSS selectors and patterns for detecting Prometheus query editors
   * Adjust these if Grafana's DOM structure changes in different versions
   */
  PROM_EDITOR_SELECTORS: {
    /**
     * Selectors to find query editor containers
     * Try each selector in order until one matches
     */
    containerSelectors: [
      // Grafana 9.x and 10.x - query editor rows
      '[data-testid="query-editor-row"]',
      '.query-editor-row',
      // Alternative: look for elements with Prometheus-related attributes
      '[data-ds-type="prometheus"]',
      // Broader fallback: any element containing query editor components
      '.grafana-query-editor',
    ],

    /**
     * Selectors to identify that this is specifically a Prometheus datasource
     * Look for these within the container to confirm it's a Prometheus editor
     */
    prometheusIndicators: [
      // Data source type indicator
      '[data-testid*="prometheus"]',
      '[data-ds-type="prometheus"]',
      // Query type label or button
      'button[aria-label*="prometheus" i]',
      // Note: :has-text() is not valid CSS, removed
      // Use the text content check in isPrometheusEditor instead
    ],

    /**
     * Selectors for finding the query input element
     * These are tried in order for each detected editor
     */
    queryInputSelectors: [
      // Monaco editor (most common in recent Grafana versions)
      '.monaco-editor textarea',
      '.monaco-editor',
      // CodeMirror editor
      '.CodeMirror',
      // Plain textarea fallback
      'textarea[placeholder*="query" i]',
      'textarea.gf-form-input',
      // Generic textarea
      'textarea',
      // Input fallback
      'input[type="text"]',
    ],

    /**
     * Selector for the toolbar area where we'll inject the AI button
     * We look for the action buttons row within the query editor
     */
    toolbarSelectors: [
      '[data-testid="query-editor-toolbar"]',
      '.query-editor-toolbar',
      '.query-editor-row .toolbar',
      '.gf-form-query-content',
    ],
  },

  /**
   * UI Configuration
   */
  UI: {
    /**
     * Button label for the AI assistant trigger
     */
    BUTTON_LABEL: '✨ AI Assistant',

    /**
     * Automatically close overlay after inserting a query suggestion
     */
    AUTO_CLOSE_OVERLAY_ON_INSERT: false,

    /**
     * Overlay position and sizing
     */
    OVERLAY: {
      width: '500px',
      height: '600px',
      position: 'right' as 'right' | 'center',
      zIndex: 10000,
    },
  },

  /**
   * Debugging options
   */
  DEBUG: {
    /**
     * Enable console logging for debugging
     */
    ENABLE_LOGGING: true,

    /**
     * Log prefix for easy filtering
     */
    LOG_PREFIX: '[PromQL AI]',
  },
};

/**
 * Helper function to log debug messages
 */
export function debugLog(...args: unknown[]): void {
  if (config.DEBUG.ENABLE_LOGGING) {
    console.log(config.DEBUG.LOG_PREFIX, ...args);
  }
}

/**
 * Helper function to log errors
 */
export function debugError(...args: unknown[]): void {
  if (config.DEBUG.ENABLE_LOGGING) {
    console.error(config.DEBUG.LOG_PREFIX, ...args);
  }
}
