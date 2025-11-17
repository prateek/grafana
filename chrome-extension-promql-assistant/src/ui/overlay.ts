/**
 * Overlay panel UI module.
 * Manages the overlay chat panel that appears when the AI Assistant button is clicked.
 */

import { ASSISTANT_IFRAME_URL, isValidIframeOrigin, AUTO_CLOSE_OVERLAY_ON_INSERT } from '../config';
import type { EditorContext, PromqlContextMessage, PromqlSuggestionMessage } from '../types';

let overlayRoot: HTMLElement | null = null;
let currentEditorContext: EditorContext | null = null;
let messageHandler: ((message: PromqlSuggestionMessage) => void) | null = null;

/**
 * Creates the overlay root element and panel structure.
 */
function createOverlay(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'prom-ai-overlay-root';

  const backdrop = document.createElement('div');
  backdrop.className = 'prom-ai-overlay-backdrop';
  backdrop.addEventListener('click', () => closeOverlay());

  const panel = document.createElement('div');
  panel.className = 'prom-ai-overlay-panel';

  const header = document.createElement('div');
  header.className = 'prom-ai-overlay-header';

  const title = document.createElement('h2');
  title.className = 'prom-ai-overlay-title';
  title.textContent = 'PromQL Assistant';

  const closeButton = document.createElement('button');
  closeButton.className = 'prom-ai-overlay-close';
  closeButton.type = 'button';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', () => closeOverlay());

  header.appendChild(title);
  header.appendChild(closeButton);

  const content = document.createElement('div');
  content.className = 'prom-ai-overlay-content';

  const iframe = document.createElement('iframe');
  iframe.className = 'prom-ai-overlay-iframe';
  iframe.src = ASSISTANT_IFRAME_URL;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

  content.appendChild(iframe);
  panel.appendChild(header);
  panel.appendChild(content);
  root.appendChild(backdrop);
  root.appendChild(panel);

  return root;
}

/**
 * Sets up postMessage listener for communication with the iframe.
 */
function setupMessageListener(): void {
  window.addEventListener(
    'message',
    (event: MessageEvent) => {
      // Security: validate origin
      if (!isValidIframeOrigin(event.origin)) {
        console.warn('[PromQL Assistant] Rejected message from unauthorized origin:', event.origin);
        return;
      }

      const message = event.data as PromqlSuggestionMessage;
      if (message.type === 'promql_suggestion' && messageHandler) {
        messageHandler(message);
      }
    },
    false
  );
}

/**
 * Sends context information to the iframe.
 */
function sendContextToIframe(context: EditorContext): void {
  if (!overlayRoot) {
    return;
  }

  const iframe = overlayRoot.querySelector<HTMLIFrameElement>('.prom-ai-overlay-iframe');
  if (!iframe || !iframe.contentWindow) {
    return;
  }

  const message: PromqlContextMessage = {
    type: 'promql_context',
    editorId: context.editorId,
    currentQuery: context.getQuery(),
    datasource: 'prometheus',
  };

  try {
    const iframeOrigin = new URL(ASSISTANT_IFRAME_URL).origin;

    // Wait for iframe to load before sending message
    iframe.addEventListener(
      'load',
      () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(message, iframeOrigin);
        }
      },
      { once: true }
    );

    // Also try immediately (iframe might already be loaded)
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, iframeOrigin);
    }
  } catch (error) {
    console.error('[PromQL Assistant] Failed to send context to iframe:', error);
  }
}

/**
 * Opens the overlay panel for a given editor context.
 */
export function openOverlay(
  editorContext: EditorContext,
  onSuggestion: (message: PromqlSuggestionMessage) => void
): void {
  // Initialize overlay if it doesn't exist
  if (!overlayRoot) {
    overlayRoot = createOverlay();
    document.body.appendChild(overlayRoot);
    setupMessageListener();
  }

  currentEditorContext = editorContext;
  messageHandler = onSuggestion;

  // Show overlay
  overlayRoot.classList.add('visible');

  // Send context to iframe
  sendContextToIframe(editorContext);

  // Prevent body scroll when overlay is open
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the overlay panel.
 */
export function closeOverlay(): void {
  if (!overlayRoot) {
    return;
  }

  overlayRoot.classList.remove('visible');
  currentEditorContext = null;
  messageHandler = null;

  // Restore body scroll
  document.body.style.overflow = '';

  // Optionally remove overlay from DOM after animation
  setTimeout(() => {
    if (overlayRoot && !overlayRoot.classList.contains('visible')) {
      // Keep overlay in DOM but hidden for faster reopening
      // overlayRoot.remove();
      // overlayRoot = null;
    }
  }, 300);
}

/**
 * Handles a suggestion message from the iframe.
 */
export function handleSuggestion(message: PromqlSuggestionMessage): void {
  if (!currentEditorContext || currentEditorContext.editorId !== message.editorId) {
    console.warn('[PromQL Assistant] Received suggestion for unknown editor:', message.editorId);
    return;
  }

  // Set the query in the editor
  currentEditorContext.setQuery(message.query);

  // Optionally close overlay
  if (AUTO_CLOSE_OVERLAY_ON_INSERT) {
    closeOverlay();
  }
}

/**
 * Checks if the overlay is currently open.
 */
export function isOverlayOpen(): boolean {
  return overlayRoot?.classList.contains('visible') ?? false;
}
