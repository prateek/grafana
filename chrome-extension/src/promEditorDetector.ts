/**
 * Prometheus Editor Detector
 *
 * Detects Prometheus query editors in the Grafana UI and provides
 * methods to interact with them (get/set query text).
 *
 * Handles different editor types:
 * - Monaco Editor (most common in recent Grafana)
 * - CodeMirror
 * - Plain textarea
 */

import { config, debugLog, debugError } from './config';
import type { EditorContext } from './types';

/**
 * Find all Prometheus query editors currently in the DOM
 * @returns Array of EditorContext objects for each detected editor
 */
export function findPromEditors(): EditorContext[] {
  const editors: EditorContext[] = [];
  const { containerSelectors } = config.PROM_EDITOR_SELECTORS;
  const processedElements = new Set<HTMLElement>();

  // Try each container selector
  for (const selector of containerSelectors) {
    try {
      const containers = document.querySelectorAll(selector);

      containers.forEach((container) => {
        if (!(container instanceof HTMLElement)) return;

        // Skip if already processed (avoid duplicates)
        if (processedElements.has(container)) {
          return;
        }

        // Verify this is actually a Prometheus editor
        if (!isPrometheusEditor(container)) {
          return;
        }

        // Mark as processed
        processedElements.add(container);

        // Try to create an EditorContext for this container
        const editorContext = createEditorContext(container);
        if (editorContext) {
          editors.push(editorContext);
          debugLog('Detected Prometheus editor:', editorContext.id);
        }
      });
    } catch (error) {
      debugError('Error finding editors with selector', selector, error);
    }
  }

  return editors;
}

/**
 * Check if a container element is a Prometheus query editor
 * @param container The container element to check
 * @returns True if this appears to be a Prometheus editor
 */
