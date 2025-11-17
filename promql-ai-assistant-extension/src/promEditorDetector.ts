import { PROM_EDITOR_SELECTORS } from './config';

export type QueryInputStrategyType = 'monaco' | 'codemirror' | 'textarea' | 'contenteditable';

export interface QueryInputStrategy {
  type: QueryInputStrategyType;
  element: HTMLElement;
  getValue(): string;
  setValue(value: string): void;
}

export interface EditorContext {
  id: string;
  root: HTMLElement;
  toolbar: HTMLElement | null;
  strategy: QueryInputStrategy;
}

let incrementalId = 0;
const elementIdMap = new WeakMap<HTMLElement, string>();

export function findPrometheusEditors(entry: Document | HTMLElement = document): EditorContext[] {
  const hosts = collectCandidateEditors(entry);
  const contexts: EditorContext[] = [];

  for (const host of hosts) {
    if (!isPrometheusEditor(host)) {
      continue;
    }

    const strategy = createStrategy(host);
    if (!strategy) {
      continue;
    }

    const toolbar = findToolbar(host);
    const id = getEditorId(host);
    contexts.push({
      id,
      root: host,
      toolbar,
      strategy,
    });
  }

  return contexts;
}

function collectCandidateEditors(entry: Document | HTMLElement): HTMLElement[] {
  const selectors = new Set<string>([
    PROM_EDITOR_SELECTORS.queryEditorRow,
    ...(PROM_EDITOR_SELECTORS.extraContainers ?? []),
  ]);

  const results: HTMLElement[] = [];
  selectors.forEach((selector) => {
    if (!selector) {
      return;
    }
    entry.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLElement && !results.includes(node)) {
        results.push(node);
      }
    });
  });

  return results;
}

function isPrometheusEditor(host: HTMLElement): boolean {
  if (host.dataset.datasource === 'Prometheus') {
    return true;
  }
  if (host.dataset.datasourceName && /prometheus/i.test(host.dataset.datasourceName)) {
    return true;
  }

  const attrNames = ['data-datasource-name', 'data-datasource', 'data-panel-subtype'];
  for (const attr of attrNames) {
    const value = host.getAttribute(attr);
    if (value && PROM_EDITOR_SELECTORS.dataSourceKeyword.test(value)) {
      return true;
    }
  }

  const labelers = PROM_EDITOR_SELECTORS.dataSourceLabelers ?? [];
  for (const selector of labelers) {
    const labelElement = host.querySelector(selector);
    if (labelElement && PROM_EDITOR_SELECTORS.dataSourceKeyword.test(labelElement.textContent ?? '')) {
      return true;
    }
  }

  const selects = host.querySelectorAll<HTMLSelectElement>('select');
  for (const select of selects) {
    if (PROM_EDITOR_SELECTORS.dataSourceKeyword.test(select.value ?? '')) {
      return true;
    }
    const selectedOption = select.selectedOptions?.[0];
    if (selectedOption && PROM_EDITOR_SELECTORS.dataSourceKeyword.test(selectedOption.textContent ?? '')) {
      return true;
    }
  }

  return PROM_EDITOR_SELECTORS.dataSourceKeyword.test(host.textContent ?? '');
}

function createStrategy(host: HTMLElement): QueryInputStrategy | null {
  const candidates = PROM_EDITOR_SELECTORS.queryInputCandidates ?? [];

  for (const selector of candidates) {
    const element = host.querySelector<HTMLElement>(selector);
    if (!element) {
      continue;
    }
    if (element.closest('.monaco-editor')) {
      return createMonacoStrategy(element as HTMLTextAreaElement);
    }
    if (element.closest('.CodeMirror')) {
      return createCodeMirrorStrategy(element as HTMLTextAreaElement);
    }
    if (element.matches('textarea') || element.matches('input')) {
      return createTextInputStrategy(element as HTMLTextAreaElement | HTMLInputElement);
    }
    if (element.isContentEditable) {
      return createContentEditableStrategy(element);
    }
  }

  return null;
}

