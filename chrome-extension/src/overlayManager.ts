/**
 * Overlay Manager
 *
 * Manages the AI assistant overlay panel that appears over Grafana.
 * Handles showing, hiding, and communication with the iframe.
 */

import { config, debugLog, debugError } from './config';
import type { EditorContext, MessageType, PromQLContextMessage } from './types';

const OVERLAY_ROOT_ID = 'prom-ai-overlay-root';
const OVERLAY_CLASS = 'prom-ai-overlay';
const BACKDROP_CLASS = 'prom-ai-overlay__backdrop';
const PANEL_CLASS = 'prom-ai-overlay__panel';
const HEADER_CLASS = 'prom-ai-overlay__header';
const CONTENT_CLASS = 'prom-ai-overlay__content';
const CLOSE_BUTTON_CLASS = 'prom-ai-overlay__close';

/**
 * Current state of the overlay
 */
let overlayState: {
  isOpen: boolean;
  rootElement: HTMLElement | null;
  iframe: HTMLIFrameElement | null;
  currentEditorId: string | null;
} = {
  isOpen: false,
  rootElement: null,
  iframe: null,
  currentEditorId: null,
};

/**
 * Open the overlay for a specific editor
 * @param editor The editor context
 */
export function openOverlay(editor: EditorContext): void {
  debugLog('Opening overlay for editor:', editor.id);

  // Create overlay if it doesn't exist
  if (!overlayState.rootElement) {
    createOverlay();
  }

  // Show the overlay
  if (overlayState.rootElement) {
    overlayState.rootElement.style.display = 'flex';
    overlayState.isOpen = true;
    overlayState.currentEditorId = editor.id;

    // Send context to iframe
    sendContextToIframe(editor);
  }
}

/**
 * Close the overlay
 */
export function closeOverlay(): void {
  debugLog('Closing overlay');

  if (overlayState.rootElement) {
    overlayState.rootElement.style.display = 'none';
    overlayState.isOpen = false;
    overlayState.currentEditorId = null;
  }
}

/**
 * Check if the overlay is currently open
 * @returns True if overlay is open
 */
export function isOverlayOpen(): boolean {
  return overlayState.isOpen;
}

/**
 * Get the current editor ID that the overlay is associated with
 * @returns Editor ID or null
 */
export function getCurrentEditorId(): string | null {
  return overlayState.currentEditorId;
}

/**
 * Create the overlay DOM structure
 */
function createOverlay(): void {
  // Check if already exists
  if (document.getElementById(OVERLAY_ROOT_ID)) {
    debugLog('Overlay already exists');
    return;
  }

  // Create root element
  const root = document.createElement('div');
  root.id = OVERLAY_ROOT_ID;
  root.className = OVERLAY_CLASS;
  root.style.display = 'none';

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = BACKDROP_CLASS;
  backdrop.addEventListener('click', () => {
    closeOverlay();
  });

  // Create panel
  const panel = document.createElement('div');
  panel.className = PANEL_CLASS;
  panel.addEventListener('click', (e) => {
    // Prevent backdrop click when clicking inside panel
    e.stopPropagation();
  });

  // Create header
  const header = document.createElement('div');
  header.className = HEADER_CLASS;

  const title = document.createElement('h2');
  title.textContent = 'PromQL AI Assistant';
  title.className = 'prom-ai-overlay__title';

  const closeButton = document.createElement('button');
  closeButton.className = CLOSE_BUTTON_CLASS;
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close AI Assistant');
  closeButton.addEventListener('click', () => {
    closeOverlay();
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create content area with iframe
  const content = document.createElement('div');
  content.className = CONTENT_CLASS;

  const iframe = createIframe();
  content.appendChild(iframe);

  // Assemble the panel
  panel.appendChild(header);
  panel.appendChild(content);

  // Assemble the overlay
  root.appendChild(backdrop);
  root.appendChild(panel);

  // Add to document
  document.body.appendChild(root);

  // Store references
  overlayState.rootElement = root;
  overlayState.iframe = iframe;

  debugLog('Created overlay DOM structure');
}

/**
 * Create the iframe element for the AI assistant
 * @returns Iframe element
 */
function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.className = 'prom-ai-overlay__iframe';
  iframe.src = config.ASSISTANT_IFRAME_URL;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  return iframe;
}

/**
 * Send context information to the iframe
 * @param editor The editor context
 */
function sendContextToIframe(editor: EditorContext): void {
  if (!overlayState.iframe || !overlayState.iframe.contentWindow) {
    debugError('Iframe not ready');
    return;
  }

  const message: PromQLContextMessage = {
    type: 'promql_context' as MessageType.PROMQL_CONTEXT,
    editorId: editor.id,
    currentQuery: editor.getQuery(),
    datasource: 'prometheus',
    timestamp: Date.now(),
  };

  // Wait a bit for iframe to load if needed
  setTimeout(() => {
    if (overlayState.iframe && overlayState.iframe.contentWindow) {
      overlayState.iframe.contentWindow.postMessage(message, config.ASSISTANT_IFRAME_ORIGIN);
      debugLog('Sent context to iframe:', message);
    }
  }, 100);
}

/**
 * Clean up overlay resources
 * Useful for testing or when extension is unloaded
 */
export function destroyOverlay(): void {
  if (overlayState.rootElement) {
    overlayState.rootElement.remove();
    overlayState.rootElement = null;
    overlayState.iframe = null;
    overlayState.isOpen = false;
    overlayState.currentEditorId = null;
    debugLog('Destroyed overlay');
  }
}
