/**
 * Content script that runs on Grafana pages.
 * Detects Prometheus query editors, injects AI Assistant buttons,
 * manages the overlay, and handles communication with the assistant iframe.
 */

import { config, logger } from './config';
import { findEditors, findToolbarForEditor } from './promEditorDetector';
import type { EditorContext, PromQLSuggestionMessage } from './types';
import { isPromQLSuggestionMessage } from './types';

/**
 * Registry of detected editors, keyed by editor ID
 */
const editorRegistry = new Map<string, EditorContext>();

/**
 * Reference to the overlay root element
 */
let overlayRoot: HTMLElement | null = null;

/**
 * Reference to the overlay iframe
 */
let overlayIframe: HTMLIFrameElement | null = null;

/**
 * Injects the AI Assistant button into an editor's toolbar
 */
function injectAIButton(editor: EditorContext): void {
  // Check if button already exists
  if (editor.buttonElement && document.body.contains(editor.buttonElement)) {
    logger.debug(`Button already exists for editor ${editor.id}`);
    return;
  }

  const toolbar = findToolbarForEditor(editor);
  if (!toolbar) {
    logger.warn(`No toolbar found for editor ${editor.id}`);
    return;
  }

  // Create button element
  const button = document.createElement('button');
  button.className = 'prom-ai-assistant-button';
  button.textContent = config.UI.buttonLabel;
  button.type = 'button';

  // Add icon (simple inline SVG)
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('fill', 'currentColor');
  icon.innerHTML = `
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2z"/>
    <path d="M5.5 7a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 4z"/>
  `;
  button.insertBefore(icon, button.firstChild);

  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openOverlay(editor.id);
  });

  // Store reference
  editor.buttonElement = button;

  // Inject into toolbar
  toolbar.appendChild(button);
  logger.debug(`Injected AI button for editor ${editor.id}`);
}

/**
 * Scans the page for Prometheus editors and injects buttons
 */
function scanAndInjectButtons(): void {
  const editors = findEditors();

  logger.debug(`Scan found ${editors.length} Prometheus editors`);

  // Add new editors to registry
  for (const editor of editors) {
    if (!editorRegistry.has(editor.id)) {
      editorRegistry.set(editor.id, editor);
      injectAIButton(editor);
    }
  }

  // Clean up editors that no longer exist in the DOM
  for (const [id, editor] of editorRegistry.entries()) {
    if (!document.body.contains(editor.rootElement)) {
      logger.debug(`Editor ${id} removed from DOM, cleaning up`);
      editorRegistry.delete(id);
    }
  }
}

/**
 * Opens the AI Assistant overlay for a specific editor
 */
function openOverlay(editorId: string): void {
  logger.info(`Opening overlay for editor ${editorId}`);

  // Create overlay if it doesn't exist
  if (!overlayRoot) {
    createOverlay();
  }

  // Show overlay
  if (overlayRoot) {
    overlayRoot.style.display = 'flex';
  }

  // Send context to iframe
  sendContextToIframe(editorId);
}

/**
 * Closes the AI Assistant overlay
 */
function closeOverlay(): void {
  logger.info('Closing overlay');

  if (overlayRoot) {
    overlayRoot.style.display = 'none';
  }
}

/**
 * Creates the overlay DOM structure
 */
