const v="https://assistant.example.com/embed?mode=promql",S=new URL(v).origin,a={containerCandidates:['[data-testid*="query-editor"]',".query-editor-row",".grafana-query-field",".react-monaco-editor-container"],prometheusIndicators:['[data-testid*="prometheus" i]',".gf-form-select-input",".query-editor-header"],runButtonCandidates:['button[aria-label*="run query" i]','button[aria-label*="run queries" i]','button[data-testid="query-editor-run"]','button[title*="run query" i]'],queryInputs:["textarea",'input[type="text"]','[contenteditable="true"]']},A="AI Assistant",q='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>',I=!1,d={width:420,minHeight:480,zIndex:2147483e3},k={title:"PromQL Assistant"},L="assistants-ui chat panel",f=new WeakMap;let M=0;const O=a.containerCandidates.join(","),x=a.queryInputs.join(","),y=a.runButtonCandidates.join(","),s=/prometheus/i;function T(t=document){const e=t.querySelectorAll(O),n=new Map;return e.forEach(r=>{const o=R(r);if(!o||!_(o))return;const i=B(o);n.has(i.id)||n.set(i.id,i)}),Array.from(n.values())}function R(t){const e=t.closest(".query-editor-row");return e||(t.closest("[data-panelid], [data-panel-id]")??t)}function _(t){if(t.dataset.promAiEditorChecked==="true")return t.dataset.promAiEditorType==="prometheus";const e=(t.dataset.datasource??t.getAttribute("data-datasource")??"").trim();if(s.test(e))return t.dataset.promAiEditorType="prometheus",t.dataset.promAiEditorChecked="true",!0;const n=t.querySelectorAll(a.prometheusIndicators.join(","));for(const o of n){const i=(o.textContent??"").trim();if(s.test(i))return t.dataset.promAiEditorType="prometheus",t.dataset.promAiEditorChecked="true",!0}const r=t.getAttribute("aria-label")??"";return s.test(r)||s.test(t.textContent??"")?(t.dataset.promAiEditorType="prometheus",t.dataset.promAiEditorChecked="true",!0):(t.dataset.promAiEditorChecked="true",t.dataset.promAiEditorType="unknown",!1)}function B(t){const e=j(t),n=N(t);return{id:e,datasource:"prometheus",root:t,buttonHost:n,getQuery:()=>P(t),setQuery:r=>Q(t,r),runQuery:()=>H(t)}}function N(t){const e=['[data-testid="query-editor-actions"]',".query-editor-row .gf-form-inline:last-child",".query-editor-row .query-editor-actions",".gf-form-inline"];for(const n of e){const r=t.querySelector(n);if(r)return r}return t}function j(t){const e=t.dataset.promAiEditorId;if(e)return e;const n=["data-panelid","data-panel-id","data-testid","id","data-uid"];for(const o of n){const i=t.getAttribute(o);if(i)return f.set(t,i),t.dataset.promAiEditorId=i,i}const r=`prom-editor-${++M}`;return f.set(t,r),t.dataset.promAiEditorId=r,r}function P(t){const e=t.querySelector(".CodeMirror");if(e&&e.CodeMirror)return e.CodeMirror.getValue();const n=t.querySelector(".monaco-editor");if(n){const i=V(n);if(i.trim().length)return i}const r=t.querySelector(x);return r?"value"in r?r.value:r.textContent??"":t.querySelector('[contenteditable="true"]')?.textContent??""}function V(t){const e=t.querySelectorAll(".view-lines .view-line");return e.length===0?t.textContent??"":Array.from(e).map(r=>(r.textContent??"").replace(/\u00a0/g," ")).join(`
`)}function Q(t,e){if(!e&&e!=="")return!1;const n=t.querySelector(".CodeMirror");if(n&&n.CodeMirror){const i=n.CodeMirror;return i.focus(),i.setValue(e),!0}if(z(t,e))return!0;const r=t.querySelector(x);if(r)return U(r,e),!0;const o=t.querySelector('[contenteditable="true"]');return o?(o.focus(),o.textContent=e,p(o),m(o),!0):!1}function z(t,e){const n=t.querySelector(".monaco-editor");if(!n)return!1;const r=window.monaco;if(r?.editor?.getModels){const i=r.editor.getModels();if(i?.length===1)return i[0].setValue(e),!0}const o=n.querySelector("textarea");if(!o)return!1;o.focus(),o.value=e,typeof o.setSelectionRange=="function"&&o.setSelectionRange(0,e.length);try{document.execCommand("selectAll"),document.execCommand("insertText",!1,e)}catch{}return p(o,e),m(o),!0}function U(t,e){Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t),"value")?.set?.call(t,e),t.value=e,p(t,e),m(t)}function p(t,e=""){try{const n=new InputEvent("input",{bubbles:!0,composed:!0,data:e});t.dispatchEvent(n)}catch{t.dispatchEvent(new Event("input",{bubbles:!0}))}}function m(t){t.dispatchEvent(new Event("change",{bubbles:!0}))}function H(t){const e=t.querySelector(y);if(e)return e.click(),!0;const n=t.closest("[data-panelid], [data-panel-id]")?.querySelector(y);return n?(n.click(),!0):!1}class D{constructor(){this.editors=new Map}upsert(e){const n=this.editors.get(e.id);if(n)return Object.assign(n,e),n;const r={...e};return this.editors.set(r.id,r),r}getById(e){return this.editors.get(e)}values(){return Array.from(this.editors.values())}dropMissing(e){for(const[n,r]of this.editors.entries()){const o=document.contains(r.root);(!e.has(n)||!o)&&(r.button?.remove?.(),this.editors.delete(n))}}}const $=`.prom-ai-assistant-button {
  align-items: center;
  background: var(--button-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font-size: 12px;
  gap: 0.35rem;
  line-height: 1;
  padding: 0.35rem 0.6rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.prom-ai-assistant-button svg {
  fill: currentColor;
  height: 14px;
  width: 14px;
}

.prom-ai-assistant-button:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.4);
}

.prom-ai-assistant-button:focus-visible {
  outline: 2px solid var(--blue, #0d8bff);
  outline-offset: 2px;
}
`;let h=!1;function W(){if(h)return;const t=document.createElement("style");t.id="prom-ai-button-styles",t.textContent=$,document.head.appendChild(t),h=!0}function Y(t,e){if(W(),t.button&&t.button.isConnected)return t.button;const n=document.createElement("button");return n.type="button",n.className="prom-ai-assistant-button",n.innerHTML=`${q}<span>${A}</span>`,n.dataset.promAiEditorId=t.id,n.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),e(t)}),(t.buttonHost??t.root).appendChild(n),t.button=n,n}const F=`<div class="prom-ai-overlay-backdrop" data-role="overlay-backdrop"></div>
<div class="prom-ai-overlay-panel" role="dialog" aria-modal="true" aria-labelledby="prom-ai-overlay-title">
  <header class="prom-ai-overlay-header">
    <h2 id="prom-ai-overlay-title">PromQL Assistant</h2>
    <button class="prom-ai-overlay-close" data-role="overlay-close" aria-label="Close overlay">×</button>
  </header>
  <section class="prom-ai-overlay-body">
    <iframe
      data-role="assistant-frame"
      title="assistants-ui chat panel"
      allow="clipboard-write; clipboard-read"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    ></iframe>
  </section>
</div>
`,G=`#prom-ai-overlay-root {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: fixed;
  inset: 0;
  display: none;
  z-index: 2147483000;
}

#prom-ai-overlay-root.prom-ai-visible {
  display: block;
}

.prom-ai-overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(12, 18, 28, 0.55);
  backdrop-filter: blur(2px);
}

.prom-ai-overlay-panel {
  position: absolute;
  top: 5%;
  right: 3%;
  width: min(90vw, var(--prom-ai-overlay-width, 420px));
  min-height: var(--prom-ai-overlay-min-height, 480px);
  max-height: 90vh;
  background: #1f2430;
  border-radius: 8px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.prom-ai-overlay-header {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  color: #f7f8fa;
}

.prom-ai-overlay-close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
}

.prom-ai-overlay-body {
  flex: 1;
  position: relative;
}

.prom-ai-overlay-body iframe {
  border: none;
  height: 100%;
  width: 100%;
}
`;class J{constructor(e){this.callbacks=e,this.root=null,this.iframe=null,this.visible=!1,this.pendingContext=null,this.iframeUrl=v,this.allowedOrigin=S,this.autoClose=I}open(e){this.ensureOverlay(),this.pendingContext=e,this.visible=!0,this.root?.classList.add("prom-ai-visible"),this.postContext()}close(){this.visible=!1,this.root?.classList.remove("prom-ai-visible"),this.callbacks.onClose?.()}isOpen(){return this.visible}handleAssistantMessage(e){if(e.origin!==this.allowedOrigin)return;const n=e.data;if(!(!n||typeof n!="object")&&n.type==="promql_suggestion"&&typeof n.query=="string"){const r=typeof n.editorId=="string"?n.editorId:this.pendingContext?.editorId;if(!r)return;this.callbacks.onSuggestion({editorId:r,query:n.query}),this.autoClose&&this.close()}}ensureOverlay(){if(this.root)return;K();const e=document.createElement("div");e.id="prom-ai-overlay-root",e.style.zIndex=String(d.zIndex),e.style.setProperty("--prom-ai-overlay-width",`${d.width}px`),e.style.setProperty("--prom-ai-overlay-min-height",`${d.minHeight}px`),e.innerHTML=F;const n=e.querySelector("#prom-ai-overlay-title");n&&(n.textContent=k.title);const r=e.querySelector('iframe[data-role="assistant-frame"]');r&&(r.title=L,r.src=this.iframeUrl,r.addEventListener("load",()=>this.postContext())),e.querySelector('button[data-role="overlay-close"]')?.addEventListener("click",()=>this.close()),e.querySelector('[data-role="overlay-backdrop"]')?.addEventListener("click",()=>this.close()),document.addEventListener("keydown",w=>{w.key==="Escape"&&this.visible&&this.close()}),document.body.appendChild(e),this.root=e,this.iframe=r??null}postContext(){if(!this.pendingContext||!this.iframe?.contentWindow)return;const e={type:"promql_context",...this.pendingContext};this.iframe.contentWindow.postMessage(e,this.allowedOrigin)}}let b=!1;function K(){if(b)return;const t=document.createElement("style");t.id="prom-ai-overlay-styles",t.textContent=G,document.head.appendChild(t),b=!0}const u=new D,E=new J({onSuggestion:({editorId:t,query:e})=>{const n=u.getById(t);if(!n)return;n.setQuery(e)&&n.runQuery()}});function g(){C();const t=new MutationObserver(()=>c()),e=document.body??document.documentElement;t.observe(e,{childList:!0,subtree:!0}),window.addEventListener("message",n=>E.handleAssistantMessage(n)),window.addEventListener("popstate",()=>c()),window.addEventListener("hashchange",()=>c())}function C(){const t=T(),e=new Set;t.forEach(n=>{const r=u.upsert(n);e.add(r.id),Y(r,X)}),u.dropMissing(e)}function X(t){E.open({editorId:t.id,currentQuery:t.getQuery(),datasource:t.datasource})}let l=!1;function c(){l||(l=!0,queueMicrotask(()=>{l=!1,C()}))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g,{once:!0}):g();
