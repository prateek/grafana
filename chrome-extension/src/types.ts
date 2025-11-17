/**
 * Type definitions for the Grafana PromQL AI Assistant extension
 */

/**
 * Represents a detected Prometheus query editor in the Grafana UI
 */
export interface EditorContext {
  /**
   * Unique identifier for this editor instance
   */
  id: string;

  /**
   * Root HTML element of the query editor
   */
  rootElement: HTMLElement;

  /**
   * The query input element (Monaco, CodeMirror, or textarea)
   */
  queryInputElement: HTMLElement;

  /**
   * Type of editor detected
   */
  editorType: 'monaco' | 'codemirror' | 'textarea';

  /**
   * Get the current query text from the editor
   */
  getQuery: () => string;

  /**
   * Set the query text in the editor
   */
  setQuery: (query: string) => void;

  /**
   * Reference to the injected AI assistant button (if any)
   */
  assistantButton?: HTMLButtonElement;
}

/**
 * Message types for postMessage communication
 */
export enum MessageType {
  /**
   * Sent from content script to iframe with context about the current editor
   */
  PROMQL_CONTEXT = 'promql_context',

  /**
   * Sent from iframe to content script with a suggested query
   */
  PROMQL_SUGGESTION = 'promql_suggestion',

  /**
   * Sent from iframe to request closing the overlay
   */
  CLOSE_OVERLAY = 'close_overlay',
}

/**
 * Message sent from content script to iframe with editor context
 */
export interface PromQLContextMessage {
  type: MessageType.PROMQL_CONTEXT;
  editorId: string;
  currentQuery: string;
  datasource: 'prometheus';
  timestamp: number;
}

/**
 * Message sent from iframe to content script with query suggestion
 */
export interface PromQLSuggestionMessage {
  type: MessageType.PROMQL_SUGGESTION;
  editorId: string;
  query: string;
  timestamp: number;
}

/**
 * Message sent from iframe to request overlay closure
 */
export interface CloseOverlayMessage {
  type: MessageType.CLOSE_OVERLAY;
  timestamp: number;
}

/**
 * Union type of all possible messages
 */
export type ExtensionMessage =
  | PromQLContextMessage
  | PromQLSuggestionMessage
  | CloseOverlayMessage;

/**
 * Registry of all detected editor instances
 */
export type EditorRegistry = Map<string, EditorContext>;
