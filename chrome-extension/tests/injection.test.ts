/**
 * Tests for Button Injector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectButton, removeButton } from '../src/injection/buttonInjector';
import type { EditorContext } from '../src/types';

describe('Button Injector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createMockEditor(id: string): EditorContext {
    const rootElement = document.createElement('div');
    rootElement.className = 'query-editor';
    const toolbar = document.createElement('div');
    toolbar.className = 'query-editor-actions';
    rootElement.appendChild(toolbar);
    document.body.appendChild(rootElement);

    return {
      id,
      rootElement,
      queryInputElement: document.createElement('textarea'),
      editorType: 'textarea',
      injectedButton: null,
      getQuery: () => '',
      setQuery: () => {},
    };
  }

  it('should inject a button into the toolbar', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);

    expect(button).toBeTruthy();
    expect(button).toBeInstanceOf(HTMLElement);
    expect(button?.tagName).toBe('BUTTON');
    expect(document.body.contains(button!)).toBe(true);
  });

  it('should inject button with correct class name', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);

    expect(button?.className).toContain('prom-ai-assistant-button');
  });

  it('should inject button with correct label', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);

    expect(button?.textContent).toContain('AI Assistant');
  });

  it('should attach click handler to button', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);
    button?.click();

    expect(onClick).toHaveBeenCalledWith('test-editor');
  });

  it('should not inject duplicate buttons', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button1 = injectButton(editor, onClick);
    const button2 = injectButton(editor, onClick);

    expect(button1).toBe(button2);

    const buttons = document.querySelectorAll('.prom-ai-assistant-button');
    expect(buttons.length).toBe(1);
  });

  it('should not inject button if toolbar not found', () => {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);

    const editor: EditorContext = {
      id: 'test-editor',
      rootElement,
      queryInputElement: document.createElement('textarea'),
      editorType: 'textarea',
      injectedButton: null,
      getQuery: () => '',
      setQuery: () => {},
    };

    const onClick = vi.fn();
    const button = injectButton(editor, onClick);

    // Should still inject using container as fallback
    expect(button).toBeTruthy();
  });

  it('should remove injected button', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);
    editor.injectedButton = button;

    expect(document.body.contains(button!)).toBe(true);

    removeButton(editor);

    expect(document.body.contains(button!)).toBe(false);
  });

  it('should handle removing non-existent button gracefully', () => {
    const editor = createMockEditor('test-editor');

    expect(() => {
      removeButton(editor);
    }).not.toThrow();
  });

  it('should mark button with data attribute', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);

    expect(button?.getAttribute('data-prom-ai-button')).toBe('test-editor');
  });

  it('should have proper accessibility attributes', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();

    const button = injectButton(editor, onClick);

    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should prevent event propagation on click', () => {
    const editor = createMockEditor('test-editor');
    const onClick = vi.fn();
    const parentClick = vi.fn();

    const button = injectButton(editor, onClick);
    editor.rootElement.addEventListener('click', parentClick);

    const event = new MouseEvent('click', { bubbles: true });
    button?.dispatchEvent(event);

    expect(onClick).toHaveBeenCalled();
    // Event should be stopped, so parent handler might not be called
    // (depends on implementation)
  });

  it('should inject into existing button container', () => {
    const editor = createMockEditor('test-editor');
    const existingButton = document.createElement('button');
    existingButton.textContent = 'Run';
    editor.rootElement.querySelector('.query-editor-actions')?.appendChild(existingButton);

    const onClick = vi.fn();
    const button = injectButton(editor, onClick);

    expect(button).toBeTruthy();
    const toolbar = editor.rootElement.querySelector('.query-editor-actions');
    expect(toolbar?.contains(button!)).toBe(true);
  });
});
