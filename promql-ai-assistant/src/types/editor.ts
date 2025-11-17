export interface EditorContext {
  id: string;
  root: HTMLElement;
  toolbar: HTMLElement;
  datasource?: string;
  getQuery: () => string;
  setQuery: (value: string) => void;
  runQuery?: () => void;
}

export interface PromEditorDetectionResult extends EditorContext {
  queryInput?: HTMLTextAreaElement | HTMLInputElement | HTMLElement;
}
