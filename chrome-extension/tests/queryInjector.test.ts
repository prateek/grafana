/**
 * Tests for Query Injector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getQueryText, setQueryText } from '../src/query/queryInjector';

describe('Query Injector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Plain Textarea', () => {
    it('should get query text from textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'up{job="prometheus"}';
      document.body.appendChild(textarea);

      const query = getQueryText(textarea, 'textarea');

      expect(query).toBe('up{job="prometheus"}');
    });

    it('should set query text in textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      setQueryText(textarea, 'textarea', 'rate(http_requests_total[5m])');

      expect(textarea.value).toBe('rate(http_requests_total[5m])');
    });

    it('should dispatch input events when setting query', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const inputSpy = vi.fn();
      const changeSpy = vi.fn();
      textarea.addEventListener('input', inputSpy);
      textarea.addEventListener('change', changeSpy);

      setQueryText(textarea, 'textarea', 'test_query');

      expect(inputSpy).toHaveBeenCalled();
      expect(changeSpy).toHaveBeenCalled();
    });

    it('should handle contenteditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.textContent = 'initial query';
      document.body.appendChild(div);

      const query = getQueryText(div, 'textarea');
      expect(query).toBe('initial query');

      setQueryText(div, 'textarea', 'new query');
      expect(div.textContent).toBe('new query');
    });
  });

  describe('Monaco Editor', () => {
    it('should get query from Monaco textarea fallback', () => {
      document.body.innerHTML = `
        <div class="monaco-editor">
          <textarea>prometheus_http_requests_total</textarea>
        </div>
      `;

      const textarea = document.querySelector('textarea') as HTMLElement;
      const query = getQueryText(textarea, 'monaco');

      expect(query).toBe('prometheus_http_requests_total');
    });

    it('should set query in Monaco textarea fallback', () => {
      document.body.innerHTML = `
        <div class="monaco-editor">
          <textarea></textarea>
        </div>
      `;

      const textarea = document.querySelector('textarea') as HTMLElement;
      setQueryText(textarea, 'monaco', 'node_cpu_seconds_total');

      expect((textarea as HTMLTextAreaElement).value).toBe('node_cpu_seconds_total');
    });

    it('should use Monaco API if available', () => {
      const mockEditor = {
        getValue: vi.fn(() => 'current query'),
        setValue: vi.fn(),
        focus: vi.fn(),
        trigger: vi.fn(),
      };

      // Mock window.monaco
      (window as any).monaco = {
        editor: {
          getEditors: () => [mockEditor],
        },
      };

      const container = document.createElement('div');
      container.className = 'monaco-editor';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);

      // Mock getDomNode
      (mockEditor as any).getDomNode = () => container;

      const query = getQueryText(textarea, 'monaco');
      expect(query).toBe('current query');
      expect(mockEditor.getValue).toHaveBeenCalled();

      setQueryText(textarea, 'monaco', 'new query');
      expect(mockEditor.setValue).toHaveBeenCalledWith('new query');
      expect(mockEditor.focus).toHaveBeenCalled();

      // Cleanup
      delete (window as any).monaco;
    });
  });

  describe('CodeMirror Editor', () => {
    it('should get query from CodeMirror textarea fallback', () => {
      document.body.innerHTML = `
        <div class="CodeMirror">
          <textarea>sum(rate(metric[5m]))</textarea>
        </div>
      `;

      const textarea = document.querySelector('textarea') as HTMLElement;
      const query = getQueryText(textarea, 'codemirror');

      expect(query).toBe('sum(rate(metric[5m]))');
    });

    it('should set query in CodeMirror textarea fallback', () => {
      document.body.innerHTML = `
        <div class="CodeMirror">
          <textarea></textarea>
        </div>
      `;

      const textarea = document.querySelector('textarea') as HTMLElement;
      setQueryText(textarea, 'codemirror', 'avg(temperature)');

      expect((textarea as HTMLTextAreaElement).value).toBe('avg(temperature)');
    });

    it('should use CodeMirror API if available', () => {
      const container = document.createElement('div');
      container.className = 'CodeMirror';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);

      const mockCodeMirror = {
        getValue: vi.fn(() => 'existing query'),
        setValue: vi.fn(),
        focus: vi.fn(),
        refresh: vi.fn(),
      };

      (container as any).CodeMirror = mockCodeMirror;

      const query = getQueryText(textarea, 'codemirror');
      expect(query).toBe('existing query');
      expect(mockCodeMirror.getValue).toHaveBeenCalled();

      setQueryText(textarea, 'codemirror', 'updated query');
      expect(mockCodeMirror.setValue).toHaveBeenCalledWith('updated query');
      expect(mockCodeMirror.focus).toHaveBeenCalled();
      expect(mockCodeMirror.refresh).toHaveBeenCalled();
    });
  });

  describe('Unknown Editor Type', () => {
    it('should fall back to textarea handling for unknown types', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'fallback query';
      document.body.appendChild(textarea);

      const query = getQueryText(textarea, 'unknown');
      expect(query).toBe('fallback query');

      setQueryText(textarea, 'unknown', 'new fallback query');
      expect(textarea.value).toBe('new fallback query');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when getting query', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Should not throw, just return empty string
      expect(() => {
        const query = getQueryText(div, 'textarea');
        expect(query).toBe('');
      }).not.toThrow();
    });

    it('should handle errors gracefully when setting query', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Should not throw
      expect(() => {
        setQueryText(div, 'textarea', 'test');
      }).not.toThrow();
    });
  });
});
