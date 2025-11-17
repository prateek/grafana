/**
 * Bridge script that runs in the page context (not content script context).
 * This script must be self-contained and cannot import from other modules.
 * Handles overlay management and communication between content script and iframe.
 */

// Inline configuration (must match config.ts)
const OVERLAY_CONFIG = {
  rootId: 'prom-ai-overlay-root',
  title: 'PromQL Assistant',
  assistantIframeUrl: 'https://assistant.example.com/embed?mode=promql',
};

function getAllowedOrigin(iframeUrl: string): string {
  try {
    return new URL(iframeUrl).origin;
  } catch {
    return 'https://assistant.example.com';
  }
}

let overlayRoot: HTMLElement | null = null;
let iframe: HTMLIFrameElement | null = null;
let currentEditorId: string | null = null;

/**
 * Creates the overlay DOM structure.
 */
function createOverlay(): HTMLElement {
  if (overlayRoot) {
    return overlayRoot;
  }

  // Inject overlay CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  // Access chrome.runtime via window.chrome (available in page context for web accessible resources)
  const chromeRuntime = (window as any).chrome?.runtime;
  if (chromeRuntime) {
    cssLink.href = chromeRuntime.getURL('styles/overlay.css');
    document.head.appendChild(cssLink);
  }

  overlayRoot = document.createElement('div');
  overlayRoot.id = OVERLAY_CONFIG.rootId;
  overlayRoot.className = 'prom-ai-overlay-root';
  overlayRoot.innerHTML = `
    <div class="prom-ai-overlay-backdrop"></div>
    <div class="prom-ai-overlay-panel">
      <div class="prom-ai-overlay-header">
        <h2 class="prom-ai-overlay-title">${OVERLAY_CONFIG.title}</h2>
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

  iframe = overlayRoot.querySelector('.prom-ai-assistant-iframe') as HTMLIFrameElement;
  if (iframe) {
    iframe.src = OVERLAY_CONFIG.assistantIframeUrl;
  }

  const closeButton = overlayRoot.querySelector('.prom-ai-overlay-close') as HTMLButtonElement;
  if (closeButton) {
    closeButton.addEventListener('click', closeOverlay);
  }

  const backdrop = overlayRoot.querySelector('.prom-ai-overlay-backdrop') as HTMLElement;
  if (backdrop) {
    backdrop.addEventListener('click', closeOverlay);
  }

  // Listen for messages from iframe
  window.addEventListener('message', handleIframeMessage);

  return overlayRoot;
}

/**
 * Handles messages from the iframe.
 */
function handleIframeMessage(event: MessageEvent): void {
  const allowedOrigin = getAllowedOrigin(OVERLAY_CONFIG.assistantIframeUrl);
  if (event.origin !== allowedOrigin) {
    return;
  }

  const message = event.data;
  if (message && message.type === 'promql_suggestion') {
    // Forward to content script via custom event
    window.dispatchEvent(
      new CustomEvent('prom-ai-iframe-message', {
        detail: message,
      })
    );
  }
}

/**
 * Opens the overlay.
 */
function openOverlay(editorId: string, currentQuery: string): void {
  const root = createOverlay();
  currentEditorId = editorId;

  root.classList.add('prom-ai-overlay-visible');

  if (iframe) {
    const sendContext = () => {
      const message = {
        type: 'promql_context',
        editorId,
        currentQuery,
        datasource: 'prometheus',
      };
      iframe?.contentWindow?.postMessage(message, getAllowedOrigin(OVERLAY_CONFIG.assistantIframeUrl));
    };

    if (iframe.contentWindow) {
      sendContext();
    } else {
      iframe.addEventListener('load', sendContext, { once: true });
    }
  }
}

/**
 * Closes the overlay.
 */
function closeOverlay(): void {
  if (overlayRoot) {
    overlayRoot.classList.remove('prom-ai-overlay-visible');
    currentEditorId = null;
  }
}

// Listen for messages from content script
window.addEventListener('prom-ai-open-overlay', ((event: CustomEvent) => {
  const { editorId, currentQuery } = event.detail;
  openOverlay(editorId, currentQuery);
}) as EventListener);

window.addEventListener('prom-ai-close-overlay', () => {
  closeOverlay();
});

// Expose functions to window for debugging (optional)
(window as any).__promAIAssistant = {
  openOverlay,
  closeOverlay,
};
