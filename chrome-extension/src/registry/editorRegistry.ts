/**
 * Editor Registry
 *
 * Maintains a registry of all detected Prometheus query editors.
 * Handles adding, removing, and retrieving editor contexts.
 */

import { logger } from '@/config';
import type { EditorContext, EditorRegistry } from '@/types';

/**
 * Global registry of editors
 */
const registry: EditorRegistry = new Map();

/**
 * Add an editor to the registry
 */
export function registerEditor(editor: EditorContext): void {
  if (registry.has(editor.id)) {
    logger.warn(`Editor ${editor.id} is already registered`);
    return;
  }

  registry.set(editor.id, editor);
  logger.log(`Registered editor: ${editor.id} (type: ${editor.editorType})`);
}

/**
 * Remove an editor from the registry
 */
export function unregisterEditor(editorId: string): void {
  if (!registry.has(editorId)) {
    logger.warn(`Cannot unregister: editor ${editorId} not found`);
    return;
  }

  registry.delete(editorId);
  logger.log(`Unregistered editor: ${editorId}`);
}

/**
 * Get an editor by ID
 */
export function getEditor(editorId: string): EditorContext | null {
  return registry.get(editorId) || null;
}

/**
 * Get all registered editors
 */
export function getAllEditors(): EditorContext[] {
  return Array.from(registry.values());
}

/**
 * Check if an editor is registered
 */
export function hasEditor(editorId: string): boolean {
  return registry.has(editorId);
}

/**
 * Clear all editors from the registry
 */
export function clearRegistry(): void {
  const count = registry.size;
  registry.clear();
  logger.log(`Cleared registry: removed ${count} editors`);
}

/**
 * Clean up editors that are no longer in the DOM
 * Returns the number of editors removed
 */
export function cleanupStaleEditors(): number {
  const staleIds: string[] = [];

  for (const [id, editor] of registry.entries()) {
    // Check if the root element is still in the document
    if (!document.body.contains(editor.rootElement)) {
      staleIds.push(id);
    }
  }

  for (const id of staleIds) {
    unregisterEditor(id);
  }

  if (staleIds.length > 0) {
    logger.log(`Cleaned up ${staleIds.length} stale editors`);
  }

  return staleIds.length;
}

/**
 * Find an editor by its root element
 */
export function findEditorByElement(element: HTMLElement): EditorContext | null {
  for (const editor of registry.values()) {
    if (editor.rootElement === element || editor.rootElement.contains(element)) {
      return editor;
    }
  }
  return null;
}

/**
 * Get registry statistics for debugging
 */
export function getRegistryStats() {
  return {
    totalEditors: registry.size,
    editorTypes: getAllEditors().reduce(
      (acc, editor) => {
        acc[editor.editorType] = (acc[editor.editorType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    editorsWithButtons: getAllEditors().filter((e) => e.injectedButton !== null).length,
  };
}
