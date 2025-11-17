chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  console.info('PromQL AI Assistant installed', details.reason);
});

chrome.runtime.onMessage.addListener((message: { type?: string } | undefined, sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true });
    return true;
  }
  return undefined;
});
