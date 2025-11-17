/**
 * Overlay Manager
 *
 * Manages the overlay panel that contains the assistants-ui iframe.
 * Handles opening, closing, and communication with the iframe.
 */

import { CONFIG, logger } from '@/config';
import type { OverlayState, PromQLContextMessage } from '@/types';

// Overlay root element ID
const OVERLAY_ROOT_ID = 'prom-ai-overlay-root';
const OVERLAY_IFRAME_ID = 'prom-ai-overlay-iframe';

/**
 * Global overlay state
 */
const state: OverlayState = {
  isVisible: false,
  activeEditorId: null,
  overlayElement: null,
  iframeElement: null,
};

/**
 * Open the overlay for a specific editor
 */
export function openOverlay(editorId: string, currentQuery: string): void {
  logger.log(`Opening overlay for editor ${editorId}`);

  // Create overlay if it doesn't exist
  if (!state.overlayElement) {
    createOverlay();
  }

  // Update state
  state.activeEditorId = editorId;
  state.isVisible = true;

  // Show overlay
  if (state.overlayElement) {
    state.overlayElement.style.display = 'flex';
  }

  // Send context to iframe
  sendContextToIframe(editorId, currentQuery);
}

/**
 * Close the overlay
 */
export function closeOverlay(): void {
  logger.log('Closing overlay');

  state.isVisible = false;
  state.activeEditorId = null;

  if (state.overlayElement) {
    state.overlayElement.style.display = 'none';
  }
}

/**
 * Toggle overlay visibility
 */
export function toggleOverlay(editorId: string, currentQuery: string): void {
  if (state.isVisible && state.activeEditorId === editorId) {
    closeOverlay();
  } else {
    openOverlay(editorId, currentQuery);
  }
}

/**
 * Get current overlay state
 */
export function getOverlayState(): Readonly<OverlayState> {
  return { ...state };
}

/**
 * Create the overlay DOM structure
 */
function createOverlay(): void {
  // Check if already exists
  let overlayRoot = document.getElementById(OVERLAY_ROOT_ID);
  if (overlayRoot) {
    state.overlayElement = overlayRoot as HTMLElement;
    state.iframeElement = document.getElementById(OVERLAY_IFRAME_ID) as HTMLIFrameElement;
    return;
  }

  // Create overlay root
  overlayRoot = document.createElement('div');
  overlayRoot.id = OVERLAY_ROOT_ID;
  overlayRoot.className = 'prom-ai-overlay';
  overlayRoot.style.display = 'none';

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-backdrop';
  backdrop.addEventListener('click', () => {
    closeOverlay();
  });

  // Create panel
  const panel = document.createElement('div');
  panel.className = 'overlay-panel';
  panel.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent closing when clicking inside panel
  });

  // Create header
  const header = document.createElement('div');
  header.className = 'overlay-header';

  const title = document.createElement('h2');
  title.textContent = CONFIG.OVERLAY_CONFIG.title;
  title.className = 'overlay-title';

  const closeButton = document.createElement('button');
  closeButton.className = 'overlay-close-button';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', () => {
    closeOverlay();
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.className = 'overlay-iframe-container';

  const iframe = document.createElement('iframe');
  iframe.id = OVERLAY_IFRAME_ID;
  iframe.className = 'overlay-iframe';
  iframe.src = CONFIG.ASSISTANT_IFRAME_URL;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

  iframeContainer.appendChild(iframe);

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(iframeContainer);

  // Assemble overlay
  overlayRoot.appendChild(backdrop);
  overlayRoot.appendChild(panel);

  // Add to DOM
  document.body.appendChild(overlayRoot);

  // Update state
  state.overlayElement = overlayRoot;
  state.iframeElement = iframe;

  logger.log('Overlay created and added to DOM');
}

/**
 * Send context message to iframe
 */
function sendContextToIframe(editorId: string, currentQuery: string): void {
  if (!state.iframeElement || !state.iframeElement.contentWindow) {
    logger.warn('Iframe not ready, cannot send context');
    return;
  }

  const message: PromQLContextMessage = {
    type: 'promql_context',
    timestamp: Date.now(),
    payload: {
      editorId,
      currentQuery,
      datasource: 'prometheus',
    },
  };

  // Wait a bit for iframe to load
  setTimeout(() => {
    try {
      state.iframeElement!.contentWindow!.postMessage(
        message,
        CONFIG.ASSISTANT_IFRAME_ORIGIN
      );
      logger.log('Sent context to iframe:', message);
    } catch (error) {
      logger.error('Error sending message to iframe:', error);
    }
  }, 500);
}

/**
 * Destroy the overlay (cleanup)
 */
export function destroyOverlay(): void {
  if (state.overlayElement && document.body.contains(state.overlayElement)) {
    state.overlayElement.remove();
  }

  state.overlayElement = null;
  state.iframeElement = null;
  state.isVisible = false;
  state.activeEditorId = null;

  logger.log('Overlay destroyed');
}