function isPrometheusEditor(container: HTMLElement): boolean {
  // Check for data attributes on the container itself first
  if (
    container.dataset.dsType === 'prometheus' ||
    container.getAttribute('data-ds-type') === 'prometheus'
  ) {
    return true;
  }

  // Check if container itself matches any indicators
  const { prometheusIndicators } = config.PROM_EDITOR_SELECTORS;
  for (const indicator of prometheusIndicators) {
    try {
      // Check if the container itself matches the selector
      if (indicator.startsWith('[') && indicator.endsWith(']')) {
        // Handle attribute selectors - check container and children
        if (container.matches(indicator)) {
          return true;
        }
        if (container.querySelector(indicator)) {
          return true;
        }
      } else {
        // Handle regular selectors
        if (container.querySelector(indicator)) {
          return true;
        }
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }

  // Additional heuristic: check text content for "Prometheus"
  const textContent = container.textContent || '';
  if (textContent.toLowerCase().includes('prometheus')) {
    return true;
  }

  return false;
}

/**
 * Create an EditorContext from a container element
 * @param container The container element
 * @returns EditorContext if successful, null otherwise
 */
function createEditorContext(container: HTMLElement): EditorContext | null {
  const queryInputElement = findQueryInputElement(container);
  if (!queryInputElement) {
    debugLog('Could not find query input in container', container);
    return null;
  }

  const editorType = detectEditorType(queryInputElement);
  const id = generateEditorId(container);

  return {
    id,
    rootElement: container,
    queryInputElement,
    editorType,
    getQuery: () => getQueryText(queryInputElement, editorType),
    setQuery: (query: string) => setQueryText(queryInputElement, editorType, query),
  };
}

/**
 * Find the query input element within a container
 * @param container The container to search in
 * @returns The input element, or null if not found
 */
function findQueryInputElement(container: HTMLElement): HTMLElement | null {
  const { queryInputSelectors } = config.PROM_EDITOR_SELECTORS;

  for (const selector of queryInputSelectors) {
    const element = container.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }
  }

  return null;
}

/**
 * Detect the type of editor from the input element
 * @param element The input element
 * @returns Editor type
 */
function detectEditorType(element: HTMLElement): 'monaco' | 'codemirror' | 'textarea' {
  // Check for Monaco
  if (
    element.classList.contains('monaco-editor') ||
    element.closest('.monaco-editor') ||
    element.classList.contains('monaco-mouse-cursor-text')
  ) {
    return 'monaco';
  }

  // Check for CodeMirror
  if (
    element.classList.contains('CodeMirror') ||
    element.closest('.CodeMirror') ||
    (element as any).CodeMirror
  ) {
    return 'codemirror';
  }

  // Default to textarea
  return 'textarea';
}

/**
 * Generate a unique ID for an editor
 * @param container The container element
 * @returns Unique ID string
 */
function generateEditorId(container: HTMLElement): string {
  // Try to use panel ID if available
  const panelId = container.closest('[data-panelid]')?.getAttribute('data-panelid');
  if (panelId) {
    return `prom-editor-${panelId}`;
  }

  // Try to use testid
  const testId = container.getAttribute('data-testid');
  if (testId) {
    return `prom-editor-${testId}`;
  }

  // Fall back to generating from position in DOM
  const allContainers = Array.from(document.querySelectorAll(config.PROM_EDITOR_SELECTORS.containerSelectors[0] || 'div'));
  const index = allContainers.indexOf(container);
  return `prom-editor-${index >= 0 ? index : Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get query text from an editor element
 * @param element The input element
 * @param editorType The type of editor
 * @returns Current query text
 */
function getQueryText(
  element: HTMLElement,
  editorType: 'monaco' | 'codemirror' | 'textarea'
): string {
  try {
    switch (editorType) {
      case 'monaco':
        return getMonacoQueryText(element);
      case 'codemirror':
        return getCodeMirrorQueryText(element);
      case 'textarea':
        return getTextareaQueryText(element);
    }
  } catch (error) {
    debugError('Error getting query text:', error);
    return '';
  }
}

/**
 * Set query text in an editor element
 * @param element The input element
 * @param editorType The type of editor
 * @param query The query text to set
 */
export function setQueryText(
  element: HTMLElement,
  editorType: 'monaco' | 'codemirror' | 'textarea',
  query: string
): void {
  try {
    switch (editorType) {
      case 'monaco':
        setMonacoQueryText(element, query);
        break;
      case 'codemirror':
        setCodeMirrorQueryText(element, query);
        break;
      case 'textarea':
        setTextareaQueryText(element, query);
        break;
    }
  } catch (error) {
    debugError('Error setting query text:', error);
  }
}

// ============================================================================
// Monaco Editor Helpers
// ============================================================================

function getMonacoQueryText(element: HTMLElement): string {
  // Monaco typically has a hidden textarea with the content
  const textarea = element.querySelector('textarea');
  if (textarea instanceof HTMLTextAreaElement) {
    return textarea.value;
  }

  // Alternative: try to get from contenteditable
  const editable = element.querySelector('[contenteditable="true"]');
  if (editable) {
    return editable.textContent || '';
  }

  return '';
}

function setMonacoQueryText(element: HTMLElement, query: string): void {
  // Find the Monaco editor container
  const monacoContainer = element.classList.contains('monaco-editor')
    ? element
    : element.closest('.monaco-editor');

  if (!monacoContainer) {
    debugError('Could not find Monaco container');
    return;
  }

  // Try to access Monaco API if available
  const monaco = (window as any).monaco;
  if (monaco) {
    // Monaco API is available - try to get the editor instance
    const editors = monaco.editor.getEditors?.() || [];
    for (const editor of editors) {
      const domNode = editor.getDomNode();
      if (domNode && monacoContainer.contains(domNode)) {
        editor.setValue(query);
        editor.trigger('ai-assistant', 'editor.action.formatDocument');
        return;
      }
    }
  }

  // Fallback: set via textarea and dispatch events
  const textarea = monacoContainer.querySelector('textarea');
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.value = query;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    textarea.blur();
  }
}

// ============================================================================
// CodeMirror Helpers
// ============================================================================

function getCodeMirrorQueryText(element: HTMLElement): string {
  const cmElement = element.classList.contains('CodeMirror')
    ? element
    : element.closest('.CodeMirror');

  if (cmElement && (cmElement as any).CodeMirror) {
    return (cmElement as any).CodeMirror.getValue();
  }

  // Fallback to textarea
  const textarea = element.querySelector('textarea');
  if (textarea instanceof HTMLTextAreaElement) {
    return textarea.value;
  }

  return '';
}

function setCodeMirrorQueryText(element: HTMLElement, query: string): void {
  const cmElement = element.classList.contains('CodeMirror')
    ? element
    : element.closest('.CodeMirror');

  if (cmElement && (cmElement as any).CodeMirror) {
    const cm = (cmElement as any).CodeMirror;
    cm.setValue(query);
    cm.focus();
    return;
  }

  // Fallback to textarea
  const textarea = element.querySelector('textarea');
  if (textarea instanceof HTMLTextAreaElement) {
    setTextareaQueryText(textarea, query);
  }
}

// ============================================================================
// Textarea Helpers
// ============================================================================

function getTextareaQueryText(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  }

  const textarea = element.querySelector('textarea, input');
  if (textarea instanceof HTMLTextAreaElement || textarea instanceof HTMLInputElement) {
    return textarea.value;
  }

  return '';
}

function setTextareaQueryText(element: HTMLElement, query: string): void {
  let input: HTMLTextAreaElement | HTMLInputElement | null = null;

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    input = element;
  } else {
    const found = element.querySelector('textarea, input');
    if (found instanceof HTMLTextAreaElement || found instanceof HTMLInputElement) {
      input = found;
    }
  }

  if (!input) {
    debugError('Could not find textarea/input element');
    return;
  }

  // Set value and dispatch events
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();

  // Trigger keyboard event to ensure Grafana picks up the change
  input.dispatchEvent(
    new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
    })
  );

  input.blur();
}
