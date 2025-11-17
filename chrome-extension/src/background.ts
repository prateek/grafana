/**
 * Background Service Worker
 *
 * Minimal service worker for Manifest V3.
 * Currently handles basic extension lifecycle events.
 * Can be extended for future features like:
 * - Managing API keys
 * - Caching
 * - Cross-tab communication
 */

console.log('[Grafana Prom AI] Background service worker started');

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Grafana Prom AI] Extension installed:', details.reason);

  if (details.reason === 'install') {
    console.log('[Grafana Prom AI] First time installation');
    // Could open a welcome page or setup guide here
  } else if (details.reason === 'update') {
    console.log('[Grafana Prom AI] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

/**
 * Extension startup handler
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[Grafana Prom AI] Browser started, service worker initialized');
});

/**
 * Message handler for communication with content scripts
 * (Currently not used, but available for future features)
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Grafana Prom AI] Received message:', message, 'from:', sender.tab?.id);

  // Handle different message types
  switch (message.type) {
    case 'ping':
      sendResponse({ status: 'ok', timestamp: Date.now() });
      break;

    default:
      console.warn('[Grafana Prom AI] Unknown message type:', message.type);
      sendResponse({ status: 'error', error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async responses
});

/**
 * Tab update listener
 * Could be used to detect navigation to Grafana pages
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a Grafana page
    if (isGrafanaUrl(tab.url)) {
      console.log('[Grafana Prom AI] Grafana page loaded:', tab.url);
      // Could inject scripts or perform other actions here
    }
  }
});

/**
 * Check if a URL matches Grafana patterns
 */
function isGrafanaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Check for localhost
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      return true;
    }

    // Check for grafana in path
    if (urlObj.pathname.includes('grafana')) {
      return true;
    }

    // Check for grafana in hostname
    if (urlObj.hostname.includes('grafana')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Grafana Prom AI] Invalid URL:', error);
    return false;
  }
}

/**
 * Keep service worker alive (if needed)
 * Chrome can terminate idle service workers after 30 seconds
 */
let keepAliveInterval: number | null = null;

function startKeepAlive() {
  if (keepAliveInterval === null) {
    keepAliveInterval = setInterval(() => {
      console.log('[Grafana Prom AI] Keep-alive ping');
    }, 20000) as unknown as number; // Every 20 seconds
  }
}

function stopKeepAlive() {
  if (keepAliveInterval !== null) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Start keep-alive on service worker activation
startKeepAlive();

console.log('[Grafana Prom AI] Background service worker ready');
