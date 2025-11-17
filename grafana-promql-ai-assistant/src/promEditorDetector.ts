/**
 * Detects Prometheus query editors in the Grafana DOM.
 * Handles various Grafana versions and editor implementations.
 */

import { config } from './config';
import type { EditorContext } from './types';
import { getPromQuery, setPromQuery } from './queryInjector';

/**
 * Generates a unique ID for an editor instance.
 * Uses data attributes if available, otherwise generates a stable ID based on position.
 */
function generateEditorId(element: HTMLElement, index: number): string {
  // Try to use a data attribute if available
  if (config.promEditorSelectors.editorIdAttribute) {
    const panelId = element.closest(`[${config.promEditorSelectors.editorIdAttribute}]`);
    if (panelId) {
      const id = panelId.getAttribute(config.promEditorSelectors.editorIdAttribute);
      if (id) {
        return `prom-editor-${id}`;
      }
    }
  }

  // Try to find any unique identifier in the element tree
  const dataTestId = element.closest('[data-testid]');
  if (dataTestId) {
    const testId = dataTestId.getAttribute('data-testid');
    if (testId) {
      return `prom-editor-${testId}`;
    }
  }

  // Fallback: use a combination of class names and index
  const classes = Array.from(element.classList).join('-');
  return `prom-editor-${classes || 'default'}-${index}`;
}

/**
 * Checks if an element or its ancestors indicate a Prometheus datasource.
 */
function isPrometheusEditor(container: HTMLElement): boolean {
  // Check for Prometheus indicator in the container or nearby elements
  const containerText = container.textContent?.toLowerCase() || '';
  if (containerText.includes('prometheus')) {
    return true;
  }

  // Check for data attributes
  const hasPrometheusData = container.querySelector('[data-datasource*="prometheus" i]');
  if (hasPrometheusData) {
    return true;
  }

  // Check for class names containing "prometheus"
  const hasPrometheusClass = container.querySelector('[class*="prometheus" i]');
  if (hasPrometheusClass) {
    return true;
  }

  // Check parent elements for datasource indicators
  let current: HTMLElement | null = container;
  for (let i = 0; i < 5 && current; i++) {
    const datasourceAttr = current.getAttribute('data-datasource');
    if (datasourceAttr && datasourceAttr.toLowerCase().includes('prometheus')) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

/**
 * Finds the query input element within an editor container.
 */
function findQueryInput(container: HTMLElement): HTMLElement | null {
  // Try configured selector first
  const configuredInput = container.querySelector(config.promEditorSelectors.queryInput);
  if (configuredInput) {
    return configuredInput as HTMLElement;
  }

  // Fallback: look for common patterns
  const monacoTextarea = container.querySelector('textarea.monaco-mouse-cursor-text');
  if (monacoTextarea) {
    return monacoTextarea as HTMLElement;
  }

  const codeMirror = container.querySelector('.CodeMirror');
  if (codeMirror) {
    return codeMirror as HTMLElement;
  }

  const textarea = container.querySelector('textarea');
  if (textarea) {
    return textarea as HTMLElement;
  }

  const input = container.querySelector('input[type="text"]');
  if (input) {
    return input as HTMLElement;
  }

  return null;
}

/**
 * Scans the DOM for Prometheus query editor containers and returns editor contexts.
 */
export function findEditors(): EditorContext[] {
  const editors: EditorContext[] = [];
  const containers = document.querySelectorAll<HTMLElement>(
    config.promEditorSelectors.editorRowContainer
  );

  containers.forEach((container, index) => {
    // Verify this is actually a Prometheus editor
    if (!isPrometheusEditor(container)) {
      return;
    }

    // Find the query input element
    const queryInput = findQueryInput(container);
    if (!queryInput) {
      // Still create context if we found the container, we'll use the container as root
      console.debug('No query input found in editor container, using container as root');
    }

    const rootElement = queryInput || container;
    const editorId = generateEditorId(container, index);

    // Create editor context with get/set functions
    const context: EditorContext = {
      editorId,
      rootElement: container, // Use container as root for query injection
      getQuery: () => {
        const ctx: EditorContext = {
          editorId,
          rootElement: container,
          getQuery: () => '',
          setQuery: () => {},
        };
        return getPromQuery(ctx);
      },
      setQuery: (query: string) => {
        const ctx: EditorContext = {
          editorId,
          rootElement: container,
          getQuery: () => '',
          setQuery: () => {},
        };
        setPromQuery(ctx, query);
      },
    };

    editors.push(context);
  });

  return editors;
}

/**
 * Checks if a specific element is a Prometheus query editor.
 */
export function isEditorElement(element: HTMLElement): boolean {
  const container = element.closest(config.promEditorSelectors.editorRowContainer);
  if (!container) {
    return false;
  }
  return isPrometheusEditor(container as HTMLElement);
}
