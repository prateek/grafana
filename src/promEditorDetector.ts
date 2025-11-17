/**
 * Module for detecting Prometheus query editors in the Grafana DOM.
 * This module handles the defensive detection of editor instances and provides
 * a consistent API for getting/setting query text across different editor types.
 */

import { config, logger } from './config';
import type { EditorContext, EditorType } from './types';

/**
 * Detects the type of editor (Monaco, CodeMirror, or plain textarea)
 */
function detectEditorType(element: HTMLElement): EditorType {
  // Check for Monaco editor
  if (element.closest('.monaco-editor') || element.classList.contains('monaco-editor')) {
    return 'monaco';
  }

  // Check for CodeMirror
  if (element.closest('.CodeMirror') || element.classList.contains('CodeMirror')) {
    return 'codemirror';
  }

  // Check if it's a plain textarea
  if (element.tagName === 'TEXTAREA') {
    return 'textarea';
  }

  return 'unknown';
}

/**
 * Finds the actual input element within a query editor container
 */
function findQueryInputElement(container: HTMLElement): HTMLElement | null {
  for (const selector of config.PROM_EDITOR_SELECTORS.queryInputSelectors) {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) {
      logger.debug('Found query input element using selector:', selector);
      return element;
    }
  }

  // Fallback: look for any textarea or contenteditable
  const textarea = container.querySelector('textarea') as HTMLElement;
  if (textarea) {
    logger.debug('Found query input via fallback textarea search');
    return textarea;
  }

  const contentEditable = container.querySelector('[contenteditable="true"]') as HTMLElement;
  if (contentEditable) {
    logger.debug('Found query input via fallback contenteditable search');
    return contentEditable;
  }

  return null;
}

/**
 * Creates a getter function for query text based on editor type
 */
function createQueryGetter(element: HTMLElement, editorType: EditorType): () => string {
  return () => {
    try {
      if (editorType === 'monaco') {
        // Monaco editor: try to get the underlying textarea value
        const textarea = element.closest('.monaco-editor')?.querySelector('textarea');
        if (textarea instanceof HTMLTextAreaElement) {
          return textarea.value;
        }
        // Fallback: try to get model value via Monaco API if available
        const monacoEditor = (element as any).monacoEditor;
        if (monacoEditor?.getValue) {
          return monacoEditor.getValue();
        }
      }

      if (editorType === 'codemirror') {
        // CodeMirror: try to access the CodeMirror instance
        const cmContainer = element.closest('.CodeMirror') as any;
        if (cmContainer?.CodeMirror?.getValue) {
          return cmContainer.CodeMirror.getValue();
        }
        // Fallback: get textarea value
        const textarea = cmContainer?.querySelector('textarea');
        if (textarea instanceof HTMLTextAreaElement) {
          return textarea.value;
        }
      }

      // Plain textarea or contenteditable
      if (element instanceof HTMLTextAreaElement) {
        return element.value;
      }

      if (element.contentEditable === 'true') {
        return element.textContent || '';
      }

      return '';
    } catch (error) {
      logger.error('Error getting query text:', error);
      return '';
    }
  };
}

/**
 * Creates a setter function for query text based on editor type
 * This function also triggers the necessary events to make Grafana recognize the change
 */
function createQuerySetter(element: HTMLElement, editorType: EditorType): (query: string) => void {
  return (query: string) => {
    try {
      if (editorType === 'monaco') {
        // Monaco editor: set via API if available
        const monacoEditor = (element as any).monacoEditor;
        if (monacoEditor?.setValue) {
          monacoEditor.setValue(query);
          logger.debug('Set query via Monaco API');
          return;
        }

        // Fallback: set textarea and dispatch events
        const textarea = element.closest('.monaco-editor')?.querySelector('textarea');
        if (textarea instanceof HTMLTextAreaElement) {
          setTextareaValue(textarea, query);
          logger.debug('Set query via Monaco textarea fallback');
          return;
        }
      }

      if (editorType === 'codemirror') {
        // CodeMirror: set via API if available
        const cmContainer = element.closest('.CodeMirror') as any;
        if (cmContainer?.CodeMirror?.setValue) {
          cmContainer.CodeMirror.setValue(query);
          logger.debug('Set query via CodeMirror API');
          return;
        }

        // Fallback: set textarea
        const textarea = cmContainer?.querySelector('textarea');
        if (textarea instanceof HTMLTextAreaElement) {
          setTextareaValue(textarea, query);
          logger.debug('Set query via CodeMirror textarea fallback');
          return;
        }
      }

      // Plain textarea
      if (element instanceof HTMLTextAreaElement) {
        setTextareaValue(element, query);
        logger.debug('Set query via plain textarea');
        return;
      }

      // Contenteditable
      if (element.contentEditable === 'true') {
        element.textContent = query;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        logger.debug('Set query via contenteditable');
        return;
      }

      logger.warn('Could not set query - unsupported editor type');
    } catch (error) {
      logger.error('Error setting query text:', error);
    }
  };
}

