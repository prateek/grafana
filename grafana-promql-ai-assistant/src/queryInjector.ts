/**
 * Handles injection of PromQL queries into various editor types (Monaco, CodeMirror, plain textarea).
 */

import type { EditorContext } from './types';

/**
 * Attempts to set the query text in a Monaco editor.
 * Monaco editors typically have a hidden textarea or use a contenteditable div.
 */
function setMonacoQuery(element: HTMLElement, query: string): boolean {
  // Try to find Monaco's hidden textarea
  const textarea = element.querySelector('textarea.monaco-mouse-cursor-text') as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = query;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Try to find Monaco editor instance via global Monaco API
  // @ts-ignore - Monaco may be available globally
  if (window.monaco && element.dataset.monacoEditorId) {
    try {
      // @ts-ignore
      const editor = window.monaco.editor.getEditors().find((e: any) => 
        e.getContainerDomNode() === element || element.contains(e.getContainerDomNode())
      );
      if (editor) {
        editor.setValue(query);
        editor.trigger('source', 'editor.action.formatDocument', {});
        return true;
      }
    } catch (e) {
      console.warn('Failed to set Monaco query via API:', e);
    }
  }

  // Fallback: try contenteditable divs
  const contentEditable = element.querySelector('[contenteditable="true"]') as HTMLElement;
  if (contentEditable) {
    contentEditable.textContent = query;
    contentEditable.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Attempts to set the query text in a CodeMirror editor.
 */
function setCodeMirrorQuery(element: HTMLElement, query: string): boolean {
  // Try to find CodeMirror instance
  const cmElement = element.closest('.CodeMirror') as HTMLElement;
  if (cmElement) {
    // @ts-ignore - CodeMirror may be available
    if (cmElement.CodeMirror) {
      try {
        // @ts-ignore
        cmElement.CodeMirror.setValue(query);
        // @ts-ignore
        cmElement.CodeMirror.save();
        return true;
      } catch (e) {
        console.warn('Failed to set CodeMirror query via instance:', e);
      }
    }

    // Fallback: find underlying textarea
    const textarea = cmElement.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = query;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  return false;
}

/**
 * Sets the query text in a plain textarea or input element.
 */
function setPlainTextQuery(element: HTMLElement, query: string): boolean {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.value = query;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    // Also trigger focus/blur to ensure Grafana recognizes the change
    element.focus();
    element.blur();
    return true;
  }

  const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = query;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    textarea.blur();
    return true;
  }

  return false;
}

/**
 * Sets the PromQL query text in the editor associated with the given context.
 * Attempts multiple strategies to work with different editor types.
 */
export function setPromQuery(editorContext: EditorContext, query: string): void {
  const { rootElement } = editorContext;

  // Strategy 1: Try Monaco editor
  if (setMonacoQuery(rootElement, query)) {
    return;
  }

  // Strategy 2: Try CodeMirror editor
  if (setCodeMirrorQuery(rootElement, query)) {
    return;
  }

  // Strategy 3: Try plain textarea/input
  if (setPlainTextQuery(rootElement, query)) {
    return;
  }

  // Strategy 4: Try to find any textarea or input in the editor container
  const allInputs = rootElement.querySelectorAll('textarea, input[type="text"]');
  for (const input of Array.from(allInputs)) {
    if (setPlainTextQuery(input as HTMLElement, query)) {
      return;
    }
  }

  console.warn('Could not inject query into editor. Editor structure may have changed.');
}

/**
 * Gets the current query text from the editor.
 */
export function getPromQuery(editorContext: EditorContext): string {
  const { rootElement } = editorContext;

  // Try Monaco
  const monacoTextarea = rootElement.querySelector('textarea.monaco-mouse-cursor-text') as HTMLTextAreaElement;
  if (monacoTextarea) {
    return monacoTextarea.value;
  }

  // Try CodeMirror
  const cmElement = rootElement.closest('.CodeMirror') as HTMLElement;
  if (cmElement) {
    // @ts-ignore
    if (cmElement.CodeMirror) {
      try {
        // @ts-ignore
        return cmElement.CodeMirror.getValue();
      } catch (e) {
        // Fall through
      }
    }
    const cmTextarea = cmElement.querySelector('textarea') as HTMLTextAreaElement;
    if (cmTextarea) {
      return cmTextarea.value;
    }
  }

  // Try plain textarea/input
  const textarea = rootElement.querySelector('textarea') as HTMLTextAreaElement;
  if (textarea) {
    return textarea.value;
  }

  const input = rootElement.querySelector('input[type="text"]') as HTMLInputElement;
  if (input) {
    return input.value;
  }

  return '';
}
