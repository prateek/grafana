import { PROM_EDITOR_SELECTORS } from '../config';
import { findFallbackInput, setPromQuery } from './querySetter';
import type { PromEditorDetectionResult } from '../types/editor';

const elementIds = new WeakMap<HTMLElement, string>();
let idCounter = 0;

export function findPromEditors(root: ParentNode = document): PromEditorDetectionResult[] {
  const results: PromEditorDetectionResult[] = [];
  const seen = new Set<HTMLElement>();

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

function createContext(root: HTMLElement): PromEditorDetectionResult | null {
  const toolbar = findToolbar(root) ?? buildToolbar(root);
  const queryInput = findFallbackInput(root);
  const datasource = detectDatasourceName(root) ?? 'Prometheus';
  const id = deriveId(root);

  const getQuery = () => readQueryValue(queryInput ?? findFallbackInput(root));
  const setQuery = (value: string) => setPromQuery(queryInput, value, { root });

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

function readQueryValue(target: HTMLElement | null | undefined): string {
  if (!target) {
    return '';
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }

  const cmHost = target.closest?.('.CodeMirror');
  const cmValue = cmHost && (cmHost as HTMLElement & { CodeMirror?: { getValue: () => string } }).CodeMirror?.getValue();
  if (cmValue) {
    return cmValue;
  }

  return target.textContent?.trim() ?? '';
}

function detectDatasourceName(root: HTMLElement): string | undefined {
  for (const selector of PROM_EDITOR_SELECTORS.datasourceIndicators) {
    const candidate = root.querySelector(selector);
    const text = candidate?.textContent?.trim();
    if (text && /prometheus/i.test(text)) {
      return 'Prometheus';
    }
  }

  const ariaLabel = root.getAttribute('aria-label');
  if (ariaLabel && /prometheus/i.test(ariaLabel)) {
    return 'Prometheus';
  }

  if (/prometheus/i.test(root.textContent ?? '')) {
    return 'Prometheus';
  }

  return undefined;
}

function isPrometheusEditor(root: HTMLElement): boolean {
  return Boolean(detectDatasourceName(root));
}

function deriveId(element: HTMLElement): string {
  const existing = elementIds.get(element);
  if (existing) {
    return existing;
  }

  const attributeCandidates = ['data-panelid', 'data-panel-id', 'data-testid', 'data-uid'];
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

function findToolbar(root: HTMLElement): HTMLElement | null {
  for (const selector of PROM_EDITOR_SELECTORS.toolbarCandidates) {
    const el = root.querySelector(selector);
    if (el instanceof HTMLElement) {
      return el;
    }
  }
  return null;
}

function buildToolbar(root: HTMLElement): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'prom-ai-toolbar';
  root.append(toolbar);
  return toolbar;
}

function findRunButton(root: HTMLElement): HTMLButtonElement | null {
  for (const selector of PROM_EDITOR_SELECTORS.runButtonCandidates) {
    const button = root.querySelector(selector);
    if (button instanceof HTMLButtonElement) {
      return button;
    }
  }
  return null;
}
