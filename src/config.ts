/**
 * Central configuration for the Grafana Prometheus AI Assistant extension.
 * Modify these values to customize behavior for different environments.
 */

export interface Config {
  /** URL of the assistants-ui iframe to embed */
  ASSISTANT_IFRAME_URL: string;

  /** List of host patterns where the extension should run */
  GRAFANA_HOST_PATTERNS: string[];

  /** Selectors and heuristics for detecting Prometheus query editors */
  PROM_EDITOR_SELECTORS: {
    /** Root container selectors that might contain a query editor */
    rootContainerSelectors: string[];

    /** Selectors for elements that indicate this is a Prometheus datasource */
    prometheusIndicators: string[];

    /** Selectors for the query input element (Monaco, CodeMirror, textarea) */
    queryInputSelectors: string[];

    /** Selectors for the toolbar where we'll inject the AI button */
    toolbarSelectors: string[];

    /** Data attributes that might help identify editors */
    dataAttributes: string[];
  };

  /** UI configuration */
  UI: {
    /** Label for the AI Assistant button */
    buttonLabel: string;

    /** Whether to auto-close the overlay after inserting a query */
    autoCloseOverlayOnInsert: boolean;

    /** Overlay z-index (should be higher than Grafana's UI) */
    overlayZIndex: number;
  };

  /** Allowed origins for postMessage communication */
  ALLOWED_IFRAME_ORIGINS: string[];

  /** Debug mode - enables console logging */
  DEBUG: boolean;
}

/**
 * Default configuration.
 * Update ASSISTANT_IFRAME_URL to point to your actual assistants-ui instance.
 */
export const config: Config = {
  ASSISTANT_IFRAME_URL: 'https://assistant.example.com/embed?mode=promql',

  GRAFANA_HOST_PATTERNS: [
    'https://*/grafana/*',
    'https://grafana.*/*',
    'http://localhost:*/*',
    'https://localhost:*/*',
  ],

  PROM_EDITOR_SELECTORS: {
    // These selectors may need adjustment for different Grafana versions
    // Look for query editor rows, query builders, or plugin-specific containers
    rootContainerSelectors: [
      '[data-testid="query-editor-row"]',
      '.query-editor-row',
      '[data-testid="data-testid-query-row"]',
      '.query-row',
      '.grafana-query-editor',
    ],

    // Indicators that this is a Prometheus datasource
    prometheusIndicators: [
      '[data-testid*="prometheus"]',
      '[aria-label*="Prometheus"]',
      '[aria-label*="prometheus"]',
      'label:has-text("Prometheus")',
      '[data-ds-type="prometheus"]',
      '.prom-query-field',
    ],

    // Query input elements (Monaco, CodeMirror, or plain textarea)
    queryInputSelectors: [
      'textarea[placeholder*="query"]',
      'textarea[placeholder*="PromQL"]',
      '.monaco-editor textarea',
      '.CodeMirror textarea',
      '[data-testid="prometheus-query-editor"]',
      '.query-field__wrapper textarea',
      '.slate-query-field textarea',
    ],

    // Toolbar areas where we can inject the AI button
    toolbarSelectors: [
      '[data-testid="query-editor-row-actions"]',
      '.query-editor-row__actions',
      '.query-operation-row__actions',
      '.gf-form-query-content',
      '.query-operation-row',
    ],

    // Data attributes that may help identify panels/editors
    dataAttributes: ['data-panelid', 'data-testid', 'data-ds-type'],
  },

  UI: {
    buttonLabel: 'AI Assistant',
    autoCloseOverlayOnInsert: false,
    overlayZIndex: 10000,
  },

  // Update this with your actual assistant iframe origin for security
  ALLOWED_IFRAME_ORIGINS: [
    'https://assistant.example.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ],

  DEBUG: true,
};

/**
 * Logger utility that respects DEBUG flag
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (config.DEBUG) {
      console.log('[PromQL AI]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    console.info('[PromQL AI]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[PromQL AI]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[PromQL AI]', ...args);
  },
};
