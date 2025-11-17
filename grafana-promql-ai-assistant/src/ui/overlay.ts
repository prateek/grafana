/**
 * Overlay UI management for the AI Assistant chat panel.
 * Handles showing/hiding the overlay and communication with the iframe.
 */

import { config, getAllowedOrigin } from '../config';
import type { PromQLContextMessage } from '../types';

let overlayRoot: HTMLElement | null = null;
let iframe: HTMLIFrameElement | null = null;
let currentEditorId: string | null = null;

/**
 * Creates the overlay DOM structure if it doesn't exist.
 */
function ensureOverlayRoot(): HTMLElement {
  if (overlayRoot) {
    return overlayRoot;
  }

  overlayRoot = document.createElement('div');
  overlayRoot.id = config.overlay.rootId;
  overlayRoot.className = 'prom-ai-overlay-root';
  overlayRoot.innerHTML = `
    <div class="prom-ai-overlay-backdrop"></div>
    <div class="prom-ai-overlay-panel">
      <div class="prom-ai-overlay-header">
        <h2 class="prom-ai-overlay-title">${config.overlay.title}</h2>
        <button class="prom-ai-overlay-close" aria-label="Close">×</button>
      </div>
      <div class="prom-ai-overlay-content">
        <iframe
          class="prom-ai-assistant-iframe"
          title="PromQL AI Assistant"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        ></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(overlayRoot);

  // Set up iframe
  iframe = overlayRoot.querySelector('.prom-ai-assistant-iframe') as HTMLIFrameElement;
  if (iframe) {
    iframe.src = config.assistantIframeUrl;
  }

  // Set up close button
  const closeButton = overlayRoot.querySelector('.prom-ai-overlay-close') as HTMLButtonElement;
  if (closeButton) {
    closeButton.addEventListener('click', closeOverlay);
  }

  // Close on backdrop click
  const backdrop = overlayRoot.querySelector('.prom-ai-overlay-backdrop') as HTMLElement;
  if (backdrop) {
    backdrop.addEventListener('click', closeOverlay);
  }

  // Set up message listener
  window.addEventListener('message', handleIframeMessage);

  return overlayRoot;
}

/**
 * Handles messages from the iframe.
 */
function handleIframeMessage(event: MessageEvent): void {
  // Verify origin
  const allowedOrigin = getAllowedOrigin(config.assistantIframeUrl);
  if (event.origin !== allowedOrigin) {
    console.warn('Rejected message from unauthorized origin:', event.origin);
    return;
  }

  // Forward message to content script via custom event
  // (since overlay.ts runs in the page context, we need to communicate with content script)
  const detail = {
    source: 'overlay-iframe',
    message: event.data,
  };
  window.dispatchEvent(new CustomEvent('prom-ai-message', { detail }));
}

/**
 * Opens the overlay and sends context to the iframe.
 */
export function openOverlay(editorId: string, currentQuery: string): void {
  const root = ensureOverlayRoot();
  currentEditorId = editorId;

  // Show overlay
  root.classList.add('prom-ai-overlay-visible');

  // Send context to iframe once it's loaded
  if (iframe) {
    const sendContext = () => {
      const message: PromQLContextMessage = {
        type: 'promql_context',
        editorId,
        currentQuery,
        datasource: 'prometheus',
      };
      iframe?.contentWindow?.postMessage(message, getAllowedOrigin(config.assistantIframeUrl));
    };

    if (iframe.contentWindow) {
      // Iframe already loaded
      sendContext();
    } else {
      // Wait for iframe to load
      iframe.addEventListener('load', sendContext, { once: true });
    }
  }
}

/**
 * Closes the overlay.
 */
export function closeOverlay(): void {
  if (overlayRoot) {
    overlayRoot.classList.remove('prom-ai-overlay-visible');
    currentEditorId = null;
  }
}

/**
 * Updates the context sent to the iframe (e.g., when switching editors).
 */
export function updateContext(editorId: string, currentQuery: string): void {
  if (!iframe?.contentWindow || !overlayRoot?.classList.contains('prom-ai-overlay-visible')) {
    return;
  }

  currentEditorId = editorId;
  const message: PromQLContextMessage = {
    type: 'promql_context',
    editorId,
    currentQuery,
    datasource: 'prometheus',
  };
  iframe.contentWindow.postMessage(message, getAllowedOrigin(config.assistantIframeUrl));
}

/**
 * Checks if the overlay is currently open.
 */
export function isOverlayOpen(): boolean {
  return overlayRoot?.classList.contains('prom-ai-overlay-visible') || false;
}

/**
 * Gets the current editor ID if overlay is open.
 */
export function getCurrentEditorId(): string | null {
  return currentEditorId;
}
