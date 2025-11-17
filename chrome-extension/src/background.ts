/**
 * Background Service Worker
 *
 * Minimal background script for the extension.
 * Handles extension lifecycle events and could be extended
 * for future features like settings management or analytics.
 */

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PromQL AI] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('[PromQL AI] Thank you for installing Grafana PromQL AI Assistant!');
  } else if (details.reason === 'update') {
    console.log('[PromQL AI] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive (Manifest V3 requirement)
// Service workers are terminated after 30 seconds of inactivity
// This is a minimal implementation - expand as needed
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  if (keepAliveInterval) {
    return;
  }

  keepAliveInterval = setInterval(() => {
    // Simple keep-alive ping
    chrome.runtime.getPlatformInfo(() => {
      // No-op, just keeps service worker active
    });
  }, 20000); // Every 20 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Start keep-alive when service worker starts
startKeepAlive();

// Listen for messages from content scripts (future extensibility)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PromQL AI] Message received in background:', message, 'from', sender.tab?.id);

  // Handle different message types here if needed in the future
  // For now, just acknowledge
  sendResponse({ received: true });

  return true; // Keep channel open for async response
});

// Handle extension suspension/resumption
self.addEventListener('activate', () => {
  console.log('[PromQL AI] Service worker activated');
  startKeepAlive();
});

self.addEventListener('deactivate', () => {
  console.log('[PromQL AI] Service worker deactivated');
  stopKeepAlive();
});

console.log('[PromQL AI] Background service worker initialized');
