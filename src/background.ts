/**
 * Background service worker for the extension.
 * Minimal implementation - mainly for extension lifecycle management.
 */

console.log('[PromQL AI] Background service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PromQL AI] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('[PromQL AI] First install - welcome!');
  } else if (details.reason === 'update') {
    console.log('[PromQL AI] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[PromQL AI] Message received in background:', message);

  // Add any background message handling here if needed in the future
  sendResponse({ received: true });

  return true;
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('[PromQL AI] Background error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[PromQL AI] Unhandled rejection in background:', event.reason);
});
