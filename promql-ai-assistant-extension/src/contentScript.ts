import { AUTO_RUN_QUERY_AFTER_INSERT, IFRAME_ALLOWED_ORIGIN } from './config';
import { ensureAssistantButton, removeAssistantButton } from './buttonInjector';
import { EditorRegistry } from './editorRegistry';
import {
  EditorContext,
  findPrometheusEditors,
  setPromQuery,
  getPromQuery,
} from './promEditorDetector';
import { OverlayController } from './overlayController';

type SuggestionMessage = {
  type: 'promql_suggestion';
  editorId: string;
  query: string;
};

type IframeReadyMessage = {
  type: 'promql_iframe_ready';
};

const registry = new EditorRegistry();
const overlay = new OverlayController();
let mutationObserver: MutationObserver | null = null;
const extensionOrigin =
  typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? new URL(chrome.runtime.getURL('/')).origin
    : null;

function boot() {
  initMutationObserver();
  scanEditors();
  window.addEventListener('message', handleIncomingMessages);
  console.info('[PromQL Assistant] content script initialized');
}

function initMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
  mutationObserver = new MutationObserver(scheduleScan);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

let scanPending = false;
function scheduleScan() {
  if (scanPending) {
    return;
  }
  scanPending = true;
  requestAnimationFrame(() => {
    scanPending = false;
    scanEditors();
  });
}

function scanEditors() {
  const discovered = findPrometheusEditors();
  const activeIds = new Set(discovered.map((c) => c.id));

  discovered.forEach((context) => {
    registry.upsert(context, {
      onCreate: (entry) => {
        entry.button = ensureAssistantButton(entry.context, handleAssistantButtonClick);
      },
      onUpdate: (entry) => {
        if (!entry.button || !entry.button.isConnected) {
          entry.button = ensureAssistantButton(entry.context, handleAssistantButtonClick);
        }
      },
    });
  });

  registry.pruneUnused(
    (entry) => activeIds.has(entry.context.id) && document.body.contains(entry.context.root),
    (entry) => {
      if (entry.button) {
        removeAssistantButton(entry.context);
        entry.button = undefined;
      }
    },
  );
}

function handleAssistantButtonClick(context: EditorContext) {
  overlay.openForEditor(context);
  overlay.sendContext({
    editorId: context.id,
    datasource: 'prometheus',
    currentQuery: getPromQuery(context),
  });
}

function handleIncomingMessages(event: MessageEvent) {
  if (!isAllowedOrigin(event.origin)) {
    return;
  }
  const data = event.data as SuggestionMessage | IframeReadyMessage | undefined;
  if (!data || typeof data !== 'object') {
    return;
  }

  if (data.type === 'promql_iframe_ready') {
    overlay.markIframeReady();
    const editorId = overlay.getCurrentEditorId();
    if (editorId) {
      const registered = registry.get(editorId);
      if (registered) {
        overlay.sendContext({
          editorId,
          datasource: 'prometheus',
          currentQuery: getPromQuery(registered.context),
        });
      }
    }
    return;
  }

  if (data.type === 'promql_suggestion') {
    applySuggestion(data);
  }
}

function isAllowedOrigin(origin: string) {
  if (IFRAME_ALLOWED_ORIGIN === 'null') {
    return true;
  }
  if (origin === IFRAME_ALLOWED_ORIGIN) {
    return true;
  }
  if (extensionOrigin && origin === extensionOrigin) {
    return true;
  }
  return false;
}

function applySuggestion(message: SuggestionMessage) {
  const entry = registry.get(message.editorId);
  if (!entry) {
    console.warn('[PromQL Assistant] Unknown editor id', message.editorId);
    return;
  }

  setPromQuery(entry.context, message.query);
  if (AUTO_RUN_QUERY_AFTER_INSERT) {
    triggerGrafanaRefresh(entry.context.root);
  }
  if (overlay.shouldAutoCloseAfterInsert()) {
    overlay.close();
  }
}

function triggerGrafanaRefresh(root: HTMLElement) {
  const runButtons = [
    '[data-testid="run-queries-button"]',
    '[aria-label*="Run queries" i]',
    'button[title*="Run queries" i]',
    '.query-ctrl .query-editor-run-button',
  ];
  for (const selector of runButtons) {
    const button = root.querySelector<HTMLButtonElement>(selector) ?? document.querySelector(selector);
    if (button) {
      button.click();
      return;
    }
  }
}

boot();
