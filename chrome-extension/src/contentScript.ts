/**
 * Content Script
 *
 * Main entry point for the extension's content script.
 * Runs on Grafana pages and orchestrates editor detection,
 * button injection, and overlay management.
 */

import { debugLog } from './config';
import { findPromEditors } from './promEditorDetector';
import {
  registerEditor,
  hasEditor,
  getAllEditors,
  cleanupStaleEditors,
} from './editorRegistry';
import { injectAssistantButton, hasAssistantButton } from './buttonInjector';
import { openOverlay } from './overlayManager';
import { initializeMessageHandler } from './messageHandler';

/**
 * MutationObserver instance for watching DOM changes
 */
let observer: MutationObserver | null = null;

/**
 * Debounce timer for scan operations
 */
let scanTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the extension
 */
function initialize(): void {
  debugLog('Initializing Grafana PromQL AI Assistant');

  // Initialize message handler for iframe communication
  initializeMessageHandler();

  // Perform initial scan
  scanForEditors();

  // Set up MutationObserver to handle SPA navigation
  setupMutationObserver();

  // Periodic cleanup of stale editors
  setInterval(() => {
    cleanupStaleEditors();
  }, 5000);

  debugLog('Initialization complete');
}

/**
 * Scan the page for Prometheus query editors
 */
function scanForEditors(): void {
  debugLog('Scanning for Prometheus editors...');

  // Find all editors in the current DOM
  const editors = findPromEditors();

  debugLog(`Found ${editors.length} editor(s)`);

  // Process each editor
  editors.forEach((editor) => {
    // Check if already registered
    if (hasEditor(editor.id)) {
      const existingEditor = getAllEditors().find((e) => e.id === editor.id);
      // Ensure button is injected
      if (existingEditor && !hasAssistantButton(existingEditor)) {
        injectAssistantButton(existingEditor, handleButtonClick);
      }
      return;
    }

    // Register the editor
    registerEditor(editor);

    // Inject the AI Assistant button
    injectAssistantButton(editor, handleButtonClick);
  });

  // Clean up editors that are no longer in the DOM
  cleanupStaleEditors();
}

/**
 * Set up MutationObserver to detect DOM changes (SPA navigation)
 */
function setupMutationObserver(): void {
  // Clean up existing observer if any
  if (observer) {
    observer.disconnect();
  }

  // Create new observer
  observer = new MutationObserver((mutations) => {
    // Check if any mutations involve elements that might be query editors
    const shouldScan = mutations.some((mutation) => {
      // Check added nodes
      if (mutation.addedNodes.length > 0) {
        return true;
      }

      // Check removed nodes
      if (mutation.removedNodes.length > 0) {
        return true;
      }

      // Check attribute changes on relevant elements
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const target = mutation.target;
        // Check if this might be a query editor container
        if (
          target.classList.contains('query-editor-row') ||
          target.hasAttribute('data-testid') ||
          target.hasAttribute('data-panelid')
        ) {
          return true;
        }
      }

      return false;
    });

    if (shouldScan) {
      debouncedScan();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-testid', 'data-panelid', 'class'],
  });

  debugLog('MutationObserver initialized');
}

/**
 * Debounced scan to avoid excessive scanning
 */
function debouncedScan(): void {
  if (scanTimer) {
    clearTimeout(scanTimer);
  }

  scanTimer = setTimeout(() => {
    scanForEditors();
  }, 300);
}

/**
 * Handle AI Assistant button click
 * @param editorId The ID of the editor whose button was clicked
 */
function handleButtonClick(editorId: string): void {
  debugLog('AI Assistant button clicked for editor:', editorId);

  // Get the editor from registry
  const editors = getAllEditors();
  const editor = editors.find((e) => e.id === editorId);

  if (!editor) {
    debugLog('Editor not found:', editorId);
    return;
  }

  // Open the overlay
  openOverlay(editor);
}

/**
 * Clean up when extension is unloaded (for testing)
 */
export function cleanup(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }

  debugLog('Cleanup complete');
}

// Initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Export for testing
export { scanForEditors, handleButtonClick };
