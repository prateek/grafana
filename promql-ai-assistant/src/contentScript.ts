import { ASSISTANT_BUTTON_LABEL, ASSISTANT_IFRAME_URL, ASSISTANT_OVERLAY_TITLE } from './config';
import { EditorRegistry } from './editorRegistry';
import { findPromEditors } from './detectors/promEditorDetector';
import type { EditorContext } from './types/editor';
import { ensureAssistantButton } from './ui/injectButton';
import { OverlayController } from './ui/overlay';
import { createAssistantMessageHandler } from './messageBridge';

const registry = new EditorRegistry();
const overlay = new OverlayController();
let currentEditorId: string | null = null;
let scanScheduled = false;

const observer = new MutationObserver(() => scheduleScan());

function init() {
  if (!document.body) {
    return;
  }
  observer.observe(document.body, { childList: true, subtree: true });
  overlay.onClose(() => {
    currentEditorId = null;
  });
  scheduleScan();
}

function scheduleScan() {
  if (scanScheduled) {
    return;
  }
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    syncEditors();
  });
}

function syncEditors() {
  const editors = findPromEditors(document);
  for (const editor of editors) {
    const tracked = registry.upsert(editor);
    if (!tracked.button) {
      const button = ensureAssistantButton(editor, {
        onClick: () => handleAssistantClick(editor)
      });
      registry.setButton(editor.id, button);
    }
  }
  registry.cleanupRemoved();
}

async function handleAssistantClick(editor: EditorContext) {
  currentEditorId = editor.id;
  const frame = await overlay.open({ title: `${ASSISTANT_OVERLAY_TITLE} • ${editor.datasource ?? 'Prometheus'}` });
  if (!frame) {
    return;
  }
  sendContextToAssistant(editor, frame);
}

function sendContextToAssistant(editor: EditorContext, frame?: HTMLIFrameElement) {
  const assistantFrame = frame ?? overlay.getAssistantFrame();
  if (!assistantFrame) {
    return;
  }
  const payload = {
    type: 'promql_context',
    editorId: editor.id,
    datasource: 'prometheus',
    currentQuery: editor.getQuery(),
    buttonLabel: ASSISTANT_BUTTON_LABEL
  } as const;

  postToAssistantFrame(assistantFrame, payload);
}

function postToAssistantFrame(frame: HTMLIFrameElement, payload: unknown) {
  const targetOrigin = new URL(ASSISTANT_IFRAME_URL).origin;
  const send = () => {
    frame.contentWindow?.postMessage(payload, targetOrigin);
  };

  if (frame.contentWindow) {
    send();
  } else {
    frame.addEventListener('load', () => send(), { once: true });
  }
}

const messageHandler = createAssistantMessageHandler({
  registry,
  overlay,
  getActiveEditorId: () => currentEditorId,
  setActiveEditorId: (id) => {
    currentEditorId = id;
  },
  sendContext: (editor) => sendContextToAssistant(editor)
});

window.addEventListener('message', messageHandler);
window.addEventListener('focus', scheduleScan);
window.addEventListener('hashchange', scheduleScan);
window.addEventListener('popstate', scheduleScan);
window.addEventListener('load', scheduleScan, { once: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
