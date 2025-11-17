/**
 * Content script - main entry point for the extension.
 * Detects Prometheus query editors and injects AI Assistant buttons.
 */

import { findEditors } from './promEditorDetector';
import { injectButton, removeButton } from './buttonInjector';
import { openOverlay, handleSuggestion } from './ui/overlay';
import type { EditorContext } from './types';

// Import styles
import './styles/content.css';

// Registry of detected editors
const editorRegistry = new Map<string, EditorContext>();

// MutationObserver for detecting DOM changes (SPA navigation)
let observer: MutationObserver | null = null;

/**
 * Processes a detected editor: injects button if not already present.
 */
function processEditor(editorContext: EditorContext): void {
  const { editorId } = editorContext;

  // Skip if already processed
  if (editorRegistry.has(editorId)) {
    return;
  }

  // Inject button
  const button = injectButton(editorContext, (context) => {
    openOverlay(context, handleSuggestion);
  });

  if (button) {
    editorRegistry.set(editorId, editorContext);
    console.log(`[PromQL Assistant] Injected button for editor: ${editorId}`);
  }
}

/**
 * Scans the DOM for Prometheus editors and processes them.
 */
function scanAndProcessEditors(): void {
  const editors = findEditors();

  for (const editor of editors) {
    processEditor(editor);
  }

  // Clean up editors that are no longer in the DOM
  for (const [editorId, editorContext] of editorRegistry.entries()) {
    if (!document.body.contains(editorContext.rootElement)) {
      removeButton(editorContext);
      editorRegistry.delete(editorId);
      console.log(`[PromQL Assistant] Removed editor from registry: ${editorId}`);
    }
  }
}

/**
 * Initializes the MutationObserver to watch for DOM changes.
 */
function initializeObserver(): void {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let shouldRescan = false;

    for (const mutation of mutations) {
      // Check if nodes were added
      if (mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Check if this might be a query editor or container
            if (
              element.querySelector?.('.query-editor-row') ||
              element.classList?.contains('query-editor-row') ||
              element.querySelector?.('[data-testid*="prom"]')
            ) {
              shouldRescan = true;
              break;
            }
          }
        }
      }

      // Check if nodes were removed
      if (mutation.removedNodes.length > 0) {
        shouldRescan = true;
      }

      if (shouldRescan) {
        break;
      }
    }

    if (shouldRescan) {
      // Debounce rescanning
      setTimeout(() => {
        scanAndProcessEditors();
      }, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Initializes the content script.
 */
function initialize(): void {
  console.log('[PromQL Assistant] Content script initialized');

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanAndProcessEditors();
      initializeObserver();
    });
  } else {
    scanAndProcessEditors();
    initializeObserver();
  }

  // Also rescan periodically as a fallback (e.g., for very dynamic SPAs)
  setInterval(() => {
    scanAndProcessEditors();
  }, 2000);
}

// Start initialization
initialize();
