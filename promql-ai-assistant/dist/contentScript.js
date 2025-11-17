// src/config.ts
var ASSISTANT_IFRAME_URL = "https://assistant.example.com/embed?mode=promql";
var ASSISTANT_IFRAME_ALLOWED_ORIGINS = [new URL(ASSISTANT_IFRAME_URL).origin];
var ASSISTANT_OVERLAY_TITLE = "PromQL Assistant";
var ASSISTANT_BUTTON_LABEL = "AI Assistant";
var PROM_EDITOR_SELECTORS = {
  containerCandidates: [
    '[data-testid*="query-editor-row"]',
    ".query-editor-row",
    ".gf-form-query"
  ],
  datasourceIndicators: [
    '[data-testid*="data-source-name"]',
    '[data-testid*="datasource-selector"]',
    ".query-editor-row__header",
    ".gf-form-inline",
    ".datasource-label"
  ],
  queryInputCandidates: [
    "textarea",
    'input[type="text"]',
    ".monaco-editor textarea",
    ".CodeMirror textarea",
    '[contenteditable="true"]'
  ],
  toolbarCandidates: [
    ".query-editor-row__actions",
    ".query-row-action-buttons",
    ".gf-form-inline",
    ".panel-options-group"
  ],
  runButtonCandidates: [
    '[data-testid="run-queries-button"]',
    'button[aria-label*="Run queries"]',
    'button[aria-label*="Run query"]',
    'button[title*="Run queries"]'
  ]
};

// src/editorRegistry.ts
var EditorRegistry = class {
  constructor() {
    this.editors = /* @__PURE__ */ new Map();
    this.elementToId = /* @__PURE__ */ new WeakMap();
  }
  upsert(context) {
    const existing = this.editors.get(context.id);
    if (existing) {
      existing.context = context;
      this.elementToId.set(context.root, context.id);
      return existing;
    }
    const tracked = { context };
    this.editors.set(context.id, tracked);
    this.elementToId.set(context.root, context.id);
    return tracked;
  }
  getContext(id) {
    return this.editors.get(id)?.context;
  }
  setButton(id, button) {
    const tracked = this.editors.get(id);
    if (!tracked) {
      throw new Error(`Editor ${id} is not registered.`);
    }
    tracked.button = button;
  }
  getButton(id) {
    return this.editors.get(id)?.button;
  }
  forEach(callback) {
    for (const tracked of this.editors.values()) {
      callback(tracked);
    }
  }
  cleanupRemoved() {
    for (const [id, tracked] of this.editors.entries()) {
      if (!document.body.contains(tracked.context.root)) {
        tracked.button?.remove();
        this.editors.delete(id);
      }
    }
  }
  hasElement(element) {
    const id = this.elementToId.get(element);
    return Boolean(id && this.editors.has(id));
  }
};

// src/detectors/querySetter.ts
function findFallbackInput(root) {
  for (const selector of PROM_EDITOR_SELECTORS.queryInputCandidates) {
    const candidate = root.querySelector(selector);
    if (candidate instanceof HTMLTextAreaElement || candidate instanceof HTMLInputElement || candidate instanceof HTMLElement) {
      return candidate;
    }
  }
  return null;
}
function setPromQuery(element, value, options = {}) {
  const target = element ?? (options.root ? findFallbackInput(options.root) : null);
  if (!target) {
    throw new Error("Unable to locate a writable element for the Prometheus query.");
  }
  if (applyCodeMirrorValue(target, value)) {
    return;
  }
  if (applyMonacoValue(target, value)) {
    return;
  }
  applyGenericValue(target, value);
}
function applyGenericValue(target, value) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    focusElement(target);
    const prototype = Object.getPrototypeOf(target);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) {
      descriptor.set.call(target, value);
    } else {
      target.value = value;
    }
    dispatchEditorEvents(target);
    return;
  }
  focusElement(target);
  target.textContent = value;
  dispatchEditorEvents(target);
}
function applyMonacoValue(target, value) {
  const textarea = target instanceof HTMLTextAreaElement ? target : target.querySelector?.(".monaco-editor textarea");
  if (!textarea) {
    return false;
  }
  const monacoHost = textarea.closest(".monaco-editor");
  const monacoInstance = monacoHost?.__monaco;
  if (monacoInstance?.setValue) {
    monacoInstance.setValue(value);
    return true;
  }
  focusElement(textarea);
  textarea.value = value;
  dispatchEditorEvents(textarea);
  synthesizeKeyEvent(textarea, "Enter");
  return true;
}
function applyCodeMirrorValue(target, value) {
  const cmHost = target instanceof HTMLElement ? target.closest(".CodeMirror") : null;
  const cmInstance = cmHost?.CodeMirror;
  if (cmInstance) {
    cmInstance.focus();
    cmInstance.setValue(value);
    return true;
  }
  return false;
}
function focusElement(el) {
  if (document.activeElement !== el) {
    el.focus();
  }
}
function dispatchEditorEvents(el) {
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromPaste", data: el.innerText }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}
function synthesizeKeyEvent(target, key) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  target.dispatchEvent(event);
}

