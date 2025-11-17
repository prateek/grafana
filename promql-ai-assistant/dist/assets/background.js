chrome.runtime.onInstalled.addListener(e=>{console.info("[PromQL Assistant] Extension installed",e.reason)});chrome.runtime.onMessage.addListener((e,r,n)=>e?.type==="ping"?(n({ok:!0}),!0):!1);
