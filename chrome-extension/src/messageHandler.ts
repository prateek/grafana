/**
 * Message Handler
 *
 * Handles postMessage communication between the overlay iframe and the content script.
 * Validates messages and routes them to appropriate handlers.
 */

import { config, debugLog, debugError } from './config';
import type { ExtensionMessage, MessageType, PromQLSuggestionMessage } from './types';
import { getEditor } from './editorRegistry';
import { closeOverlay } from './overlayManager';

/**
 * Initialize message handler
 * Sets up listener for postMessage events from iframe
 */
export function initializeMessageHandler(): void {
  window.addEventListener('message', handleMessage);
  debugLog('Message handler initialized');
}

/**
 * Clean up message handler
 */
export function destroyMessageHandler(): void {
  window.removeEventListener('message', handleMessage);
  debugLog('Message handler destroyed');
}

/**
 * Handle incoming postMessage events
 * @param event The message event
 */
function handleMessage(event: MessageEvent): void {
  // Validate origin
  if (event.origin !== config.ASSISTANT_IFRAME_ORIGIN) {
    // Ignore messages from other origins
    return;
  }

  // Validate message structure
  if (!event.data || typeof event.data !== 'object') {
    debugError('Invalid message data:', event.data);
    return;
  }

  const message = event.data as ExtensionMessage;

  // Route message based on type
  switch (message.type) {
    case 'promql_suggestion':
      handlePromQLSuggestion(message as PromQLSuggestionMessage);
      break;

    case 'close_overlay':
      handleCloseOverlay();
      break;

    default:
      debugLog('Unknown message type:', (message as any).type);
  }
}

/**
 * Handle PromQL suggestion message from iframe
 * @param message The suggestion message
 */
function handlePromQLSuggestion(message: PromQLSuggestionMessage): void {
  debugLog('Received PromQL suggestion:', message);

  const { editorId, query } = message;

  // Get the editor from registry
  const editor = getEditor(editorId);
  if (!editor) {
    debugError('Editor not found for suggestion:', editorId);
    return;
  }

  // Validate query
  if (typeof query !== 'string') {
    debugError('Invalid query in suggestion:', query);
    return;
  }

  // Set the query in the editor
  try {
    editor.setQuery(query);
    debugLog('Successfully set query in editor:', editorId);

    // Auto-close overlay if configured
    if (config.UI.AUTO_CLOSE_OVERLAY_ON_INSERT) {
      setTimeout(() => {
        closeOverlay();
      }, 300);
    }
  } catch (error) {
    debugError('Error setting query:', error);
  }
}

/**
 * Handle close overlay request from iframe
 */
function handleCloseOverlay(): void {
  debugLog('Received close overlay request');
  closeOverlay();
}

/**
 * Type guard to check if a message is a valid extension message
 * @param data The message data
 * @returns True if valid
 */
export function isValidExtensionMessage(data: unknown): data is ExtensionMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const msg = data as any;

  // Check for required type field
  if (!msg.type || typeof msg.type !== 'string') {
    return false;
  }

  // Validate based on type
  switch (msg.type as MessageType) {
    case 'promql_context':
      return (
        typeof msg.editorId === 'string' &&
        typeof msg.currentQuery === 'string' &&
        msg.datasource === 'prometheus' &&
        typeof msg.timestamp === 'number'
      );

    case 'promql_suggestion':
      return (
        typeof msg.editorId === 'string' &&
        typeof msg.query === 'string' &&
        typeof msg.timestamp === 'number'
      );

    case 'close_overlay':
      return typeof msg.timestamp === 'number';

    default:
      return false;
  }
}
