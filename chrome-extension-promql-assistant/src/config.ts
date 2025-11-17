/**
 * Central configuration for the Grafana PromQL AI Assistant extension.
 * Modify these values to adjust behavior for different Grafana versions or environments.
 */

export interface PromEditorSelectors {
  // Selectors for finding Prometheus query editor containers
  // These may need adjustment for different Grafana versions
  containerSelectors: string[];
  // Selector for finding the query type/datasource indicator
  datasourceIndicator: string;
  // Selectors for finding the actual query input element
  queryInputSelectors: string[];
  // Data attributes that might identify Prometheus editors
  dataAttributes: string[];
}

// Note: In a browser extension context, process.env may not be available.
// For production builds, use Vite's define or replace this with a build-time constant.
export const ASSISTANT_IFRAME_URL =
  (typeof process !== 'undefined' && process.env?.ASSISTANT_IFRAME_URL) ||
  'https://assistant.example.com/embed?mode=promql';

export const GRAFANA_HOST_PATTERNS = [
  'https://*/grafana/*',
  'https://grafana.*/*',
  'http://localhost:*/*',
];

export const PROM_EDITOR_SELECTORS: PromEditorSelectors = {
  // Common container selectors for Prometheus query editors
  // Adjust these if Grafana's DOM structure changes
  containerSelectors: [
    '.query-editor-row', // Common Grafana query editor row class
    '[data-testid*="prometheus-"]', // Data test ID pattern
    '[data-testid*="prom-"]', // Alternative pattern
  ],
  // Look for labels or text indicating Prometheus datasource
  datasourceIndicator: 'label, .gf-form-label, [class*="datasource"]',
  // Query input selectors - these target Monaco, CodeMirror, or textarea inputs
  queryInputSelectors: [
    'textarea.monaco-mouse-cursor-text', // Monaco editor hidden textarea
    '.monaco-editor textarea', // Monaco editor textarea
    '.CodeMirror', // CodeMirror editor
    'textarea[data-testid*="query"]', // Generic query textarea
    'input[data-testid*="query"]', // Generic query input
    'textarea', // Fallback to any textarea in the container
  ],
  // Data attributes that might help identify Prometheus editors
  dataAttributes: ['data-testid', 'data-datasource', 'data-query-type'],
};

export const AUTO_CLOSE_OVERLAY_ON_INSERT = false;

export const BUTTON_LABEL = 'AI Assistant';

export const OVERLAY_CONFIG = {
  width: '600px',
  height: '700px',
  zIndex: 999999,
};

// Validate iframe origin for postMessage security
export function isValidIframeOrigin(origin: string): boolean {
  try {
    const url = new URL(ASSISTANT_IFRAME_URL);
    return origin === url.origin;
  } catch {
    return false;
  }
}
