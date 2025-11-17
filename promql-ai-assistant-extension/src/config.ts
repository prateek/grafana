const embeddedAssistantUrl =
  typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('ui/overlay.html')
    : 'https://assistant.example.com/embed?mode=promql';

export const ASSISTANT_IFRAME_URL = embeddedAssistantUrl;
export const IFRAME_ALLOWED_ORIGIN = new URL(ASSISTANT_IFRAME_URL).origin;

export const AUTO_CLOSE_OVERLAY_ON_INSERT = false;
export const AUTO_RUN_QUERY_AFTER_INSERT = true;

export const BUTTON_LABEL = 'AI Assistant';
export const OVERLAY_ROOT_ID = 'prom-ai-overlay-root';
export const GRAFANA_HOST_PATTERNS = [
  'https://*/grafana/*',
  'https://grafana.*/*',
  'http://localhost:*/*',
];

export const PROM_EDITOR_SELECTORS = {
  queryEditorRow: '.query-editor-row',
  extraContainers: [
    '[data-testid*="prometheus"]',
    '[data-testid*="promql"]',
    '[class*="prometheus"]',
    '[data-component="prom-query-editor"]',
  ],
  dataSourceLabelers: [
    '[data-testid*="data-source"]',
    '.query-editor-row .gf-form-label',
    '.query-ctrl .query-ctrl-select',
    '.panel-title-container',
  ],
  dataSourceKeyword: /prometheus/i,
  queryInputCandidates: [
    '.monaco-editor textarea',
    '.CodeMirror textarea',
    'textarea[data-testid*="query"]',
    '[data-testid*="prom-query"]',
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
  ],
  toolbarCandidates: [
    '.query-editor-row .query-ctrl-actions',
    '.query-editor-row .gf-form-inline',
    '.query-editor-row .query-editor-header',
    '.panel-header .panel-controls-container',
  ],
};
