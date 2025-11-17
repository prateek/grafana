import type { EditorDetectionResult } from '../types';

export interface RegisteredEditor extends EditorDetectionResult {
  button?: HTMLButtonElement | null;
}

export class EditorRegistry {
  private readonly editors = new Map<string, RegisteredEditor>();

  upsert(context: EditorDetectionResult): RegisteredEditor {
    const existing = this.editors.get(context.id);
    if (existing) {
      Object.assign(existing, context);
      return existing;
    }

    const entry: RegisteredEditor = { ...context };
    this.editors.set(entry.id, entry);
    return entry;
  }

  getById(id: string): RegisteredEditor | undefined {
    return this.editors.get(id);
  }

  values(): RegisteredEditor[] {
    return Array.from(this.editors.values());
  }

  dropMissing(validIds: Set<string>): void {
    for (const [id, editor] of this.editors.entries()) {
      const stillInDom = document.contains(editor.root);
      if (!validIds.has(id) || !stillInDom) {
        editor.button?.remove?.();
        this.editors.delete(id);
      }
    }
  }
}
