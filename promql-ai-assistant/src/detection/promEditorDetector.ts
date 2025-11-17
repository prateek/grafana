import { PROM_EDITOR_SELECTORS } from '../config';
import type { EditorDetectionResult } from '../types';

const generatedIds = new WeakMap<HTMLElement, string>();
let idCounter = 0;

const containerSelector = PROM_EDITOR_SELECTORS.containerCandidates.join(',');
const queryInputSelector = PROM_EDITOR_SELECTORS.queryInputs.join(',');
const runButtonSelector = PROM_EDITOR_SELECTORS.runButtonCandidates.join(',');

const PROM_LABEL = /prometheus/i;

export function findPromEditors(root: ParentNode = document): EditorDetectionResult[] {
  const nodes = root.querySelectorAll<HTMLElement>(containerSelector);
  const seen = new Map<string, EditorDetectionResult>();

  nodes.forEach(node => {
    const editorRoot = resolveEditorRoot(node);
    if (!editorRoot || !isPrometheusEditor(editorRoot)) {
      return;
    }

    const context = createEditorContext(editorRoot);
    if (!seen.has(context.id)) {
      seen.set(context.id, context);
    }
  });

  return Array.from(seen.values());
}

function resolveEditorRoot(node: HTMLElement): HTMLElement | null {
  const queryRow = node.closest<HTMLElement>('.query-editor-row');
  if (queryRow) {
    return queryRow;
  }
  const panel = node.closest<HTMLElement>('[data-panelid], [data-panel-id]');
  return panel ?? node;
}

function isPrometheusEditor(root: HTMLElement): boolean {
  if (root.dataset.promAiEditorChecked === 'true') {
    return root.dataset.promAiEditorType === 'prometheus';
  }

  const dsName = (root.dataset.datasource ?? root.getAttribute('data-datasource') ?? '').trim();
  if (PROM_LABEL.test(dsName)) {
    root.dataset.promAiEditorType = 'prometheus';
    root.dataset.promAiEditorChecked = 'true';
    return true;
  }

  const indicatorNodes = root.querySelectorAll<HTMLElement>(
    PROM_EDITOR_SELECTORS.prometheusIndicators.join(',')
  );

  for (const indicator of indicatorNodes) {
    const text = (indicator.textContent ?? '').trim();
    if (PROM_LABEL.test(text)) {
      root.dataset.promAiEditorType = 'prometheus';
      root.dataset.promAiEditorChecked = 'true';
      return true;
    }
  }

  const ariaLabel = root.getAttribute('aria-label') ?? '';
  if (PROM_LABEL.test(ariaLabel) || PROM_LABEL.test(root.textContent ?? '')) {
    root.dataset.promAiEditorType = 'prometheus';
    root.dataset.promAiEditorChecked = 'true';
    return true;
  }

  root.dataset.promAiEditorChecked = 'true';
  root.dataset.promAiEditorType = 'unknown';
  return false;
}

function createEditorContext(root: HTMLElement): EditorDetectionResult {
  const id = getEditorId(root);
  const buttonHost = findButtonHost(root);

  return {
    id,
    datasource: 'prometheus',
    root,
    buttonHost,
    getQuery: () => readQueryValue(root),
    setQuery: next => applyQueryValue(root, next),
    runQuery: () => triggerRun(root)
  };
}

function findButtonHost(root: HTMLElement): HTMLElement | null {
  const candidates = [
    '[data-testid="query-editor-actions"]',
    '.query-editor-row .gf-form-inline:last-child',
    '.query-editor-row .query-editor-actions',
    '.gf-form-inline'
  ];

  for (const selector of candidates) {
    const host = root.querySelector<HTMLElement>(selector);
    if (host) {
      return host;
    }
  }

  return root;
}

function getEditorId(root: HTMLElement): string {
  const existing = root.dataset.promAiEditorId;
  if (existing) {
    return existing;
  }

  const attributeCandidates = [
    'data-panelid',
    'data-panel-id',
    'data-testid',
    'id',
    'data-uid'
  ];

  for (const attr of attributeCandidates) {
    const attrValue = root.getAttribute(attr);
    if (attrValue) {
      generatedIds.set(root, attrValue);
      root.dataset.promAiEditorId = attrValue;
      return attrValue;
    }
  }

  const generated = `prom-editor-${++idCounter}`;
  generatedIds.set(root, generated);
  root.dataset.promAiEditorId = generated;
  return generated;
}

