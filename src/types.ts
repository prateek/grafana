/**
 * Type definitions for the extension
 */

/**
 * Represents a detected Prometheus query editor instance
 */
export interface EditorContext {
  /** Unique identifier for this editor (based on panel ID or generated) */
  id: string;

  /** The root container element of the query editor */
  rootElement: HTMLElement;

  /** The actual query input element (textarea, Monaco, CodeMirror) */
  queryInputElement: HTMLElement;

  /** Reference to the injected AI button */
  buttonElement?: HTMLButtonElement;

  /** Get the current query text */
  getQuery: () => string;

  /** Set the query text and trigger necessary events */
  setQuery: (query: string) => void;
}

/**
 * Message types for postMessage communication between content script and iframe
 */

export interface PromQLContextMessage {
  type: 'promql_context';
  editorId: string;
  currentQuery: string;
  datasource: 'prometheus';
}

export interface PromQLSuggestionMessage {
  type: 'promql_suggestion';
  editorId: string;
  query: string;
}

export type ExtensionMessage = PromQLContextMessage | PromQLSuggestionMessage;

/**
 * Type guard for PromQLSuggestionMessage
 */
export function isPromQLSuggestionMessage(msg: unknown): msg is PromQLSuggestionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === 'promql_suggestion' &&
    'editorId' in msg &&
    'query' in msg
  );
}

/**
 * Editor type detection
 */
export type EditorType = 'monaco' | 'codemirror' | 'textarea' | 'unknown';