// src/detectors/promEditorDetector.ts
var elementIds = /* @__PURE__ */ new WeakMap();
var idCounter = 0;
function findPromEditors(root = document) {
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  for (const selector of PROM_EDITOR_SELECTORS.containerCandidates) {
    const nodes = Array.from(root.querySelectorAll(selector));
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (seen.has(node)) {
        continue;
      }
      if (!isPrometheusEditor(node)) {
        continue;
      }
      const context = createContext(node);
      if (context) {
        results.push(context);
        seen.add(node);
      }
    }
  }
  return results;
}
function createContext(root) {
  const toolbar = findToolbar(root) ?? buildToolbar(root);
  const queryInput = findFallbackInput(root);
  const datasource = detectDatasourceName(root) ?? "Prometheus";
  const id = deriveId(root);
  const getQuery = () => readQueryValue(queryInput ?? findFallbackInput(root));
  const setQuery = (value) => setPromQuery(queryInput, value, { root });
  const runQuery = () => {
    const button = findRunButton(root);
    button?.click();
  };
  return {
    id,
    root,
    toolbar,
    datasource,
    queryInput,
    getQuery,
    setQuery,
    runQuery
  };
}
function readQueryValue(target) {
  if (!target) {
    return "";
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }
  const cmHost = target.closest?.(".CodeMirror");
  const cmValue = cmHost && cmHost.CodeMirror?.getValue();
  if (cmValue) {
    return cmValue;
  }
  return target.textContent?.trim() ?? "";
}
function detectDatasourceName(root) {
  for (const selector of PROM_EDITOR_SELECTORS.datasourceIndicators) {
    const candidate = root.querySelector(selector);
    const text = candidate?.textContent?.trim();
    if (text && /prometheus/i.test(text)) {
      return "Prometheus";
    }
  }
  const ariaLabel = root.getAttribute("aria-label");
  if (ariaLabel && /prometheus/i.test(ariaLabel)) {
    return "Prometheus";
  }
  if (/prometheus/i.test(root.textContent ?? "")) {
    return "Prometheus";
  }
  return void 0;
}
function isPrometheusEditor(root) {
  return Boolean(detectDatasourceName(root));
}
function deriveId(element) {
  const existing = elementIds.get(element);
  if (existing) {
    return existing;
  }
  const attributeCandidates = ["data-panelid", "data-panel-id", "data-testid", "data-uid"];
  for (const attr of attributeCandidates) {
    const value = element.getAttribute(attr);
    if (value) {
      elementIds.set(element, value);
      return value;
    }
  }
  const generated = `promql-editor-${++idCounter}`;
  elementIds.set(element, generated);
  return generated;
}
function findToolbar(root) {
  for (const selector of PROM_EDITOR_SELECTORS.toolbarCandidates) {
    const el = root.querySelector(selector);
    if (el instanceof HTMLElement) {
      return el;
    }
  }
  return null;
}
function buildToolbar(root) {
  const toolbar = document.createElement("div");
  toolbar.className = "prom-ai-toolbar";
  root.append(toolbar);
  return toolbar;
}
function findRunButton(root) {
  for (const selector of PROM_EDITOR_SELECTORS.runButtonCandidates) {
    const button = root.querySelector(selector);
    if (button instanceof HTMLButtonElement) {
      return button;
    }
  }
  return null;
}

