/**
 * Tests for Editor Registry
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerEditor,
  unregisterEditor,
  getEditor,
  getAllEditors,
  hasEditor,
  clearRegistry,
  cleanupStaleEditors,
  findEditorByElement,
  getRegistryStats,
} from '../src/registry/editorRegistry';
import type { EditorContext } from '../src/types';

describe('Editor Registry', () => {
  beforeEach(() => {
    clearRegistry();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    clearRegistry();
    document.body.innerHTML = '';
  });

  function createMockEditor(id: string): EditorContext {
    const rootElement = document.createElement('div');
    rootElement.id = id;
    document.body.appendChild(rootElement);

    return {
      id,
      rootElement,
      queryInputElement: document.createElement('textarea'),
      editorType: 'textarea',
      injectedButton: null,
      getQuery: () => '',
      setQuery: () => {},
    };
  }

  it('should register an editor', () => {
    const editor = createMockEditor('test-editor-1');

    registerEditor(editor);

    expect(hasEditor('test-editor-1')).toBe(true);
    expect(getEditor('test-editor-1')).toBe(editor);
  });

  it('should not register duplicate editors', () => {
    const editor = createMockEditor('test-editor-1');

    registerEditor(editor);
    registerEditor(editor);

    const allEditors = getAllEditors();
    expect(allEditors).toHaveLength(1);
  });

  it('should unregister an editor', () => {
    const editor = createMockEditor('test-editor-1');

    registerEditor(editor);
    expect(hasEditor('test-editor-1')).toBe(true);

    unregisterEditor('test-editor-1');
    expect(hasEditor('test-editor-1')).toBe(false);
  });

  it('should get all registered editors', () => {
    const editor1 = createMockEditor('editor-1');
    const editor2 = createMockEditor('editor-2');
    const editor3 = createMockEditor('editor-3');

    registerEditor(editor1);
    registerEditor(editor2);
    registerEditor(editor3);

    const allEditors = getAllEditors();
    expect(allEditors).toHaveLength(3);
    expect(allEditors).toContain(editor1);
    expect(allEditors).toContain(editor2);
    expect(allEditors).toContain(editor3);
  });

  it('should clear all editors', () => {
    registerEditor(createMockEditor('editor-1'));
    registerEditor(createMockEditor('editor-2'));

    expect(getAllEditors()).toHaveLength(2);

    clearRegistry();

    expect(getAllEditors()).toHaveLength(0);
  });

  it('should find editor by element', () => {
    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const found = findEditorByElement(editor.rootElement);

    expect(found).toBe(editor);
  });

  it('should find editor by child element', () => {
    const editor = createMockEditor('test-editor');
    const childElement = document.createElement('span');
    editor.rootElement.appendChild(childElement);
    registerEditor(editor);

    const found = findEditorByElement(childElement);

    expect(found).toBe(editor);
  });

  it('should return null when editor not found by element', () => {
    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const randomElement = document.createElement('div');
    const found = findEditorByElement(randomElement);

    expect(found).toBeNull();
  });

  it('should cleanup stale editors', () => {
    const editor1 = createMockEditor('editor-1');
    const editor2 = createMockEditor('editor-2');
    const editor3 = createMockEditor('editor-3');

    registerEditor(editor1);
    registerEditor(editor2);
    registerEditor(editor3);

    expect(getAllEditors()).toHaveLength(3);

    // Remove editor2 from DOM
    editor2.rootElement.remove();

    const removedCount = cleanupStaleEditors();

    expect(removedCount).toBe(1);
    expect(getAllEditors()).toHaveLength(2);
    expect(hasEditor('editor-1')).toBe(true);
    expect(hasEditor('editor-2')).toBe(false);
    expect(hasEditor('editor-3')).toBe(true);
  });

  it('should not cleanup editors still in DOM', () => {
    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const removedCount = cleanupStaleEditors();

    expect(removedCount).toBe(0);
    expect(hasEditor('test-editor')).toBe(true);
  });

  it('should get registry statistics', () => {
    const editor1 = createMockEditor('editor-1');
    editor1.editorType = 'monaco';
    const editor2 = createMockEditor('editor-2');
    editor2.editorType = 'monaco';
    const editor3 = createMockEditor('editor-3');
    editor3.editorType = 'codemirror';
    editor1.injectedButton = document.createElement('button');

    registerEditor(editor1);
    registerEditor(editor2);
    registerEditor(editor3);

    const stats = getRegistryStats();

    expect(stats.totalEditors).toBe(3);
    expect(stats.editorTypes.monaco).toBe(2);
    expect(stats.editorTypes.codemirror).toBe(1);
    expect(stats.editorsWithButtons).toBe(1);
  });

  it('should handle empty registry stats', () => {
    const stats = getRegistryStats();

    expect(stats.totalEditors).toBe(0);
    expect(stats.editorTypes).toEqual({});
    expect(stats.editorsWithButtons).toBe(0);
  });
});
