/**
 * Type definitions for editor context and communication messages.
 */

/**
 * Context information about a detected Prometheus query editor.
 */
export interface EditorContext {
  /** Unique identifier for this editor instance */
  editorId: string;
  /** Root element of the query editor container */
  rootElement: HTMLElement;
  /** Function to get the current query text */
  getQuery: () => string;
  /** Function to set the query text */
  setQuery: (query: string) => void;
  /** Reference to the injected AI Assistant button */
  buttonElement?: HTMLButtonElement;
}

/**
 * Message sent from content script to iframe with editor context.
 */
export interface PromQLContextMessage {
  type: 'promql_context';
  editorId: string;
  currentQuery: string;
  datasource: 'prometheus';
}

/**
 * Message sent from iframe to content script with a query suggestion.
 */
export interface PromQLSuggestionMessage {
  type: 'promql_suggestion';
  editorId: string;
  query: string;
}

/**
 * Union type for all postMessage payloads.
 */
export type AssistantMessage = PromQLContextMessage | PromQLSuggestionMessage;

/**
 * Type guard to check if a message is a PromQL context message.
 */
export function isPromQLContextMessage(msg: unknown): msg is PromQLContextMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === 'promql_context'
  );
}

/**
 * Type guard to check if a message is a PromQL suggestion message.
 */
export function isPromQLSuggestionMessage(msg: unknown): msg is PromQLSuggestionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === 'promql_suggestion' &&
    'query' in msg &&
    typeof (msg as PromQLSuggestionMessage).query === 'string'
  );
}
