import { EditorContext } from './promEditorDetector';

export type RegisteredEditor = {
  context: EditorContext;
  button?: HTMLButtonElement;
};

export class EditorRegistry {
  private editors = new Map<string, RegisteredEditor>();

  upsert(
    context: EditorContext,
    handlers: {
      onCreate?: (entry: RegisteredEditor) => void;
      onUpdate?: (entry: RegisteredEditor) => void;
    } = {},
  ) {
    const existing = this.editors.get(context.id);
    if (existing) {
      existing.context = context;
      handlers.onUpdate?.(existing);
      return existing;
    }
    const entry: RegisteredEditor = { context };
    this.editors.set(context.id, entry);
    handlers.onCreate?.(entry);
    return entry;
  }

  remove(id: string, onRemove?: (entry: RegisteredEditor) => void) {
    const entry = this.editors.get(id);
    if (!entry) {
      return;
    }
    onRemove?.(entry);
    this.editors.delete(id);
  }

  pruneUnused(predicate: (entry: RegisteredEditor) => boolean, onRemove?: (entry: RegisteredEditor) => void) {
    for (const [id, entry] of this.editors.entries()) {
      if (!predicate(entry)) {
        this.remove(id, onRemove);
      }
    }
  }

  get(id: string) {
    return this.editors.get(id);
  }

  list() {
    return Array.from(this.editors.values());
  }
}
