/**
 * Tests for overlay UI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openOverlay, closeOverlay, handleSuggestion, isOverlayOpen } from '../src/ui/overlay';
import type { EditorContext, PromqlSuggestionMessage } from '../src/types';

describe('overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create and show overlay when opened', () => {
    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: document.createElement('div'),
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onSuggestion = vi.fn();
    openOverlay(editorContext, onSuggestion);

    const overlayRoot = document.getElementById('prom-ai-overlay-root');
    expect(overlayRoot).not.toBeNull();
    expect(overlayRoot?.classList.contains('visible')).toBe(true);
    expect(isOverlayOpen()).toBe(true);
  });

  it('should hide overlay when closed', () => {
    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: document.createElement('div'),
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onSuggestion = vi.fn();
    openOverlay(editorContext, onSuggestion);
    expect(isOverlayOpen()).toBe(true);

    closeOverlay();
    expect(isOverlayOpen()).toBe(false);
  });

  it('should handle suggestion message and update editor', () => {
    const setQuery = vi.fn();
    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: document.createElement('div'),
      getQuery: () => 'old query',
      setQuery,
    };

    const onSuggestion = vi.fn();
    openOverlay(editorContext, onSuggestion);

    const message: PromqlSuggestionMessage = {
      type: 'promql_suggestion',
      editorId: 'test-editor',
      query: 'new query',
    };

    handleSuggestion(message);

    expect(setQuery).toHaveBeenCalledWith('new query');
  });

  it('should not handle suggestion for wrong editor ID', () => {
    const setQuery = vi.fn();
    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: document.createElement('div'),
      getQuery: () => 'old query',
      setQuery,
    };

    const onSuggestion = vi.fn();
    openOverlay(editorContext, onSuggestion);

    const message: PromqlSuggestionMessage = {
      type: 'promql_suggestion',
      editorId: 'wrong-editor',
      query: 'new query',
    };

    handleSuggestion(message);

    expect(setQuery).not.toHaveBeenCalled();
  });

  it('should create overlay with iframe', () => {
    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: document.createElement('div'),
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onSuggestion = vi.fn();
    openOverlay(editorContext, onSuggestion);

    const overlayRoot = document.getElementById('prom-ai-overlay-root');
    const iframe = overlayRoot?.querySelector<HTMLIFrameElement>('.prom-ai-overlay-iframe');
    expect(iframe).not.toBeNull();
  });
});
