/**
 * Tests for button injection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectButton, removeButton } from '../src/buttonInjector';
import type { EditorContext } from '../src/types';

describe('buttonInjector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should inject a button into a query editor container', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';

    const toolbarArea = document.createElement('div');
    toolbarArea.className = 'query-row-actions';
    container.appendChild(toolbarArea);

    document.body.appendChild(container);

    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: container,
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onClick = vi.fn();
    const button = injectButton(editorContext, onClick);

    expect(button).not.toBeNull();
    expect(container.querySelector('.prom-ai-assistant-button')).not.toBeNull();
    expect(button?.textContent).toContain('AI Assistant');
  });

  it('should not inject duplicate buttons', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';

    const toolbarArea = document.createElement('div');
    toolbarArea.className = 'query-row-actions';
    container.appendChild(toolbarArea);

    document.body.appendChild(container);

    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: container,
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onClick = vi.fn();
    injectButton(editorContext, onClick);
    injectButton(editorContext, onClick);

    const buttons = container.querySelectorAll('.prom-ai-assistant-button');
    expect(buttons).toHaveLength(1);
  });

  it('should call onClick handler when button is clicked', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';

    const toolbarArea = document.createElement('div');
    toolbarArea.className = 'query-row-actions';
    container.appendChild(toolbarArea);

    document.body.appendChild(container);

    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: container,
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onClick = vi.fn();
    const button = injectButton(editorContext, onClick);

    expect(button).not.toBeNull();
    button?.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(editorContext);
  });

  it('should remove button when removeButton is called', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';

    const toolbarArea = document.createElement('div');
    toolbarArea.className = 'query-row-actions';
    container.appendChild(toolbarArea);

    document.body.appendChild(container);

    const editorContext: EditorContext = {
      editorId: 'test-editor',
      rootElement: container,
      getQuery: () => 'test query',
      setQuery: vi.fn(),
    };

    const onClick = vi.fn();
    injectButton(editorContext, onClick);

    expect(container.querySelector('.prom-ai-assistant-button')).not.toBeNull();

    removeButton(editorContext);

    expect(container.querySelector('.prom-ai-assistant-button')).toBeNull();
  });
});
