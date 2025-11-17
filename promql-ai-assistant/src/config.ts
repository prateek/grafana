export const ASSISTANT_IFRAME_URL = 'https://assistant.example.com/embed?mode=promql';
export const ASSISTANT_IFRAME_ALLOWED_ORIGINS = [new URL(ASSISTANT_IFRAME_URL).origin];
export const ASSISTANT_OVERLAY_TITLE = 'PromQL Assistant';
export const ASSISTANT_BUTTON_LABEL = 'AI Assistant';
export const AUTO_CLOSE_OVERLAY_ON_INSERT = false;

export const GRAFANA_HOST_PATTERNS = [
  'https://*/grafana/*',
  'https://grafana.*/*',
  'http://localhost:*/*'
];

export const PROM_EDITOR_SELECTORS = {
  containerCandidates: [
    '[data-testid*="query-editor-row"]',
    '.query-editor-row',
    '.gf-form-query'
  ],
  datasourceIndicators: [
    '[data-testid*="data-source-name"]',
    '[data-testid*="datasource-selector"]',
    '.query-editor-row__header',
    '.gf-form-inline',
    '.datasource-label'
  ],
  queryInputCandidates: [
    'textarea',
    'input[type="text"]',
    '.monaco-editor textarea',
    '.CodeMirror textarea',
    '[contenteditable="true"]'
  ],
  toolbarCandidates: [
    '.query-editor-row__actions',
    '.query-row-action-buttons',
    '.gf-form-inline',
    '.panel-options-group'
  ],
  runButtonCandidates: [
    '[data-testid="run-queries-button"]',
    'button[aria-label*="Run queries"]',
    'button[aria-label*="Run query"]',
    'button[title*="Run queries"]'
  ]
};