function createTextInputStrategy(element: HTMLTextAreaElement | HTMLInputElement): QueryInputStrategy {
  const type: QueryInputStrategyType = 'textarea';
  return {
    type,
    element,
    getValue: () => element.value ?? '',
    setValue: (value: string) => {
      element.focus();
      setNativeValue(element, value);
      emitInputEvents(element);
    },
  };
}

function createMonacoStrategy(element: HTMLTextAreaElement): QueryInputStrategy {
  const monacoHost = element.closest<HTMLElement>('.monaco-editor');
  return {
    type: 'monaco',
    element,
    getValue: () => element.value || (monacoHost?.textContent ?? '').trim(),
    setValue: (value: string) => {
      const editorInstance = getMonacoInstance(monacoHost);
      if (editorInstance && typeof editorInstance.setValue === 'function') {
        editorInstance.setValue(value);
        emitChangeEvent(monacoHost ?? element);
        return;
      }
      element.focus();
      setNativeValue(element, value);
      simulatePaste(element, value);
      emitInputEvents(element);
    },
  };
}

function createCodeMirrorStrategy(element: HTMLTextAreaElement): QueryInputStrategy {
  const host = element.closest<HTMLElement>('.CodeMirror');
  return {
    type: 'codemirror',
    element,
    getValue: () => element.value || (host?.textContent ?? '').trim(),
    setValue: (value: string) => {
      const cm = getCodeMirrorInstance(host);
      if (cm && typeof cm.setValue === 'function') {
        cm.setValue(value);
        emitChangeEvent(host ?? element);
        return;
      }
      element.focus();
      setNativeValue(element, value);
      emitInputEvents(element);
    },
  };
}

function createContentEditableStrategy(element: HTMLElement): QueryInputStrategy {
  return {
    type: 'contenteditable',
    element,
    getValue: () => element.textContent ?? '',
    setValue: (value: string) => {
      element.focus();
      element.textContent = value;
      emitInputEvents(element);
    },
  };
}

function setNativeValue(element: HTMLTextAreaElement | HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
  descriptor?.set?.call(element, value);
  element.value = value;
}

function emitInputEvents(element: HTMLElement) {
  element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  emitChangeEvent(element);
}

function emitChangeEvent(element: HTMLElement) {
  element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

function simulatePaste(element: HTMLTextAreaElement, value: string) {
  const clipboardEvent = new ClipboardEvent('paste', {
    bubbles: true,
    dataType: 'text/plain',
    data: value,
  });
  element.dispatchEvent(clipboardEvent);
}

function getMonacoInstance(host?: HTMLElement | null): any {
  if (!host) {
    return null;
  }
  const editorInstance = (host as any).__monacoEditor ?? (host as any).monacoEditor;
  if (editorInstance) {
    return editorInstance;
  }
  const globalMonaco = (window as any).monaco;
  if (globalMonaco?.editor?.getEditors) {
    const editors = globalMonaco.editor.getEditors();
    return editors.find((editor: any) => editor.getDomNode && editor.getDomNode() === host);
  }
  return null;
}

function getCodeMirrorInstance(host?: HTMLElement | null): any {
  return (host as any)?.CodeMirror ?? (host as any)?.codemirrorInstance ?? null;
}

function findToolbar(host: HTMLElement): HTMLElement | null {
  const selectors = PROM_EDITOR_SELECTORS.toolbarCandidates ?? [];
  for (const selector of selectors) {
    const el = host.querySelector<HTMLElement>(selector);
    if (el) {
      return el;
    }
  }
  return host;
}

function getEditorId(host: HTMLElement): string {
  const existing = elementIdMap.get(host);
  if (existing) {
    return existing;
  }
  const datasetIds = [
    host.dataset.testid,
    host.dataset.panelid,
    host.dataset.uid,
    host.getAttribute('data-testid'),
    host.getAttribute('data-panelid'),
  ];
  const match = datasetIds.find((value) => value && value.trim().length > 0);
  const id = match ?? `prom-editor-${++incrementalId}`;
  elementIdMap.set(host, id);
  return id;
}

export function setPromQuery(context: EditorContext, query: string) {
  context.strategy.setValue(query);
}

export function getPromQuery(context: EditorContext): string {
  return context.strategy.getValue();
}
