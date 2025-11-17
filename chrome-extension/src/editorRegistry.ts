/**
 * Editor Registry
 *
 * Manages the registry of all detected Prometheus query editors.
 * Provides methods to add, remove, and retrieve editor contexts.
 */

import type { EditorContext, EditorRegistry } from './types';
import { debugLog } from './config';

/**
 * Global registry of editor instances
 */
const registry: EditorRegistry = new Map();

/**
 * Add an editor to the registry
 * @param editor The editor context to add
 */
export function registerEditor(editor: EditorContext): void {
  if (registry.has(editor.id)) {
    debugLog('Editor already registered:', editor.id);
    return;
  }

  registry.set(editor.id, editor);
  debugLog('Registered editor:', editor.id);
}

/**
 * Remove an editor from the registry
 * @param editorId The ID of the editor to remove
 */
export function unregisterEditor(editorId: string): void {
  const editor = registry.get(editorId);
  if (editor) {
    // Clean up the button if it exists
    if (editor.assistantButton) {
      editor.assistantButton.remove();
    }
    registry.delete(editorId);
    debugLog('Unregistered editor:', editorId);
  }
}

/**
 * Get an editor from the registry
 * @param editorId The ID of the editor to retrieve
 * @returns The editor context, or undefined if not found
 */
export function getEditor(editorId: string): EditorContext | undefined {
  return registry.get(editorId);
}

/**
 * Get all registered editors
 * @returns Array of all editor contexts
 */
export function getAllEditors(): EditorContext[] {
  return Array.from(registry.values());
}

/**
 * Check if an editor is registered
 * @param editorId The ID to check
 * @returns True if the editor is registered
 */
export function hasEditor(editorId: string): boolean {
  return registry.has(editorId);
}

/**
 * Clear all editors from the registry
 * Useful for cleanup or testing
 */
export function clearRegistry(): void {
  registry.forEach((editor) => {
    if (editor.assistantButton) {
      editor.assistantButton.remove();
    }
  });
  registry.clear();
  debugLog('Cleared editor registry');
}

/**
 * Clean up stale editors that are no longer in the DOM
 * Should be called periodically or when DOM changes are detected
 */
export function cleanupStaleEditors(): void {
  const staleIds: string[] = [];

  registry.forEach((editor, id) => {
    // Check if the root element is still in the document
    if (!document.body.contains(editor.rootElement)) {
      staleIds.push(id);
    }
  });

  staleIds.forEach((id) => unregisterEditor(id));

  if (staleIds.length > 0) {
    debugLog('Cleaned up stale editors:', staleIds.length);
  }
}