/**
 * Helper to set textarea value and dispatch all necessary events
 */
function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  // Focus the element first
  textarea.focus();

  // Set the value
  textarea.value = value;

  // Dispatch comprehensive set of events to ensure Grafana picks up the change
  const events = [
    new Event('input', { bubbles: true, cancelable: true }),
    new Event('change', { bubbles: true, cancelable: true }),
    new Event('blur', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
  ];

  events.forEach((event) => textarea.dispatchEvent(event));

  // Trigger React/Angular change detection if needed
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Checks if a container is a Prometheus query editor by looking for indicators
 */
function isPrometheusEditor(container: HTMLElement): boolean {
  // Check for Prometheus-specific indicators
  for (const selector of config.PROM_EDITOR_SELECTORS.prometheusIndicators) {
    // Handle pseudo-selectors like :has-text() by doing manual checking
    if (selector.includes(':has-text(')) {
      const match = selector.match(/^([^:]+):has-text\("([^"]+)"\)$/);
      if (match) {
        const [, baseSelector, text] = match;
        const elements = container.querySelectorAll(baseSelector);
        for (const el of Array.from(elements)) {
          if (el.textContent?.includes(text)) {
            return true;
          }
        }
      }
    } else {
      // Normal CSS selector - check both inside container and on container itself
      if (container.querySelector(selector) || container.matches(selector)) {
        return true;
      }
    }
  }

  // Check text content for "Prometheus" or "prometheus"
  const text = container.textContent || '';
  if (text.toLowerCase().includes('prometheus')) {
    // Additional validation: make sure it's actually in a data source selector context
    const hasDataSourceIndicators =
      container.querySelector('[data-testid*="datasource"]') ||
      container.querySelector('[aria-label*="data source"]') ||
      container.querySelector('label') ||
      container.querySelector('select');

    if (hasDataSourceIndicators) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a unique ID for an editor based on available data attributes or position
 */
function generateEditorId(container: HTMLElement, index: number): string {
  // Try to use data attributes first
  for (const attr of config.PROM_EDITOR_SELECTORS.dataAttributes) {
    const value = container.getAttribute(attr);
    if (value) {
      return `editor-${attr}-${value}`;
    }
  }

  // Check parent for panel ID
  const panel = container.closest('[data-panelid]');
  if (panel) {
    const panelId = panel.getAttribute('data-panelid');
    return `editor-panel-${panelId}`;
  }

  // Fallback: use index and a random component
  return `editor-${index}-${Date.now()}`;
}

/**
 * Finds all Prometheus query editor instances on the current page
 * Returns an array of EditorContext objects
 */
export function findEditors(): EditorContext[] {
  const editors: EditorContext[] = [];

  // Scan for root containers
  const containers: HTMLElement[] = [];
  for (const selector of config.PROM_EDITOR_SELECTORS.rootContainerSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (!containers.includes(el as HTMLElement)) {
        containers.push(el as HTMLElement);
      }
    });
  }

  logger.debug(`Found ${containers.length} potential query editor containers`);

  // Filter to only Prometheus editors and create contexts
  let editorIndex = 0;
  for (const container of containers) {
    if (!isPrometheusEditor(container)) {
      continue;
    }

    const queryInputElement = findQueryInputElement(container);
    if (!queryInputElement) {
      logger.debug('Container is Prometheus but no query input found, skipping', container);
      continue;
    }

    const editorType = detectEditorType(queryInputElement);
    const id = generateEditorId(container, editorIndex++);

    const context: EditorContext = {
      id,
      rootElement: container,
      queryInputElement,
      getQuery: createQueryGetter(queryInputElement, editorType),
      setQuery: createQuerySetter(queryInputElement, editorType),
    };

    editors.push(context);
    logger.debug(`Detected Prometheus editor: ${id}, type: ${editorType}`);
  }

  return editors;
}

/**
 * Finds the toolbar element where we should inject the AI button
 */
export function findToolbarForEditor(editor: EditorContext): HTMLElement | null {
  // Try configured toolbar selectors
  for (const selector of config.PROM_EDITOR_SELECTORS.toolbarSelectors) {
    const toolbar = editor.rootElement.querySelector(selector) as HTMLElement;
    if (toolbar) {
      return toolbar;
    }
  }

  // Fallback: look for common button containers
  const buttonContainer = editor.rootElement.querySelector('.btn-group, .button-group');
  if (buttonContainer) {
    return buttonContainer as HTMLElement;
  }

  // Last resort: use the root element itself
  logger.warn('No toolbar found, using root element');
  return editor.rootElement;
}
