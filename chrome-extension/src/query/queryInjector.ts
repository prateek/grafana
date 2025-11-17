/**
 * Query Injector
 *
 * Handles injecting PromQL queries into different types of editors:
 * - Monaco Editor (modern Grafana)
 * - CodeMirror (older Grafana versions)
 * - Plain textarea (fallback)
 *
 * The challenge is to set the value AND trigger all necessary events
 * so Grafana treats it as a real user input.
 */

import { logger } from '@/config';
import type { EditorType, MonacoEditor, CodeMirrorInstance } from '@/types';

/**
 * Get the current query text from an editor
 */
export function getQueryText(inputElement: HTMLElement, editorType: EditorType): string {
  try {
    switch (editorType) {
      case 'monaco':
        return getMonacoQuery(inputElement);
      case 'codemirror':
        return getCodeMirrorQuery(inputElement);
      case 'textarea':
        return getTextareaQuery(inputElement);
      default:
        logger.warn('Unknown editor type, attempting textarea fallback');
        return getTextareaQuery(inputElement);
    }
  } catch (error) {
    logger.error('Error getting query text:', error);
    return '';
  }
}

/**
 * Set query text in an editor and trigger appropriate events
 */
export function setQueryText(
  inputElement: HTMLElement,
  editorType: EditorType,
  query: string
): void {
  try {
    logger.log(`Setting query in ${editorType} editor:`, query.substring(0, 50) + '...');

    switch (editorType) {
      case 'monaco':
        setMonacoQuery(inputElement, query);
        break;
      case 'codemirror':
        setCodeMirrorQuery(inputElement, query);
        break;
      case 'textarea':
        setTextareaQuery(inputElement, query);
        break;
      default:
        logger.warn('Unknown editor type, attempting textarea fallback');
        setTextareaQuery(inputElement, query);
    }

    logger.log('Query set successfully');
  } catch (error) {
    logger.error('Error setting query text:', error);
  }
}

/**
 * Monaco Editor: Get query
 */
function getMonacoQuery(inputElement: HTMLElement): string {
  const monacoEditor = findMonacoEditor(inputElement);
  if (monacoEditor) {
    return monacoEditor.getValue();
  }

  // Fallback: try to get from underlying textarea
  const textarea = findMonacoTextarea(inputElement);
  if (textarea) {
    return (textarea as HTMLTextAreaElement).value || '';
  }

  return '';
}

/**
 * Monaco Editor: Set query
 */
function setMonacoQuery(inputElement: HTMLElement, query: string): void {
  const monacoEditor = findMonacoEditor(inputElement);

  if (monacoEditor) {
    // Use Monaco's API
    monacoEditor.setValue(query);
    monacoEditor.focus();
    // Trigger any layout/validation
    monacoEditor.trigger('keyboard', 'type', { text: '' });
    logger.log('Set query using Monaco API');
    return;
  }

  // Fallback: set the underlying textarea and dispatch events
  const textarea = findMonacoTextarea(inputElement);
  if (textarea) {
    setTextareaQuery(textarea, query);
    logger.log('Set query using Monaco textarea fallback');
    return;
  }

  logger.warn('Could not set Monaco query: editor instance not found');
}

/**
 * Find the Monaco editor instance for a given input element
 */
function findMonacoEditor(inputElement: HTMLElement): MonacoEditor | null {
  // Monaco editors are tracked globally
  if (typeof window.monaco !== 'undefined' && window.monaco.editor) {
    const editors = window.monaco.editor.getEditors();

    // Find the editor that contains our input element
    for (const editor of editors) {
      const editorDom = (editor as any).getDomNode?.();
      if (editorDom && editorDom.contains(inputElement)) {
        return editor;
      }
    }
  }

  // Alternative: the editor might be stored on the DOM element
  const container = inputElement.closest('.monaco-editor');
  if (container && (container as any)._monacoEditor) {
    return (container as any)._monacoEditor;
  }

  return null;
}

/**
 * Find the underlying textarea in a Monaco editor
 */
function findMonacoTextarea(inputElement: HTMLElement): HTMLElement | null {
  const container = inputElement.closest('.monaco-editor');
  if (container) {
    return container.querySelector<HTMLElement>('textarea');
  }
  return inputElement.tagName === 'TEXTAREA' ? inputElement : null;
}

/**
 * CodeMirror: Get query
 */
function getCodeMirrorQuery(inputElement: HTMLElement): string {
  const cmInstance = findCodeMirrorInstance(inputElement);
  if (cmInstance) {
    return cmInstance.getValue();
  }

  // Fallback: underlying textarea
  const textarea = findCodeMirrorTextarea(inputElement);
  if (textarea) {
    return (textarea as HTMLTextAreaElement).value || '';
  }

  return '';
}

