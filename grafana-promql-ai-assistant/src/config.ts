/**
 * Central configuration for the Grafana PromQL AI Assistant extension.
 * Adjust these values to customize behavior for different Grafana versions or environments.
 */

export interface Config {
  /** URL of the assistants-ui iframe to embed in the overlay */
  assistantIframeUrl: string;

  /** Host patterns where the extension should be active */
  grafanaHostPatterns: string[];

  /** Selectors and heuristics for detecting Prometheus query editors */
  promEditorSelectors: {
    /** Container selector for query editor rows */
    editorRowContainer: string;
    /** Selector for elements indicating Prometheus datasource */
    prometheusIndicator: string;
    /** Selector for the query input element (Monaco, CodeMirror, or textarea) */
    queryInput: string;
    /** Data attribute that might contain panel/editor IDs */
    editorIdAttribute?: string;
  };

  /** Button configuration */
  button: {
    label: string;
    className: string;
  };

  /** Overlay configuration */
  overlay: {
    rootId: string;
    title: string;
    /** Whether to auto-close overlay after inserting a query */
    autoCloseOnInsert: boolean;
    /** Iframe width in pixels */
    iframeWidth: number;
    /** Iframe height in pixels */
    iframeHeight: number;
  };

  /** postMessage configuration */
  messaging: {
    /** Allowed origin for iframe messages (must match assistantIframeUrl origin) */
    allowedOrigin: string;
  };
}

/**
 * Default configuration.
 * Modify these values to adapt to different Grafana versions or deployment scenarios.
 */
export const config: Config = {
  assistantIframeUrl: 'https://assistant.example.com/embed?mode=promql',
  grafanaHostPatterns: [
    'https://*/grafana/*',
    'https://grafana.*/*',
    'http://localhost:*/*',
  ],

  promEditorSelectors: {
    // Common Grafana query editor container classes
    // Adjust these if Grafana's DOM structure changes in future versions
    editorRowContainer: '.query-editor-row, [class*="query-editor"], [data-testid*="query-editor"]',
    
    // Look for labels or text indicating Prometheus datasource
    prometheusIndicator: '[class*="prometheus"], [data-datasource*="prometheus"], label:has-text("Prometheus")',
    
    // Query input selectors - try Monaco first, then CodeMirror, then plain textarea
    queryInput: 'textarea.monaco-mouse-cursor-text, .CodeMirror textarea, textarea[class*="query"], input[class*="query"]',
    
    // Optional: data attribute for stable editor IDs
    editorIdAttribute: 'data-panelid',
  },

  button: {
    label: 'AI Assistant',
    className: 'prom-ai-assistant-button',
  },

  overlay: {
    rootId: 'prom-ai-overlay-root',
    title: 'PromQL Assistant',
    autoCloseOnInsert: false,
    iframeWidth: 600,
    iframeHeight: 700,
  },

  messaging: {
    // Extract origin from assistantIframeUrl
    allowedOrigin: new URL('https://assistant.example.com').origin,
  },
};

/**
 * Get the allowed origin from the iframe URL.
 * This ensures the origin matches the configured iframe URL.
 */
export function getAllowedOrigin(iframeUrl: string): string {
  try {
    return new URL(iframeUrl).origin;
  } catch {
    return config.messaging.allowedOrigin;
  }
}