function createOverlay(): void {
  // Create root container
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'prom-ai-overlay-root';
  overlayRoot.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: ${config.UI.overlayZIndex};
    display: none;
    align-items: center;
    justify-content: center;
  `;

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'prom-ai-overlay-backdrop';
  backdrop.addEventListener('click', closeOverlay);

  // Create panel container
  const panel = document.createElement('div');
  panel.className = 'prom-ai-overlay-panel';
  panel.addEventListener('click', (e) => e.stopPropagation());

  // Create header
  const header = document.createElement('div');
  header.className = 'prom-ai-overlay-header';

  const title = document.createElement('h2');
  title.textContent = 'PromQL Assistant';

  const closeButton = document.createElement('button');
  closeButton.className = 'prom-ai-overlay-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', closeOverlay);

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create iframe
  overlayIframe = document.createElement('iframe');
  overlayIframe.className = 'prom-ai-overlay-iframe';
  overlayIframe.src = config.ASSISTANT_IFRAME_URL;
  overlayIframe.allow = 'clipboard-write';

  // Assemble
  panel.appendChild(header);
  panel.appendChild(overlayIframe);
  overlayRoot.appendChild(backdrop);
  overlayRoot.appendChild(panel);

  // Add to DOM
  document.body.appendChild(overlayRoot);

  logger.debug('Overlay created');
}

/**
 * Sends the current query context to the iframe
 */
function sendContextToIframe(editorId: string): void {
  if (!overlayIframe || !overlayIframe.contentWindow) {
    logger.warn('Cannot send context: iframe not ready');
    return;
  }

  const editor = editorRegistry.get(editorId);
  if (!editor) {
    logger.warn(`Cannot send context: editor ${editorId} not found`);
    return;
  }

  const currentQuery = editor.getQuery();

  const message = {
    type: 'promql_context',
    editorId,
    currentQuery,
    datasource: 'prometheus' as const,
  };

  // Wait a bit for iframe to load if it was just created
  setTimeout(() => {
    overlayIframe!.contentWindow!.postMessage(message, '*');
    logger.debug('Sent context to iframe:', message);
  }, 100);
}

/**
 * Handles messages from the iframe
 */
function handleIframeMessage(event: MessageEvent): void {
  // Validate origin
  const isAllowedOrigin = config.ALLOWED_IFRAME_ORIGINS.some((origin) => {
    // Support wildcard patterns
    if (origin.includes('*')) {
      const pattern = origin.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(event.origin);
    }
    return event.origin === origin;
  });

  if (!isAllowedOrigin) {
    logger.debug(`Ignoring message from unauthorized origin: ${event.origin}`);
    return;
  }

  // Parse message
  const message = event.data;

  if (isPromQLSuggestionMessage(message)) {
    handleQuerySuggestion(message);
  }
}

/**
 * Handles a query suggestion from the iframe
 */
function handleQuerySuggestion(message: PromQLSuggestionMessage): void {
  logger.info(`Received query suggestion for editor ${message.editorId}`);

  const editor = editorRegistry.get(message.editorId);
  if (!editor) {
    logger.error(`Cannot apply suggestion: editor ${message.editorId} not found`);
    return;
  }

  // Set the query
  editor.setQuery(message.query);
  logger.info('Query applied successfully');

  // Auto-close overlay if configured
  if (config.UI.autoCloseOverlayOnInsert) {
    closeOverlay();
  }
}

/**
 * Sets up a MutationObserver to detect DOM changes
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added/removed nodes
    const hasNodeChanges = mutations.some(
      (mutation) => mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0
    );

    if (hasNodeChanges) {
      // Debounce scan to avoid excessive re-scanning
      debouncedScan();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  logger.debug('MutationObserver set up');
}

/**
 * Debounced scan function to avoid excessive re-scanning
 */
let scanTimeout: number | null = null;
function debouncedScan(): void {
  if (scanTimeout !== null) {
    clearTimeout(scanTimeout);
  }

  scanTimeout = window.setTimeout(() => {
    scanAndInjectButtons();
    scanTimeout = null;
  }, 300);
}

/**
 * Initialization
 */
function init(): void {
  logger.info('Content script initializing');

  // Initial scan
  scanAndInjectButtons();

  // Set up mutation observer
  setupMutationObserver();

  // Set up message listener
  window.addEventListener('message', handleIframeMessage);

  // Periodic re-scan as backup (every 5 seconds)
  setInterval(() => {
    scanAndInjectButtons();
  }, 5000);

  logger.info('Content script initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
export { editorRegistry, scanAndInjectButtons, handleQuerySuggestion, closeOverlay };
