/**
 * Tests for Prometheus Editor Detector
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findPromEditors, setQueryText } from '../src/promEditorDetector';

describe('promEditorDetector', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('findPromEditors', () => {
    it('should return empty array when no editors present', () => {
      const editors = findPromEditors();
      expect(editors).toEqual([]);
    });

    it('should detect a Prometheus editor with data-testid', () => {
      // Create a mock Prometheus editor
      document.body.innerHTML = `
        <div data-testid="query-editor-row" data-ds-type="prometheus">
          <textarea placeholder="Enter a query"></textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0].id).toBeTruthy();
      expect(editors[0].editorType).toBe('textarea');
    });

    it('should detect a Prometheus editor with class name', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <textarea class="gf-form-input"></textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);
    });

    it('should detect multiple Prometheus editors', () => {
      document.body.innerHTML = `
        <div data-testid="query-editor-row" data-ds-type="prometheus" data-panelid="1">
          <textarea></textarea>
        </div>
        <div data-testid="query-editor-row" data-ds-type="prometheus" data-panelid="2">
          <textarea></textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(2);
      expect(editors[0].id).not.toBe(editors[1].id);
    });

    it('should detect Monaco editor type', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <div class="monaco-editor">
            <textarea></textarea>
          </div>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0].editorType).toBe('monaco');
    });

    it('should detect CodeMirror editor type', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <div class="CodeMirror">
            <textarea></textarea>
          </div>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0].editorType).toBe('codemirror');
    });

    it('should not detect non-Prometheus editors', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="influxdb">
          <textarea></textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(0);
    });

    it('should generate unique IDs based on panel ID', () => {
      document.body.innerHTML = `
        <div data-panelid="panel-123">
          <div class="query-editor-row" data-ds-type="prometheus">
            <textarea></textarea>
          </div>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0].id).toContain('panel-123');
    });
  });

  describe('getQuery and setQuery', () => {
    it('should get and set query text in a textarea editor', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <textarea id="query-input">rate(http_requests_total[5m])</textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors).toHaveLength(1);

      const currentQuery = editors[0].getQuery();
      expect(currentQuery).toBe('rate(http_requests_total[5m])');

      editors[0].setQuery('sum(rate(http_requests_total[5m]))');

      const textarea = document.querySelector('#query-input') as HTMLTextAreaElement;
      expect(textarea.value).toBe('sum(rate(http_requests_total[5m]))');
    });

    it('should handle empty query text', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <textarea></textarea>
        </div>
      `;

      const editors = findPromEditors();
      expect(editors[0].getQuery()).toBe('');
    });

    it('should dispatch events when setting query', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-ds-type="prometheus">
          <textarea id="query-input"></textarea>
        </div>
      `;

      const textarea = document.querySelector('#query-input') as HTMLTextAreaElement;
      let inputFired = false;
      let changeFired = false;

      textarea.addEventListener('input', () => {
        inputFired = true;
      });
      textarea.addEventListener('change', () => {
        changeFired = true;
      });

      const editors = findPromEditors();
      editors[0].setQuery('test query');

      expect(inputFired).toBe(true);
      expect(changeFired).toBe(true);
    });
  });

  describe('setQueryText function', () => {
    it('should set query text using the exported function', () => {
      document.body.innerHTML = `
        <div>
          <textarea id="test-textarea">old query</textarea>
        </div>
      `;

      const element = document.querySelector('#test-textarea') as HTMLElement;
      setQueryText(element, 'textarea', 'new query');

      const textarea = element as HTMLTextAreaElement;
      expect(textarea.value).toBe('new query');
    });

    it('should handle Monaco editor elements', () => {
      document.body.innerHTML = `
        <div class="monaco-editor">
          <textarea id="monaco-textarea"></textarea>
        </div>
      `;

      const element = document.querySelector('.monaco-editor') as HTMLElement;
      setQueryText(element, 'monaco', 'monaco query');

      const textarea = document.querySelector('#monaco-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('monaco query');
    });
  });
});
