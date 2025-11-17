export const ASSISTANT_IFRAME_URL = 'https://assistant.example.com/embed?mode=promql';
export const ASSISTANT_ALLOWED_ORIGIN = new URL(ASSISTANT_IFRAME_URL).origin;

export const GRAFANA_HOST_PATTERNS = [
  'https://*/grafana/*',
  'https://grafana.*/*',
  'http://localhost:*/*'
];

export const PROM_EDITOR_SELECTORS = {
  containerCandidates: [
    '[data-testid*="query-editor"]',
    '.query-editor-row',
    '.grafana-query-field',
    '.react-monaco-editor-container'
  ],
  prometheusIndicators: [
    '[data-testid*="prometheus" i]',
    '.gf-form-select-input',
    '.query-editor-header'
  ],
  runButtonCandidates: [
    'button[aria-label*="run query" i]',
    'button[aria-label*="run queries" i]',
    'button[data-testid="query-editor-run"]',
    'button[title*="run query" i]'
  ],
  queryInputs: [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]'
  ]
} as const;

export const BUTTON_LABEL = 'AI Assistant';
export const BUTTON_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>';

export const AUTO_CLOSE_OVERLAY_ON_INSERT = false;

export const OVERLAY_APPEARANCE = {
  width: 420,
  minHeight: 480,
  zIndex: 2147483000
} as const;

export const OVERLAY_STRINGS = {
  title: 'PromQL Assistant'
};

export const OVERLAY_IFRAME_TITLE = 'assistants-ui chat panel';
