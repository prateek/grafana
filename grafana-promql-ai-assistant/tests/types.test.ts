/**
 * Tests for type guards.
 */

import { describe, it, expect } from 'vitest';
import {
  isPromQLContextMessage,
  isPromQLSuggestionMessage,
} from '../src/types';

describe('type guards', () => {
  describe('isPromQLContextMessage', () => {
    it('should return true for valid context message', () => {
      const message = {
        type: 'promql_context',
        editorId: 'editor-1',
        currentQuery: 'up',
        datasource: 'prometheus',
      };
      expect(isPromQLContextMessage(message)).toBe(true);
    });

    it('should return false for invalid message', () => {
      expect(isPromQLContextMessage({ type: 'other' })).toBe(false);
      expect(isPromQLContextMessage(null)).toBe(false);
      expect(isPromQLContextMessage(undefined)).toBe(false);
      expect(isPromQLContextMessage('string')).toBe(false);
    });
  });

  describe('isPromQLSuggestionMessage', () => {
    it('should return true for valid suggestion message', () => {
      const message = {
        type: 'promql_suggestion',
        editorId: 'editor-1',
        query: 'rate(http_requests_total[5m])',
      };
      expect(isPromQLSuggestionMessage(message)).toBe(true);
    });

    it('should return false for invalid message', () => {
      expect(isPromQLSuggestionMessage({ type: 'promql_suggestion' })).toBe(false);
      expect(isPromQLSuggestionMessage({ type: 'promql_suggestion', editorId: 'editor-1' })).toBe(
        false
      );
      expect(isPromQLSuggestionMessage({ type: 'promql_suggestion', query: 123 })).toBe(false);
      expect(isPromQLSuggestionMessage(null)).toBe(false);
      expect(isPromQLSuggestionMessage(undefined)).toBe(false);
    });
  });
});
