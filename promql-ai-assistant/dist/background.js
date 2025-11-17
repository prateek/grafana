// src/background.ts
chrome.runtime.onInstalled.addListener((details) => {
  console.info("PromQL AI Assistant installed", details.reason);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "ping") {
    sendResponse({ ok: true });
    return true;
  }
  return void 0;
});
