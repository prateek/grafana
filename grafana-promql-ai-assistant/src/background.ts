/**
 * Background service worker for the Chrome extension.
 * Minimal implementation - most logic is in the content script.
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Grafana PromQL AI Assistant extension installed');
  } else if (details.reason === 'update') {
    console.log('Grafana PromQL AI Assistant extension updated');
  }
});

// Optional: Handle messages from content script if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any background-level messages here if needed
  return false;
});
