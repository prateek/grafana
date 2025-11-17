/**
 * Registry for managing detected Prometheus query editor instances.
 * Handles tracking, cleanup, and retrieval of editor contexts.
 */

import type { EditorContext } from './types';

/**
 * Registry that maps editor IDs to their contexts.
 */
class EditorRegistry {
  private editors = new Map<string, EditorContext>();

  /**
   * Registers a new editor context.
   */
  register(context: EditorContext): void {
    this.editors.set(context.editorId, context);
  }

  /**
   * Unregisters an editor by ID.
   */
  unregister(editorId: string): void {
    this.editors.delete(editorId);
  }

  /**
   * Gets an editor context by ID.
   */
  get(editorId: string): EditorContext | undefined {
    return this.editors.get(editorId);
  }

  /**
   * Gets all registered editor contexts.
   */
  getAll(): EditorContext[] {
    return Array.from(this.editors.values());
  }

  /**
   * Checks if an editor is registered.
   */
  has(editorId: string): boolean {
    return this.editors.has(editorId);
  }

  /**
   * Clears all registered editors.
   */
  clear(): void {
    this.editors.clear();
  }

  /**
   * Removes editors whose root elements are no longer in the DOM.
   */
  cleanup(): void {
    const toRemove: string[] = [];

    for (const [editorId, context] of this.editors.entries()) {
      if (!document.body.contains(context.rootElement)) {
        toRemove.push(editorId);
      }
    }

    for (const editorId of toRemove) {
      this.unregister(editorId);
    }
  }

  /**
   * Gets the number of registered editors.
   */
  size(): number {
    return this.editors.size;
  }
}

// Singleton instance
export const editorRegistry = new EditorRegistry();
