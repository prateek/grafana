/**
 * Tests for promEditorDetector module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { findEditors, findToolbarForEditor } from '../promEditorDetector';

describe('promEditorDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('findEditors', () => {
    it('should return empty array when no editors exist', () => {
      const editors = findEditors();
      expect(editors).toEqual([]);
    });

    it('should detect a basic Prometheus editor with textarea', () => {
      // Create a mock Prometheus editor
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row">
          <label>Prometheus</label>
          <textarea placeholder="Enter a PromQL query"></textarea>
        </div>
      `;

      const editors = findEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0].id).toBeTruthy();
      expect(editors[0].rootElement).toBeInstanceOf(HTMLElement);
      expect(editors[0].queryInputElement).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should detect multiple Prometheus editors', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="1">
          <label>Prometheus</label>
          <textarea placeholder="Enter a PromQL query"></textarea>
        </div>
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="2">
          <label>Prometheus</label>
          <textarea placeholder="Enter a PromQL query"></textarea>
        </div>
      `;

      const editors = findEditors();
      expect(editors).toHaveLength(2);
      expect(editors[0].id).not.toBe(editors[1].id);
    });

    it('should not detect non-Prometheus editors', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row">
          <label>MySQL</label>
          <textarea placeholder="Enter a SQL query"></textarea>
        </div>
      `;

      const editors = findEditors();
      expect(editors).toHaveLength(0);
    });

    it('should detect editor with data-testid containing prometheus', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="prometheus-query-editor">
          <div>Prometheus</div>
          <textarea></textarea>
        </div>
      `;

      const editors = findEditors();
      expect(editors).toHaveLength(1);
    });

    it('should provide working getQuery and setQuery methods', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row">
          <label>Prometheus</label>
          <textarea placeholder="Enter a PromQL query">initial query</textarea>
        </div>
      `;

      const editors = findEditors();
      const editor = editors[0];

      // Test getQuery
      expect(editor.getQuery()).toBe('initial query');

      // Test setQuery
      editor.setQuery('up{job="test"}');
      const textarea = editor.queryInputElement as HTMLTextAreaElement;
      expect(textarea.value).toBe('up{job="test"}');
      expect(editor.getQuery()).toBe('up{job="test"}');
    });

    it('should generate unique IDs based on data-panelid', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-panelid="panel-123">
          <label>Prometheus</label>
          <textarea></textarea>
        </div>
      `;

      const editors = findEditors();
      expect(editors[0].id).toContain('panel-123');
    });
  });

  describe('findToolbarForEditor', () => {
    it('should find toolbar using configured selectors', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions" data-testid="query-editor-row-actions">
            <button>Run Query</button>
          </div>
        </div>
      `;

      const editors = findEditors();
      const toolbar = findToolbarForEditor(editors[0]);

      expect(toolbar).toBeTruthy();
      expect(toolbar?.className).toContain('actions');
    });

    it('should fallback to root element if no toolbar found', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row">
          <label>Prometheus</label>
          <textarea></textarea>
        </div>
      `;

      const editors = findEditors();
      const toolbar = findToolbarForEditor(editors[0]);

      expect(toolbar).toBe(editors[0].rootElement);
    });
  });

  describe('setQuery with event dispatching', () => {
    it('should dispatch input and change events when setting query', () => {
      document.body.innerHTML = `
        <div class="query-editor-row">
          <label>Prometheus</label>
          <textarea></textarea>
        </div>
      `;

      const editors = findEditors();
      const textarea = editors[0].queryInputElement as HTMLTextAreaElement;

      let inputFired = false;
      let changeFired = false;

      textarea.addEventListener('input', () => {
        inputFired = true;
      });
      textarea.addEventListener('change', () => {
        changeFired = true;
      });

      editors[0].setQuery('test query');

      expect(inputFired).toBe(true);
      expect(changeFired).toBe(true);
    });
  });
});
