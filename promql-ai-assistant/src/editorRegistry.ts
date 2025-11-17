import type { PromEditorDetectionResult } from './types/editor';

export interface TrackedEditor {
  context: PromEditorDetectionResult;
  button?: HTMLButtonElement;
}

export class EditorRegistry {
  private editors = new Map<string, TrackedEditor>();
  private elementToId = new WeakMap<HTMLElement, string>();

  upsert(context: PromEditorDetectionResult): TrackedEditor {
    const existing = this.editors.get(context.id);
    if (existing) {
      existing.context = context;
      this.elementToId.set(context.root, context.id);
      return existing;
    }
    const tracked: TrackedEditor = { context };
    this.editors.set(context.id, tracked);
    this.elementToId.set(context.root, context.id);
    return tracked;
  }

  getContext(id: string): PromEditorDetectionResult | undefined {
    return this.editors.get(id)?.context;
  }

  setButton(id: string, button: HTMLButtonElement): void {
    const tracked = this.editors.get(id);
    if (!tracked) {
      throw new Error(`Editor ${id} is not registered.`);
    }
    tracked.button = button;
  }

  getButton(id: string): HTMLButtonElement | undefined {
    return this.editors.get(id)?.button;
  }

  forEach(callback: (tracked: TrackedEditor) => void): void {
    for (const tracked of this.editors.values()) {
      callback(tracked);
    }
  }

  cleanupRemoved(): void {
    for (const [id, tracked] of this.editors.entries()) {
      if (!document.body.contains(tracked.context.root)) {
        tracked.button?.remove();
        this.editors.delete(id);
      }
    }
  }

  hasElement(element: HTMLElement): boolean {
    const id = this.elementToId.get(element);
    return Boolean(id && this.editors.has(id));
  }
}
