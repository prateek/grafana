/**
 * Background service worker (Manifest V3).
 * Minimal implementation - can be extended for future features.
 */

console.log('[PromQL Assistant] Background service worker initialized');

// Example: Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[PromQL Assistant] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[PromQL Assistant] Extension updated');
  }
});

// Example: Handle messages from content script if needed in the future
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages if needed
  return false;
});