// src/ui/injectButton.ts
var BUTTON_ATTRIBUTE = "data-prom-ai-button";
function ensureAssistantButton(editor, options) {
  const existing = editor.toolbar.querySelector(`[${BUTTON_ATTRIBUTE}="${editor.id}"]`);
  if (existing instanceof HTMLButtonElement) {
    return existing;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "prom-ai-assistant-button";
  button.setAttribute(BUTTON_ATTRIBUTE, editor.id);
  button.title = "Open the PromQL AI assistant";
  button.innerHTML = `${sparkIcon()}<span>${ASSISTANT_BUTTON_LABEL}</span>`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    options.onClick(editor);
  });
  editor.toolbar.appendChild(button);
  return button;
}
function sparkIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l1.76 5.42H19l-4.38 3.18L16.38 16 12 12.82 7.62 16l1.76-5.4L5 7.42h5.24z"></path>
    </svg>
  `;
}

// src/ui/overlay.html?raw
var overlay_default = '<div class="prom-ai-overlay" data-prom-ai-overlay hidden>\n  <div class="prom-ai-overlay__backdrop" data-prom-ai-overlay-close></div>\n  <section class="prom-ai-overlay__panel" role="dialog" aria-modal="true">\n    <header class="prom-ai-overlay__header">\n      <h2 class="prom-ai-overlay__title" data-prom-ai-overlay-title>PromQL Assistant</h2>\n      <button type="button" class="prom-ai-overlay__close" data-prom-ai-overlay-close aria-label="Close PromQL assistant">\n        \xD7\n      </button>\n    </header>\n    <div class="prom-ai-overlay__body">\n      <iframe\n        title="Assistants UI"\n        class="prom-ai-overlay__iframe"\n        src="about:blank"\n        data-prom-ai-assistant-frame\n        allow="clipboard-write"\n      ></iframe>\n    </div>\n  </section>\n</div>\n';

// src/ui/overlay.ts
var OverlayController = class {
  constructor() {
    this.closeHandlers = /* @__PURE__ */ new Set();
  }
  open(options = {}) {
    this.ensureMounted();
    if (!this.root) {
      return Promise.resolve(null);
    }
    this.root.hidden = false;
    if (options.title) {
      this.setTitle(options.title);
    }
    return Promise.resolve(this.ensureAssistantFrame());
  }
  close() {
    if (!this.root) {
      return;
    }
    this.root.hidden = true;
    for (const handler of this.closeHandlers) {
      handler();
    }
  }
  isOpen() {
    return Boolean(this.root && !this.root.hidden);
  }
  onClose(handler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }
  getAssistantFrame() {
    return this.assistantFrame ?? null;
  }
  ensureMounted() {
    if (this.root) {
      return;
    }
    const template = document.createElement("template");
    template.innerHTML = overlay_default.trim();
    const element = template.content.firstElementChild;
    if (!(element instanceof HTMLElement)) {
      throw new Error("Overlay template is missing a root element.");
    }
    this.root = element;
    this.assistantFrame = element.querySelector("[data-prom-ai-assistant-frame]");
    this.titleEl = element.querySelector("[data-prom-ai-overlay-title]");
    const closeTargets = element.querySelectorAll("[data-prom-ai-overlay-close]");
    closeTargets.forEach((closeEl) => closeEl.addEventListener("click", () => this.close()));
    document.body.appendChild(element);
  }
  ensureAssistantFrame() {
    if (!this.assistantFrame) {
      return null;
    }
    const currentSrc = this.assistantFrame.getAttribute("src");
    if (!currentSrc || currentSrc === "about:blank") {
      this.assistantFrame.src = ASSISTANT_IFRAME_URL;
    }
    return this.assistantFrame;
  }
  setTitle(title) {
    if (!this.titleEl) {
      return;
    }
    this.titleEl.textContent = title || ASSISTANT_OVERLAY_TITLE;
  }
};

// src/messageBridge.ts
function createAssistantMessageHandler(deps) {
  return function handleAssistantMessage(event) {
    if (!ASSISTANT_IFRAME_ALLOWED_ORIGINS.includes(event.origin)) {
      return;
    }
    if (!isAssistantMessage(event.data)) {
      return;
    }
    const data = event.data;
    if (data.type === "promql_suggestion" && typeof data.query === "string") {
      const editorId = data.editorId || deps.getActiveEditorId();
      if (!editorId) {
        return;
      }
      const editor = deps.registry.getContext(editorId);
      if (!editor) {
        return;
      }
      editor.setQuery(data.query);
      editor.runQuery?.();
      return;
    }
    if (data.type === "promql_context_request") {
      const editorId = data.editorId || deps.getActiveEditorId();
      if (!editorId) {
        return;
      }
      const editor = deps.registry.getContext(editorId);
      if (!editor) {
        return;
      }
      deps.sendContext(editor);
      return;
    }
    if (data.type === "promql_focus_editor" && typeof data.editorId === "string") {
      const editor = deps.registry.getContext(data.editorId);
      if (!editor) {
        return;
      }
      deps.setActiveEditorId(data.editorId);
      deps.sendContext(editor);
    }
  };
}
function isAssistantMessage(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  const candidate = data;
  const editorId = candidate.editorId;
  switch (candidate.type) {
    case "promql_suggestion":
      return typeof candidate.query === "string" && (editorId === void 0 || typeof editorId === "string");
    case "promql_context_request":
      return editorId === void 0 || typeof editorId === "string";
    case "promql_focus_editor":
      return typeof editorId === "string";
    default:
      return false;
  }
}

// src/contentScript.ts
var registry = new EditorRegistry();
var overlay = new OverlayController();
var currentEditorId = null;
var scanScheduled = false;
var observer = new MutationObserver(() => scheduleScan());
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
async function handleAssistantClick(editor) {
  currentEditorId = editor.id;
  const frame = await overlay.open({ title: `${ASSISTANT_OVERLAY_TITLE} \u2022 ${editor.datasource ?? "Prometheus"}` });
  if (!frame) {
    return;
  }
  sendContextToAssistant(editor, frame);
}
function sendContextToAssistant(editor, frame) {
  const assistantFrame = frame ?? overlay.getAssistantFrame();
  if (!assistantFrame) {
    return;
  }
  const payload = {
    type: "promql_context",
    editorId: editor.id,
    datasource: "prometheus",
    currentQuery: editor.getQuery(),
    buttonLabel: ASSISTANT_BUTTON_LABEL
  };
  postToAssistantFrame(assistantFrame, payload);
}
function postToAssistantFrame(frame, payload) {
  const targetOrigin = new URL(ASSISTANT_IFRAME_URL).origin;
  const send = () => {
    frame.contentWindow?.postMessage(payload, targetOrigin);
  };
  if (frame.contentWindow) {
    send();
  } else {
    frame.addEventListener("load", () => send(), { once: true });
  }
}
var messageHandler = createAssistantMessageHandler({
  registry,
  overlay,
  getActiveEditorId: () => currentEditorId,
  setActiveEditorId: (id) => {
    currentEditorId = id;
  },
  sendContext: (editor) => sendContextToAssistant(editor)
});
window.addEventListener("message", messageHandler);
window.addEventListener("focus", scheduleScan);
window.addEventListener("hashchange", scheduleScan);
window.addEventListener("popstate", scheduleScan);
window.addEventListener("load", scheduleScan, { once: true });
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
