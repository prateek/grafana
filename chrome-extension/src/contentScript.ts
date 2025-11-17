/**
 * Content Script
 *
 * Main entry point for the extension's content script.
 * Runs on Grafana pages and orchestrates:
 * - Editor detection
 * - Button injection
 * - Overlay management
 * - Message handling
 */

import { CONFIG, logger } from './config';
import { findEditors, generateEditorId } from './detection/promEditorDetector';
import { getQueryText, setQueryText, triggerQueryExecution } from './query/queryInjector';
import {
  registerEditor,
  getEditor,
  getAllEditors,
  cleanupStaleEditors,
  getRegistryStats,
} from './registry/editorRegistry';
import { injectButton } from './injection/buttonInjector';
import { openOverlay, toggleOverlay } from './overlay/overlayManager';
import { initMessageHandler } from './messaging/messageHandler';
import type { EditorContext, EditorType } from './types';

/**
 * Debounce timer for MutationObserver
 */
let debounceTimer: number | null = null;

/**
 * MutationObserver instance
 */
let observer: MutationObserver | null = null;

/**
 * Initialize the extension
 */
function init(): void {
  logger.log('Initializing Grafana Prometheus AI Assistant extension');

  // Initialize message handler
  initMessageHandler();

  // Perform initial scan
  scanAndInject();

  // Set up MutationObserver to detect dynamically added editors
  setupMutationObserver();

  logger.log('Extension initialized successfully');
  logger.log('Registry stats:', getRegistryStats());
}

/**
 * Scan for editors and inject buttons
 */
function scanAndInject(): void {
  logger.log('Scanning for Prometheus query editors...');

  // Clean up any stale editors first
  cleanupStaleEditors();

  // Find all Prometheus editors
  const detectionResults = findEditors();

  for (const result of detectionResults) {
    if (!result.container || !result.queryInput) {
      continue;
    }

    // Generate unique ID
    const editorId = generateEditorId(result.container);

    // Check if already registered
    if (getEditor(editorId)) {
      logger.log(`Editor ${editorId} already registered, skipping`);
      continue;
    }

    // Create editor context
    const editorContext = createEditorContext(
      editorId,
      result.container,
      result.queryInput,
      result.editorType
    );

    // Register editor
    registerEditor(editorContext);

    // Inject button
    const button = injectButton(editorContext, handleButtonClick);
    if (button) {
      editorContext.injectedButton = button;
    }
  }

  logger.log(`Scan complete. Registry stats:`, getRegistryStats());
}

/**
 * Create an EditorContext object
 */
function createEditorContext(
  id: string,
  rootElement: HTMLElement,
  queryInputElement: HTMLElement,
  editorType: EditorType
): EditorContext {
  return {
    id,
    rootElement,
    queryInputElement,
    editorType,
    injectedButton: null,
    getQuery: () => getQueryText(queryInputElement, editorType),
    setQuery: (query: string) => setQueryText(queryInputElement, editorType, query),
    triggerRefresh: () => triggerQueryExecution(rootElement),
  };
}

/**
 * Handle button click
 */
function handleButtonClick(editorId: string): void {
  logger.log(`AI Assistant button clicked for editor ${editorId}`);

  const editor = getEditor(editorId);
  if (!editor) {
    logger.error(`Editor ${editorId} not found`);
    return;
  }

  // Get current query
  const currentQuery = editor.getQuery();

  // Toggle overlay
  toggleOverlay(editorId, currentQuery);
}

/**
 * Set up MutationObserver to detect DOM changes
 */
function setupMutationObserver(): void {
  observer = new MutationObserver((mutations) => {
    // Debounce: only run scan after DOM has settled
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      logger.log('DOM mutation detected, rescanning...');
      scanAndInject();
      debounceTimer = null;
    }, CONFIG.OBSERVER_CONFIG.debounceDelay);
  });

  observer.observe(document.body, CONFIG.OBSERVER_CONFIG.observerOptions);
  logger.log('MutationObserver set up');
}

/**
 * Cleanup function (for extension unload)
 */
function cleanup(): void {
  logger.log('Cleaning up extension...');

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  logger.log('Extension cleaned up');
}

/**
 * Entry point
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded
  init();
}

// Expose cleanup for debugging
(window as any).__promAICleanup = cleanup;

// Log extension version
logger.log('Extension version: 1.0.0');
logger.log('Config:', {
  iframeUrl: CONFIG.ASSISTANT_IFRAME_URL,
  autoCloseOnInsert: CONFIG.OVERLAY_CONFIG.autoCloseOnInsert,
});
