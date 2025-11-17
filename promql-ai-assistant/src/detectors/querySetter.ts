import { PROM_EDITOR_SELECTORS } from '../config';

export type QueryWritableElement = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

interface SetOptions {
  root?: HTMLElement;
}

export function findFallbackInput(root: HTMLElement): QueryWritableElement | null {
  for (const selector of PROM_EDITOR_SELECTORS.queryInputCandidates) {
    const candidate = root.querySelector(selector);
    if (candidate instanceof HTMLTextAreaElement || candidate instanceof HTMLInputElement || candidate instanceof HTMLElement) {
      return candidate;
    }
  }
  return null;
}

export function setPromQuery(element: QueryWritableElement | null, value: string, options: SetOptions = {}): void {
  const target = element ?? (options.root ? findFallbackInput(options.root) : null);
  if (!target) {
    throw new Error('Unable to locate a writable element for the Prometheus query.');
  }

  if (applyCodeMirrorValue(target, value)) {
    return;
  }

  if (applyMonacoValue(target, value)) {
    return;
  }

  applyGenericValue(target, value);
}

function applyGenericValue(target: QueryWritableElement, value: string) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    focusElement(target);
    const prototype = Object.getPrototypeOf(target) as HTMLInputElement | HTMLTextAreaElement;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
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

function applyMonacoValue(target: QueryWritableElement, value: string): boolean {
  const textarea = target instanceof HTMLTextAreaElement ? target : target.querySelector?.('.monaco-editor textarea');
  if (!textarea) {
    return false;
  }

  const monacoHost = textarea.closest('.monaco-editor');
  const monacoInstance = (monacoHost as HTMLElement & { __monaco?: { setValue: (val: string) => void } })?.__monaco;
  if (monacoInstance?.setValue) {
    monacoInstance.setValue(value);
    return true;
  }

  focusElement(textarea);
  textarea.value = value;
  dispatchEditorEvents(textarea);
  synthesizeKeyEvent(textarea, 'Enter');
  return true;
}

function applyCodeMirrorValue(target: QueryWritableElement, value: string): boolean {
  const cmHost = target instanceof HTMLElement ? target.closest('.CodeMirror') : null;
  const cmInstance = (cmHost as HTMLElement & { CodeMirror?: { setValue: (val: string) => void; focus: () => void } })?.CodeMirror;
  if (cmInstance) {
    cmInstance.focus();
    cmInstance.setValue(value);
    return true;
  }
  return false;
}

function focusElement(el: HTMLElement) {
  if (document.activeElement !== el) {
    el.focus();
  }
}

function dispatchEditorEvents(el: HTMLElement) {
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: el.innerText }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function synthesizeKeyEvent(target: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  target.dispatchEvent(event);
}
