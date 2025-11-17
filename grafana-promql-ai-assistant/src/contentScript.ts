/**
 * Main content script that detects Prometheus editors and injects AI Assistant buttons.
 * Handles SPA navigation via MutationObserver and manages editor lifecycle.
 */

import { config, getAllowedOrigin } from './config';
import { findEditors } from './promEditorDetector';
import { editorRegistry } from './editorRegistry';
import { setPromQuery } from './queryInjector';
import type { PromQLSuggestionMessage } from './types';
import { isPromQLSuggestionMessage } from './types';

// Inject bridge script into the page context
function injectPageContextBridge(): void {
  // Check if already injected
  if ((window as any).__promAIBridgeInjected) {
    return;
  }

  // Inject the bridge script
  const script = document.createElement('script');
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    script.src = chrome.runtime.getURL('pageContextBridge.js');
    script.onload = () => {
      (window as any).__promAIBridgeInjected = true;
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }
}

/**
 * Creates and injects an AI Assistant button into an editor container.
 */
function injectButton(editorContext: EditorContext): void {
  // Skip if button already exists
  if (editorContext.buttonElement && document.body.contains(editorContext.buttonElement)) {
    return;
  }

  const { rootElement, editorId } = editorContext;

  // Find a good place to inject the button (toolbar area, action buttons container)
  // Look for common Grafana button containers
  const toolbarSelectors = [
    '.query-row-action',
    '.query-editor-row__actions',
    '[class*="query-row"] [class*="action"]',
    '.gf-form-query',
  ];

  let buttonContainer: HTMLElement | null = null;
  for (const selector of toolbarSelectors) {
    buttonContainer = rootElement.querySelector(selector);
    if (buttonContainer) {
      break;
    }
  }

  // Fallback: look for any button container or create one
  if (!buttonContainer) {
    // Try to find where other buttons are
    const existingButtons = rootElement.querySelectorAll('button, .btn');
    if (existingButtons.length > 0) {
      buttonContainer = existingButtons[0].parentElement as HTMLElement;
    } else {
      // Create a container if none exists
      buttonContainer = document.createElement('div');
      buttonContainer.className = 'prom-ai-button-container';
      buttonContainer.style.display = 'inline-flex';
      buttonContainer.style.alignItems = 'center';
      rootElement.appendChild(buttonContainer);
    }
  }

  // Create button
  const button = document.createElement('button');
  button.className = config.button.className;
  button.textContent = config.button.label;
  button.type = 'button';
  button.setAttribute('data-editor-id', editorId);

  // Add click handler
  button.addEventListener('click', () => {
    const currentQuery = editorContext.getQuery();
    openOverlay(editorId, currentQuery);
  });

  // Store reference
  editorContext.buttonElement = button;

  // Inject button
  if (buttonContainer) {
    buttonContainer.appendChild(button);
  }
}

/**
 * Opens the overlay and sends context to it.
 */
function openOverlay(editorId: string, currentQuery: string): void {
  // Dispatch custom event that the injected overlay script can listen to
  window.dispatchEvent(
    new CustomEvent('prom-ai-open-overlay', {
      detail: { editorId, currentQuery },
    })
  );
}

/**
 * Handles messages from the overlay iframe (forwarded via page context bridge).
 */
function handleSuggestionMessage(message: PromQLSuggestionMessage): void {
  const { editorId, query } = message;
  const editorContext = editorRegistry.get(editorId);

  if (!editorContext) {
    console.warn(`Editor ${editorId} not found in registry`);
    return;
  }

  // Set the query
  editorContext.setQuery(query);

  // Optionally close overlay
  if (config.overlay.autoCloseOnInsert) {
    window.dispatchEvent(new CustomEvent('prom-ai-close-overlay'));
  }
}

/**
 * Listens for messages from the page context bridge.
 */
function setupMessageListener(): void {
  window.addEventListener('prom-ai-iframe-message', ((event: CustomEvent) => {
    const message = event.detail;

    if (isPromQLSuggestionMessage(message)) {
      handleSuggestionMessage(message);
    }
  }) as EventListener);
}

/**
 * Scans for editors and injects buttons for any new ones.
 */
function scanAndInject(): void {
  // Clean up removed editors
  editorRegistry.cleanup();

  // Find all editors
  const editors = findEditors();

  // Register and inject buttons for new editors
  for (const editor of editors) {
    if (!editorRegistry.has(editor.editorId)) {
      editorRegistry.register(editor);
      injectButton(editor);
    }
  }
}

/**
 * Initializes the content script.
 */
function init(): void {
  // Inject bridge script into page context
  injectPageContextBridge();

  // Set up message listener
  setupMessageListener();

  // Initial scan
  scanAndInject();

  // Set up MutationObserver for SPA navigation
  const observer = new MutationObserver(() => {
    scanAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also scan periodically as a fallback (in case MutationObserver misses something)
  setInterval(() => {
    scanAndInject();
  }, 2000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
