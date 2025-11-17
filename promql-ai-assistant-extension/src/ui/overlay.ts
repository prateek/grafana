type PromqlContextMessage = {
  type: 'promql_context';
  editorId: string;
  currentQuery: string;
  datasource: string;
};

type PromqlSuggestionMessage = {
  type: 'promql_suggestion';
  editorId: string;
  query: string;
};

const contextElement = document.getElementById('context');
const textarea = document.getElementById('query-input') as HTMLTextAreaElement | null;
const sendButton = document.getElementById('send-query');
const parentOrigin = (() => {
  try {
    return document.referrer ? new URL(document.referrer).origin : '*';
  } catch {
    return '*';
  }
})();

let latestContext: PromqlContextMessage | null = null;

function updateContextUI(message: PromqlContextMessage) {
  latestContext = message;
  if (contextElement) {
    contextElement.textContent = `Editor: ${message.editorId} | Datasource: ${message.datasource}`;
  }
  if (textarea && !textarea.value) {
    textarea.value = message.currentQuery ?? '';
  }
}

function handleIncomingMessages(event: MessageEvent) {
  const data = event.data as PromqlContextMessage | undefined;
  if (!data || data.type !== 'promql_context') {
    return;
  }
  updateContextUI(data);
}

function sendSuggestion() {
  if (!latestContext || !textarea) {
    return;
  }
  const query = textarea.value.trim();
  if (!query) {
    return;
  }

  const message: PromqlSuggestionMessage = {
    type: 'promql_suggestion',
    editorId: latestContext.editorId,
    query,
  };
  window.parent?.postMessage(message, parentOrigin);
}

window.addEventListener('message', handleIncomingMessages);
sendButton?.addEventListener('click', sendSuggestion);

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'promql_iframe_ready' }, parentOrigin);
}