/**
 * CodeMirror: Set query
 */
function setCodeMirrorQuery(inputElement: HTMLElement, query: string): void {
  const cmInstance = findCodeMirrorInstance(inputElement);

  if (cmInstance) {
    cmInstance.setValue(query);
    cmInstance.focus();
    cmInstance.refresh();
    logger.log('Set query using CodeMirror API');
    return;
  }

  // Fallback: set textarea and dispatch events
  const textarea = findCodeMirrorTextarea(inputElement);
  if (textarea) {
    setTextareaQuery(textarea, query);
    logger.log('Set query using CodeMirror textarea fallback');
    return;
  }

  logger.warn('Could not set CodeMirror query: instance not found');
}

/**
 * Find the CodeMirror instance
 */
function findCodeMirrorInstance(inputElement: HTMLElement): CodeMirrorInstance | null {
  // CodeMirror instance is usually stored on the container element
  const container = inputElement.closest('.CodeMirror');
  if (container && (container as any).CodeMirror) {
    return (container as any).CodeMirror;
  }

  // Or on the element itself
  if ((inputElement as any).CodeMirror) {
    return (inputElement as any).CodeMirror;
  }

  return null;
}

/**
 * Find the underlying textarea in CodeMirror
 */
function findCodeMirrorTextarea(inputElement: HTMLElement): HTMLElement | null {
  const container = inputElement.closest('.CodeMirror');
  if (container) {
    return container.querySelector<HTMLElement>('textarea');
  }
  return inputElement.tagName === 'TEXTAREA' ? inputElement : null;
}

/**
 * Plain Textarea: Get query
 */
function getTextareaQuery(inputElement: HTMLElement): string {
  if (inputElement.tagName === 'TEXTAREA') {
    return (inputElement as HTMLTextAreaElement).value || '';
  }

  // Contenteditable fallback
  if (inputElement.isContentEditable) {
    return inputElement.textContent || '';
  }

  return '';
}

/**
 * Plain Textarea: Set query
 */
function setTextareaQuery(inputElement: HTMLElement, query: string): void {
  if (inputElement.tagName === 'TEXTAREA') {
    const textarea = inputElement as HTMLTextAreaElement;
    textarea.value = query;
    textarea.focus();
    dispatchInputEvents(textarea);
    logger.log('Set query in textarea');
    return;
  }

  // Contenteditable fallback
  if (inputElement.isContentEditable) {
    inputElement.textContent = query;
    inputElement.focus();
    dispatchInputEvents(inputElement);
    logger.log('Set query in contenteditable');
    return;
  }

  logger.warn('Element is not a textarea or contenteditable');
}

/**
 * Dispatch all necessary events to make Grafana recognize the change
 */
function dispatchInputEvents(element: HTMLElement): void {
  // Input event (modern browsers)
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      cancelable: true,
    })
  );

  // Change event
  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      cancelable: true,
    })
  );

  // Blur event (sometimes needed to trigger validation)
  element.dispatchEvent(
    new Event('blur', {
      bubbles: true,
      cancelable: true,
    })
  );

  // Focus back
  element.dispatchEvent(
    new Event('focus', {
      bubbles: true,
      cancelable: true,
    })
  );

  // For React-based inputs, we might need to trigger a keyboard event
  try {
    element.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
      })
    );
  } catch (error) {
    // KeyboardEvent might fail in some contexts
    logger.warn('Could not dispatch keyboard event:', error);
  }
}

/**
 * Attempt to trigger Grafana's query execution
 * This is best-effort and might not work in all Grafana versions
 */
export function triggerQueryExecution(container: HTMLElement): void {
  // Look for "Run query" or "Run queries" button
  const runButtons = container.querySelectorAll<HTMLElement>(
    'button[aria-label*="Run"], button[title*="Run"], button:contains("Run")'
  );

  for (const button of runButtons) {
    if (
      button.textContent?.toLowerCase().includes('run') ||
      button.getAttribute('aria-label')?.toLowerCase().includes('run')
    ) {
      logger.log('Found run query button, clicking it');
      button.click();
      return;
    }
  }

  // Alternative: look for refresh buttons
  const refreshButtons = container.querySelectorAll<HTMLElement>(
    'button[aria-label*="Refresh"], button[title*="Refresh"]'
  );

  if (refreshButtons.length > 0) {
    logger.log('Found refresh button, clicking it');
    refreshButtons[0].click();
    return;
  }

  logger.warn('Could not find run/refresh button to trigger query execution');
}
