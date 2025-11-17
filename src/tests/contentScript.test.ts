/**
 * Tests for contentScript module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { editorRegistry, scanAndInjectButtons, handleQuerySuggestion } from '../contentScript';
import type { PromQLSuggestionMessage } from '../types';

describe('contentScript', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    editorRegistry.clear();
  });

  describe('scanAndInjectButtons', () => {
    it('should inject buttons for detected editors', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="test-1">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions" data-testid="query-editor-row-actions"></div>
        </div>
      `;

      scanAndInjectButtons();

      // Check that button was injected
      const button = document.querySelector('.prom-ai-assistant-button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('AI Assistant');
    });

    it('should not inject duplicate buttons', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="test-1">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions" data-testid="query-editor-row-actions"></div>
        </div>
      `;

      scanAndInjectButtons();
      const firstButtonCount = document.querySelectorAll('.prom-ai-assistant-button').length;

      scanAndInjectButtons();
      const secondButtonCount = document.querySelectorAll('.prom-ai-assistant-button').length;

      expect(firstButtonCount).toBe(1);
      expect(secondButtonCount).toBe(1);
    });

    it('should handle multiple editors independently', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="panel-1">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions" data-testid="query-editor-row-actions"></div>
        </div>
        <div class="query-editor-row" data-testid="query-editor-row" data-panelid="panel-2">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions" data-testid="query-editor-row-actions"></div>
        </div>
      `;

      scanAndInjectButtons();

      const buttons = document.querySelectorAll('.prom-ai-assistant-button');
      expect(buttons).toHaveLength(2);
      expect(editorRegistry.size).toBe(2);
    });

    it('should add editors to registry', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-panelid="test-panel">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions"></div>
        </div>
      `;

      scanAndInjectButtons();

      expect(editorRegistry.size).toBe(1);
      const editorId = Array.from(editorRegistry.keys())[0];
      expect(editorId).toContain('test-panel');
    });
  });

  describe('handleQuerySuggestion', () => {
    it('should update editor with suggested query', () => {
      document.body.innerHTML = `
        <div class="query-editor-row" data-panelid="test-panel">
          <label>Prometheus</label>
          <textarea>old query</textarea>
          <div class="query-editor-row__actions"></div>
        </div>
      `;

      scanAndInjectButtons();

      const editorId = Array.from(editorRegistry.keys())[0];
      const message: PromQLSuggestionMessage = {
        type: 'promql_suggestion',
        editorId,
        query: 'up{job="prometheus"}',
      };

      handleQuerySuggestion(message);

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('up{job="prometheus"}');
    });

    it('should handle suggestion for non-existent editor gracefully', () => {
      const message: PromQLSuggestionMessage = {
        type: 'promql_suggestion',
        editorId: 'non-existent-id',
        query: 'test query',
      };

      // Should not throw
      expect(() => handleQuerySuggestion(message)).not.toThrow();
    });
  });

  describe('registry cleanup', () => {
    it('should remove editors from registry when they are removed from DOM', () => {
      document.body.innerHTML = `
        <div id="container">
          <div class="query-editor-row" data-panelid="test-panel">
            <label>Prometheus</label>
            <textarea></textarea>
            <div class="query-editor-row__actions"></div>
          </div>
        </div>
      `;

      scanAndInjectButtons();
      expect(editorRegistry.size).toBe(1);

      // Remove the editor from DOM
      document.getElementById('container')!.innerHTML = '';

      // Scan again
      scanAndInjectButtons();

      // Registry should be empty now
      expect(editorRegistry.size).toBe(0);
    });
  });
});
