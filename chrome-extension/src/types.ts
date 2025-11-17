/**
 * Type definitions for the Grafana Prometheus AI Assistant extension
 */

/**
 * Represents a detected Prometheus query editor in the Grafana UI
 */
export interface EditorContext {
  /** Unique identifier for this editor instance */
  id: string;

  /** Root DOM element of the query editor container */
  rootElement: HTMLElement;

  /** The actual input element (textarea, Monaco, or CodeMirror) */
  queryInputElement: HTMLElement | null;

  /** Type of editor detected */
  editorType: EditorType;

  /** Reference to the injected AI Assistant button */
  injectedButton: HTMLElement | null;

  /** Get the current query text from the editor */
  getQuery: () => string;

  /** Set the query text in the editor */
  setQuery: (query: string) => void;

  /** Trigger a query refresh in Grafana (if possible) */
  triggerRefresh?: () => void;
}

/**
 * Types of query editors we support
 */
export type EditorType = 'monaco' | 'codemirror' | 'textarea' | 'unknown';

/**
 * Editor detection result
 */
export interface DetectionResult {
  /** Whether a Prometheus editor was found */
  found: boolean;

  /** The editor container element */
  container: HTMLElement | null;

  /** The query input element */
  queryInput: HTMLElement | null;

  /** Detected editor type */
  editorType: EditorType;

  /** Toolbar element where button should be injected */
  toolbar: HTMLElement | null;
}

/**
 * Message types for communication between content script and iframe
 */
export type MessageType = 'promql_context' | 'promql_suggestion';

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

/**
 * Message sent from content script to iframe with current editor context
 */
export interface PromQLContextMessage extends BaseMessage {
  type: 'promql_context';
  payload: {
    /** Unique identifier of the editor */
    editorId: string;
    /** Current query text (if any) */
    currentQuery: string;
    /** Datasource type (always "prometheus" for now) */
    datasource: string;
  };
}

/**
 * Message sent from iframe to content script with a suggested query
 */
export interface PromQLSuggestionMessage extends BaseMessage {
  type: 'promql_suggestion';
  payload: {
    /** Target editor ID */
    editorId: string;
    /** The suggested PromQL query to insert */
    query: string;
  };
}

/**
 * Union of all message types
 */
export type ExtensionMessage = PromQLContextMessage | PromQLSuggestionMessage;

/**
 * Monaco Editor interface (simplified)
 * We only define what we need to avoid full Monaco types dependency
 */
export interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  trigger(source: string, handlerId: string, payload?: unknown): void;
  focus(): void;
}

/**
 * CodeMirror interface (simplified)
 */
export interface CodeMirrorInstance {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  refresh(): void;
}

/**
 * Window extensions for global editor instances
 */
declare global {
  interface Window {
    monaco?: {
      editor: {
        getEditors(): MonacoEditor[];
      };
    };
  }

  interface HTMLElement {
    CodeMirror?: CodeMirrorInstance;
  }
}

/**
 * Registry of all detected editors
 */
export type EditorRegistry = Map<string, EditorContext>;

/**
 * Overlay state
 */
export interface OverlayState {
  /** Whether the overlay is currently visible */
  isVisible: boolean;
  /** Currently active editor ID */
  activeEditorId: string | null;
  /** Reference to the overlay root element */
  overlayElement: HTMLElement | null;
  /** Reference to the iframe element */
  iframeElement: HTMLIFrameElement | null;
}
