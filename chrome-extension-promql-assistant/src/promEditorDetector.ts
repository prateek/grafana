/**
 * Prometheus query editor detection module.
 * Handles finding and interacting with Prometheus query editors in Grafana's DOM.
 */

import { PROM_EDITOR_SELECTORS } from './config';
import type { EditorContext } from './types';

/**
 * Checks if an element or its children contain text indicating Prometheus datasource
 */
function isPrometheusDatasource(element: HTMLElement): boolean {
  const text = element.textContent?.toLowerCase() || '';
  return text.includes('prometheus') || text.includes('promql');
}

/**
 * Finds the query input element within a container.
 * Handles Monaco, CodeMirror, and plain textarea/input elements.
 */
function findQueryInput(container: HTMLElement): HTMLElement | null {
  for (const selector of PROM_EDITOR_SELECTORS.queryInputSelectors) {
    const element = container.querySelector(selector) as HTMLElement | null;
    if (element) {
      return element;
    }
  }
  return null;
}

/**
 * Creates a function to get the current query text from an input element.
 */
function createGetQuery(inputElement: HTMLElement): () => string {
  return () => {
    // Handle Monaco editor (hidden textarea)
    if (inputElement.tagName === 'TEXTAREA' && inputElement.classList.contains('monaco-mouse-cursor-text')) {
      return inputElement.value;
    }
    // Handle CodeMirror
    const codeMirror = (inputElement as any).CodeMirror;
    if (codeMirror) {
      return codeMirror.getValue();
    }
    // Handle plain textarea/input
    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
      return (inputElement as HTMLTextAreaElement | HTMLInputElement).value;
    }
    // Fallback: try to get text content
    return inputElement.textContent || '';
  };
}

/**
 * Creates a function to set query text in an input element.
 * Handles Monaco, CodeMirror, and plain textarea/input elements.
 */
function createSetQuery(inputElement: HTMLElement): (query: string) => void {
  return (query: string) => {
    // Handle Monaco editor
    if (inputElement.tagName === 'TEXTAREA' && inputElement.classList.contains('monaco-mouse-cursor-text')) {
      const textarea = inputElement as HTMLTextAreaElement;
      textarea.value = query;
      // Dispatch events to trigger Grafana's change detection
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      // Focus and blur to ensure Monaco updates
      textarea.focus();
      textarea.blur();
      return;
    }

    // Handle CodeMirror
    const codeMirror = (inputElement as any).CodeMirror;
    if (codeMirror && typeof codeMirror.setValue === 'function') {
      codeMirror.setValue(query);
      // Trigger change event
      codeMirror.trigger('change');
      return;
    }

    // Handle plain textarea/input
    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
      const element = inputElement as HTMLTextAreaElement | HTMLInputElement;
      element.value = query;
      // Dispatch events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      // Also dispatch keyboard events for better compatibility
      element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
      return;
    }

    // Fallback: try to set textContent
    inputElement.textContent = query;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

/**
 * Generates a unique ID for an editor instance.
 */
function generateEditorId(element: HTMLElement, index: number): string {
  // Try to use panel ID if available
  const panelId = element.closest('[data-panelid]')?.getAttribute('data-panelid');
  if (panelId) {
    return `prom-editor-${panelId}`;
  }
  // Try to use data-testid
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return `prom-editor-${testId}`;
  }
  // Fallback to generated ID
  return `prom-editor-${index}-${Date.now()}`;
}

/**
 * Scans the DOM for Prometheus query editor containers.
 * Returns an array of EditorContext objects for each found editor.
 */
export function findEditors(): EditorContext[] {
  const editors: EditorContext[] = [];
  const processedElements = new Set<HTMLElement>();

  // Try each container selector
  for (const selector of PROM_EDITOR_SELECTORS.containerSelectors) {
    const containers = document.querySelectorAll<HTMLElement>(selector);
    for (const container of containers) {
      if (processedElements.has(container)) {
        continue;
      }

      // Check if this container is for Prometheus
      // Look for datasource indicator
      const datasourceElement = container.querySelector(PROM_EDITOR_SELECTORS.datasourceIndicator);
      const isPrometheus = datasourceElement
        ? isPrometheusDatasource(datasourceElement)
        : isPrometheusDatasource(container);

      // Also check data attributes
      let hasPrometheusData = false;
      for (const attr of PROM_EDITOR_SELECTORS.dataAttributes) {
        const value = container.getAttribute(attr);
        if (value && value.toLowerCase().includes('prom')) {
          hasPrometheusData = true;
          break;
        }
      }

      if (isPrometheus || hasPrometheusData) {
        const queryInput = findQueryInput(container);
        if (queryInput) {
          const editorId = generateEditorId(container, editors.length);
          const panelId = container.closest('[data-panelid]')?.getAttribute('data-panelid') || undefined;

          editors.push({
            editorId,
            rootElement: container,
            getQuery: createGetQuery(queryInput),
            setQuery: createSetQuery(queryInput),
            panelId,
          });

          processedElements.add(container);
        }
      }
    }
  }

  return editors;
}