function readQueryValue(root: HTMLElement): string {
  const codeMirror = root.querySelector<HTMLElement>('.CodeMirror');
  if (codeMirror && (codeMirror as any).CodeMirror) {
    return (codeMirror as any).CodeMirror.getValue();
  }

  const monaco = root.querySelector<HTMLElement>('.monaco-editor');
  if (monaco) {
    const modelText = readMonacoText(monaco);
    if (modelText.trim().length) {
      return modelText;
    }
  }

  const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(queryInputSelector);
  if (input) {
    return 'value' in input ? input.value : input.textContent ?? '';
  }

  const editable = root.querySelector<HTMLElement>('[contenteditable="true"]');
  return editable?.textContent ?? '';
}

function readMonacoText(editorRoot: HTMLElement): string {
  const lines = editorRoot.querySelectorAll<HTMLElement>('.view-lines .view-line');
  if (lines.length === 0) {
    return editorRoot.textContent ?? '';
  }
  const text = Array.from(lines)
    .map(line => (line.textContent ?? '').replace(/\u00a0/g, ' '))
    .join('\n');
  return text;
}

function applyQueryValue(root: HTMLElement, value: string): boolean {
  if (!value && value !== '') {
    return false;
  }

  const codeMirror = root.querySelector<HTMLElement>('.CodeMirror');
  if (codeMirror && (codeMirror as any).CodeMirror) {
    const cm = (codeMirror as any).CodeMirror;
    cm.focus();
    cm.setValue(value);
    return true;
  }

  if (tryMonacoUpdate(root, value)) {
    return true;
  }

  const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(queryInputSelector);
  if (input) {
    setNativeInputValue(input, value);
    return true;
  }

  const editable = root.querySelector<HTMLElement>('[contenteditable="true"]');
  if (editable) {
    editable.focus();
    editable.textContent = value;
    dispatchInputEvents(editable);
    dispatchChange(editable);
    return true;
  }

  return false;
}

function tryMonacoUpdate(root: HTMLElement, value: string): boolean {
  const monacoContainer = root.querySelector<HTMLElement>('.monaco-editor');
  if (!monacoContainer) {
    return false;
  }

  const monacoApi = (window as typeof window & { monaco?: any }).monaco;
  if (monacoApi?.editor?.getModels) {
    const models = monacoApi.editor.getModels();
    if (models?.length === 1) {
      models[0].setValue(value);
      return true;
    }
  }

  const textarea = monacoContainer.querySelector<HTMLTextAreaElement>('textarea');
  if (!textarea) {
    return false;
  }

  textarea.focus();
  textarea.value = value;
  if (typeof textarea.setSelectionRange === 'function') {
    textarea.setSelectionRange(0, value.length);
  }

  try {
    document.execCommand('selectAll');
    document.execCommand('insertText', false, value);
  } catch (error) {
    // Some browsers may block execCommand; rely on value assignment instead.
  }

  dispatchInputEvents(textarea, value);
  dispatchChange(textarea);
  return true;
}

function setNativeInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
  descriptor?.set?.call(el, value);
  el.value = value;
  dispatchInputEvents(el, value);
  dispatchChange(el);
}

function dispatchInputEvents(target: EventTarget, data = ''): void {
  try {
    const event = new InputEvent('input', {
      bubbles: true,
      composed: true,
      data
    });
    target.dispatchEvent(event);
  } catch {
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function dispatchChange(target: EventTarget): void {
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function triggerRun(root: HTMLElement): boolean {
  const button = root.querySelector<HTMLButtonElement>(runButtonSelector);
  if (button) {
    button.click();
    return true;
  }

  const ancestorButton = root.closest<HTMLElement>('[data-panelid], [data-panel-id]')?.querySelector<HTMLButtonElement>(
    runButtonSelector
  );
  if (ancestorButton) {
    ancestorButton.click();
    return true;
  }

  return false;
}
