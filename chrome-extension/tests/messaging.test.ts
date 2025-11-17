/**
 * Tests for Message Handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initMessageHandler, destroyMessageHandler } from '../src/messaging/messageHandler';
import { registerEditor, clearRegistry } from '../src/registry/editorRegistry';
import type { EditorContext, PromQLSuggestionMessage } from '../src/types';

describe('Message Handler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    clearRegistry();
    destroyMessageHandler();
  });

  afterEach(() => {
    destroyMessageHandler();
    clearRegistry();
    document.body.innerHTML = '';
  });

  function createMockEditor(id: string): EditorContext {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);

    const setQuerySpy = vi.fn();

    return {
      id,
      rootElement,
      queryInputElement: document.createElement('textarea'),
      editorType: 'textarea',
      injectedButton: null,
      getQuery: () => '',
      setQuery: setQuerySpy,
    };
  }

  it('should initialize message handler', () => {
    expect(() => {
      initMessageHandler();
    }).not.toThrow();
  });

  it('should destroy message handler', () => {
    initMessageHandler();

    expect(() => {
      destroyMessageHandler();
    }).not.toThrow();
  });

  it('should handle promql_suggestion message', () => {
    initMessageHandler();

    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const message: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      timestamp: Date.now(),
      payload: {
        editorId: 'test-editor',
        query: 'rate(http_requests_total[5m])',
      },
    };

    // Simulate message from iframe
    window.postMessage(message, 'https://assistant.example.com');

    // Wait for async processing
    setTimeout(() => {
      expect(editor.setQuery).toHaveBeenCalledWith('rate(http_requests_total[5m])');
    }, 100);
  });

  it('should ignore messages from wrong origin', () => {
    initMessageHandler();

    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const message: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      timestamp: Date.now(),
      payload: {
        editorId: 'test-editor',
        query: 'malicious_query',
      },
    };

    // Message from wrong origin
    const event = new MessageEvent('message', {
      data: message,
      origin: 'https://malicious.com',
    });

    window.dispatchEvent(event);

    // setQuery should NOT be called
    expect(editor.setQuery).not.toHaveBeenCalled();
  });

  it('should ignore invalid message format', () => {
    initMessageHandler();

    const invalidMessages = [
      null,
      undefined,
      'string',
      123,
      { wrong: 'format' },
      { type: 'promql_suggestion' }, // missing other fields
    ];

    invalidMessages.forEach((msg) => {
      const event = new MessageEvent('message', {
        data: msg,
        origin: 'https://assistant.example.com',
      });

      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  it('should handle suggestion for non-existent editor gracefully', () => {
    initMessageHandler();

    const message: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      timestamp: Date.now(),
      payload: {
        editorId: 'non-existent-editor',
        query: 'some_query',
      },
    };

    const event = new MessageEvent('message', {
      data: message,
      origin: 'https://assistant.example.com',
    });

    // Should not throw
    expect(() => {
      window.dispatchEvent(event);
    }).not.toThrow();
  });

  it('should handle suggestion for removed editor gracefully', () => {
    initMessageHandler();

    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    // Remove editor from DOM
    editor.rootElement.remove();

    const message: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      timestamp: Date.now(),
      payload: {
        editorId: 'test-editor',
        query: 'some_query',
      },
    };

    const event = new MessageEvent('message', {
      data: message,
      origin: 'https://assistant.example.com',
    });

    // Should not throw
    expect(() => {
      window.dispatchEvent(event);
    }).not.toThrow();
  });

  it('should validate message origin strictly', () => {
    initMessageHandler();

    const editor = createMockEditor('test-editor');
    registerEditor(editor);

    const message: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      timestamp: Date.now(),
      payload: {
        editorId: 'test-editor',
        query: 'query',
      },
    };

    // Try similar but different origins
    const invalidOrigins = [
      'https://assistant.example.com.evil.com',
      'http://assistant.example.com', // wrong protocol
      'https://assistant.example.com:8080', // wrong port
      'https://sub.assistant.example.com',
    ];

    invalidOrigins.forEach((origin) => {
      const event = new MessageEvent('message', {
        data: message,
        origin,
      });

      window.dispatchEvent(event);
      expect(editor.setQuery).not.toHaveBeenCalled();
    });
  });
});
