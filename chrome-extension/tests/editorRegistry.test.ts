/**
 * Tests for Editor Registry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerEditor,
  unregisterEditor,
  getEditor,
  getAllEditors,
  hasEditor,
  clearRegistry,
  cleanupStaleEditors,
} from '../src/editorRegistry';
import type { EditorContext } from '../src/types';

describe('editorRegistry', () => {
  let mockEditor1: EditorContext;
  let mockEditor2: EditorContext;

  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();

    // Clear DOM
    document.body.innerHTML = '';

    // Create mock editors
    const element1 = document.createElement('div');
    element1.id = 'editor-1';
    document.body.appendChild(element1);

    const element2 = document.createElement('div');
    element2.id = 'editor-2';
    document.body.appendChild(element2);

    mockEditor1 = {
      id: 'test-editor-1',
      rootElement: element1,
      queryInputElement: element1,
      editorType: 'textarea',
      getQuery: vi.fn(),
      setQuery: vi.fn(),
    };

    mockEditor2 = {
      id: 'test-editor-2',
      rootElement: element2,
      queryInputElement: element2,
      editorType: 'monaco',
      getQuery: vi.fn(),
      setQuery: vi.fn(),
    };
  });

  afterEach(() => {
    clearRegistry();
    document.body.innerHTML = '';
  });

  describe('registerEditor', () => {
    it('should register an editor', () => {
      registerEditor(mockEditor1);
      expect(hasEditor('test-editor-1')).toBe(true);
    });

    it('should not register duplicate editors', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor1);

      const editors = getAllEditors();
      expect(editors).toHaveLength(1);
    });

    it('should register multiple different editors', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      expect(getAllEditors()).toHaveLength(2);
    });
  });

  describe('unregisterEditor', () => {
    it('should unregister an editor', () => {
      registerEditor(mockEditor1);
      expect(hasEditor('test-editor-1')).toBe(true);

      unregisterEditor('test-editor-1');
      expect(hasEditor('test-editor-1')).toBe(false);
    });

    it('should handle unregistering non-existent editor', () => {
      expect(() => {
        unregisterEditor('non-existent');
      }).not.toThrow();
    });

    it('should clean up button when unregistering', () => {
      const button = document.createElement('button');
      mockEditor1.assistantButton = button;
      document.body.appendChild(button);

      registerEditor(mockEditor1);
      unregisterEditor('test-editor-1');

      expect(document.body.contains(button)).toBe(false);
    });
  });

  describe('getEditor', () => {
    it('should retrieve a registered editor', () => {
      registerEditor(mockEditor1);
      const editor = getEditor('test-editor-1');

      expect(editor).toBe(mockEditor1);
    });

    it('should return undefined for non-existent editor', () => {
      const editor = getEditor('non-existent');
      expect(editor).toBeUndefined();
    });
  });

  describe('getAllEditors', () => {
    it('should return empty array when no editors registered', () => {
      expect(getAllEditors()).toEqual([]);
    });

    it('should return all registered editors', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      const editors = getAllEditors();
      expect(editors).toHaveLength(2);
      expect(editors).toContain(mockEditor1);
      expect(editors).toContain(mockEditor2);
    });
  });

  describe('hasEditor', () => {
    it('should return true for registered editor', () => {
      registerEditor(mockEditor1);
      expect(hasEditor('test-editor-1')).toBe(true);
    });

    it('should return false for non-registered editor', () => {
      expect(hasEditor('test-editor-1')).toBe(false);
    });
  });

  describe('clearRegistry', () => {
    it('should remove all editors', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      clearRegistry();

      expect(getAllEditors()).toEqual([]);
    });

    it('should clean up all buttons', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      mockEditor1.assistantButton = button1;
      mockEditor2.assistantButton = button2;

      document.body.appendChild(button1);
      document.body.appendChild(button2);

      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      clearRegistry();

      expect(document.body.contains(button1)).toBe(false);
      expect(document.body.contains(button2)).toBe(false);
    });
  });

  describe('cleanupStaleEditors', () => {
    it('should remove editors that are no longer in DOM', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      // Remove editor1's root element from DOM
      mockEditor1.rootElement.remove();

      cleanupStaleEditors();

      expect(hasEditor('test-editor-1')).toBe(false);
      expect(hasEditor('test-editor-2')).toBe(true);
    });

    it('should not remove editors still in DOM', () => {
      registerEditor(mockEditor1);
      registerEditor(mockEditor2);

      cleanupStaleEditors();

      expect(hasEditor('test-editor-1')).toBe(true);
      expect(hasEditor('test-editor-2')).toBe(true);
    });

    it('should handle empty registry', () => {
      expect(() => {
        cleanupStaleEditors();
      }).not.toThrow();
    });
  });
});
