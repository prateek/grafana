export interface EditorContext {
  id: string;
  datasource: 'prometheus';
  root: HTMLElement;
  getQuery(): string;
  setQuery(next: string): boolean;
  runQuery(): boolean;
}

export interface EditorDetectionResult extends EditorContext {
  buttonHost?: HTMLElement | null;
}
