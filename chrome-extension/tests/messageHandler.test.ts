/**
 * Tests for Message Handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeMessageHandler,
  destroyMessageHandler,
  isValidExtensionMessage,
} from '../src/messageHandler';
import { registerEditor, clearRegistry } from '../src/editorRegistry';
import { config } from '../src/config';
import type { EditorContext, PromQLSuggestionMessage, MessageType } from '../src/types';

describe('messageHandler', () => {
  let mockEditor: EditorContext;

  beforeEach(() => {
    clearRegistry();
    document.body.innerHTML = '';

    const element = document.createElement('div');
    element.id = 'test-editor';
    document.body.appendChild(element);

    mockEditor = {
      id: 'test-editor-1',
      rootElement: element,
      queryInputElement: element,
      editorType: 'textarea',
      getQuery: vi.fn(() => ''),
      setQuery: vi.fn(),
    };

    registerEditor(mockEditor);
  });

  afterEach(() => {
    destroyMessageHandler();
    clearRegistry();
    document.body.innerHTML = '';
  });

  describe('initializeMessageHandler', () => {
    it('should set up message listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      initializeMessageHandler();

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('destroyMessageHandler', () => {
    it('should remove message listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      initializeMessageHandler();
      destroyMessageHandler();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      initializeMessageHandler();
    });

    it('should ignore messages from wrong origin', () => {
      const message: PromQLSuggestionMessage = {
        type: 'promql_suggestion' as MessageType.PROMQL_SUGGESTION,
        editorId: 'test-editor-1',
        query: 'sum(rate(http_requests_total[5m]))',
        timestamp: Date.now(),
      };

      const event = new MessageEvent('message', {
        data: message,
        origin: 'https://evil.com',
      });

      window.dispatchEvent(event);

      // setQuery should not have been called
      expect(mockEditor.setQuery).not.toHaveBeenCalled();
    });

    it('should handle PromQL suggestion message', () => {
      const message: PromQLSuggestionMessage = {
        type: 'promql_suggestion' as MessageType.PROMQL_SUGGESTION,
        editorId: 'test-editor-1',
        query: 'sum(rate(http_requests_total[5m]))',
        timestamp: Date.now(),
      };

      const event = new MessageEvent('message', {
        data: message,
        origin: config.ASSISTANT_IFRAME_ORIGIN,
      });

      window.dispatchEvent(event);

      expect(mockEditor.setQuery).toHaveBeenCalledWith('sum(rate(http_requests_total[5m]))');
    });

    it('should ignore suggestion for non-existent editor', () => {
      const message: PromQLSuggestionMessage = {
        type: 'promql_suggestion' as MessageType.PROMQL_SUGGESTION,
        editorId: 'non-existent-editor',
        query: 'test query',
        timestamp: Date.now(),
      };

      const event = new MessageEvent('message', {
        data: message,
        origin: config.ASSISTANT_IFRAME_ORIGIN,
      });

      // Should not throw
      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should ignore invalid message data', () => {
      const event = new MessageEvent('message', {
        data: 'invalid data',
        origin: config.ASSISTANT_IFRAME_ORIGIN,
      });

      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should ignore message with unknown type', () => {
      const message = {
        type: 'unknown_type',
        data: 'test',
        timestamp: Date.now(),
      };

      const event = new MessageEvent('message', {
        data: message,
        origin: config.ASSISTANT_IFRAME_ORIGIN,
      });

      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  describe('isValidExtensionMessage', () => {
    it('should validate promql_context message', () => {
      const message = {
        type: 'promql_context',
        editorId: 'test-1',
        currentQuery: 'test query',
        datasource: 'prometheus',
        timestamp: Date.now(),
      };

      expect(isValidExtensionMessage(message)).toBe(true);
    });

    it('should validate promql_suggestion message', () => {
      const message = {
        type: 'promql_suggestion',
        editorId: 'test-1',
        query: 'test query',
        timestamp: Date.now(),
      };

      expect(isValidExtensionMessage(message)).toBe(true);
    });

    it('should validate close_overlay message', () => {
      const message = {
        type: 'close_overlay',
        timestamp: Date.now(),
      };

      expect(isValidExtensionMessage(message)).toBe(true);
    });

    it('should reject message without type', () => {
      const message = {
        editorId: 'test-1',
        query: 'test',
      };

      expect(isValidExtensionMessage(message)).toBe(false);
    });

    it('should reject message with invalid type', () => {
      const message = {
        type: 'invalid_type',
        data: 'test',
      };

      expect(isValidExtensionMessage(message)).toBe(false);
    });

    it('should reject promql_suggestion with missing query', () => {
      const message = {
        type: 'promql_suggestion',
        editorId: 'test-1',
        timestamp: Date.now(),
      };

      expect(isValidExtensionMessage(message)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect(isValidExtensionMessage('string')).toBe(false);
      expect(isValidExtensionMessage(123)).toBe(false);
      expect(isValidExtensionMessage(null)).toBe(false);
      expect(isValidExtensionMessage(undefined)).toBe(false);
    });
  });
});
