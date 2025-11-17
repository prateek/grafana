/**
 * Type definitions for the extension
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
  /** Reference to the injected button element */
  buttonElement?: HTMLButtonElement;
  /** Panel ID if available */
  panelId?: string;
}

export interface PromqlContextMessage {
  type: 'promql_context';
  editorId: string;
  currentQuery: string;
  datasource: 'prometheus';
}

export interface PromqlSuggestionMessage {
  type: 'promql_suggestion';
  editorId: string;
  query: string;
}

export type ExtensionMessage = PromqlContextMessage | PromqlSuggestionMessage;
