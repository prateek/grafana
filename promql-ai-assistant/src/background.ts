chrome.runtime.onInstalled.addListener(details => {
  console.info('[PromQL Assistant] Extension installed', details.reason);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
