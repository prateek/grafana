/**
 * Message Handler
 *
 * Handles postMessage communication between the content script and the iframe.
 * Validates message origin and routes messages to appropriate handlers.
 */

import { CONFIG, logger } from '@/config';
import type { ExtensionMessage, PromQLSuggestionMessage } from '@/types';
import { getEditor } from '@/registry/editorRegistry';
import { closeOverlay, getOverlayState } from '@/overlay/overlayManager';

/**
 * Initialize message listener
 */
export function initMessageHandler(): void {
  window.addEventListener('message', handleMessage);
  logger.log('Message handler initialized');
}

/**
 * Clean up message listener
 */
export function destroyMessageHandler(): void {
  window.removeEventListener('message', handleMessage);
  logger.log('Message handler destroyed');
}

/**
 * Handle incoming postMessage events
 */
function handleMessage(event: MessageEvent): void {
  // Security: Validate origin
  if (event.origin !== CONFIG.ASSISTANT_IFRAME_ORIGIN) {
    // Ignore messages from unknown origins
    return;
  }

  // Validate message structure
  if (!isValidMessage(event.data)) {
    logger.warn('Received invalid message format:', event.data);
    return;
  }

  const message = event.data as ExtensionMessage;
  logger.log('Received message from iframe:', message);

  // Route message based on type
  switch (message.type) {
    case 'promql_suggestion':
      handleSuggestion(message);
      break;
    case 'promql_context':
      // We don't expect context messages from the iframe, but handle gracefully
      logger.warn('Received unexpected context message from iframe');
      break;
    default:
      logger.warn('Unknown message type:', (message as any).type);
  }
}

/**
 * Validate message structure
 */
function isValidMessage(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!data.type || typeof data.type !== 'string') {
    return false;
  }

  if (!data.timestamp || typeof data.timestamp !== 'number') {
    return false;
  }

  if (!data.payload || typeof data.payload !== 'object') {
    return false;
  }

  return true;
}

/**
 * Handle promql_suggestion message
 */
function handleSuggestion(message: PromQLSuggestionMessage): void {
  const { editorId, query } = message.payload;

  logger.log(`Received query suggestion for editor ${editorId}:`, query);

  // Get the editor from registry
  const editor = getEditor(editorId);
  if (!editor) {
    logger.error(`Editor ${editorId} not found in registry`);
    return;
  }

  // Validate the editor is still in the DOM
  if (!document.body.contains(editor.rootElement)) {
    logger.error(`Editor ${editorId} is no longer in the DOM`);
    return;
  }

  // Set the query
  try {
    editor.setQuery(query);
    logger.log(`Successfully set query in editor ${editorId}`);

    // Optionally trigger refresh
    if (editor.triggerRefresh) {
      editor.triggerRefresh();
    }

    // Auto-close overlay if configured
    if (CONFIG.OVERLAY_CONFIG.autoCloseOnInsert) {
      const overlayState = getOverlayState();
      if (overlayState.activeEditorId === editorId) {
        setTimeout(() => {
          closeOverlay();
        }, 500); // Small delay so user sees the insertion
      }
    }
  } catch (error) {
    logger.error('Error setting query:', error);
  }
}

/**
 * Send a message to the iframe (used by overlayManager)
 * This is a helper function for other modules to send messages
 */
export function sendMessageToIframe(message: ExtensionMessage): boolean {
  const overlayState = getOverlayState();

  if (!overlayState.iframeElement || !overlayState.iframeElement.contentWindow) {
    logger.warn('Cannot send message: iframe not available');
    return false;
  }

  try {
    overlayState.iframeElement.contentWindow.postMessage(
      message,
      CONFIG.ASSISTANT_IFRAME_ORIGIN
    );
    logger.log('Sent message to iframe:', message);
    return true;
  } catch (error) {
    logger.error('Error sending message to iframe:', error);
    return false;
  }
}
