/**
 * Tests for Button Injector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectAssistantButton, removeAssistantButton, hasAssistantButton } from '../src/buttonInjector';
import type { EditorContext } from '../src/types';

describe('buttonInjector', () => {
  let mockEditor: EditorContext;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="editor-root" class="query-editor-row" data-ds-type="prometheus">
        <div class="query-editor-row__actions"></div>
        <textarea></textarea>
      </div>
    `;

    const rootElement = document.querySelector('#editor-root') as HTMLElement;
    const queryInputElement = document.querySelector('textarea') as HTMLElement;

    mockEditor = {
      id: 'test-editor-1',
      rootElement,
      queryInputElement,
      editorType: 'textarea',
      getQuery: () => '',
      setQuery: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('injectAssistantButton', () => {
    it('should inject a button into the editor', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      expect(button).toBeTruthy();
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(document.body.contains(button)).toBe(true);
    });

    it('should inject button with correct class', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      expect(button?.classList.contains('prom-ai-assistant-button')).toBe(true);
    });

    it('should inject button with correct label', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      expect(button?.textContent).toContain('AI Assistant');
    });

    it('should attach click handler', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      button?.click();
      expect(onClick).toHaveBeenCalledWith('test-editor-1');
    });

    it('should be idempotent - not inject multiple buttons', () => {
      const onClick = vi.fn();
      const button1 = injectAssistantButton(mockEditor, onClick);
      const button2 = injectAssistantButton(mockEditor, onClick);

      expect(button1).toBe(button2);

      const buttons = document.querySelectorAll('.prom-ai-assistant-button');
      expect(buttons.length).toBe(1);
    });

    it('should store button reference in editor context', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      expect(mockEditor.assistantButton).toBe(button);
    });

    it('should inject button into toolbar area', () => {
      const onClick = vi.fn();
      injectAssistantButton(mockEditor, onClick);

      const toolbar = document.querySelector('.query-editor-row__actions');
      const button = toolbar?.querySelector('.prom-ai-assistant-button');
      expect(button).toBeTruthy();
    });

    it('should handle missing toolbar gracefully', () => {
      // Remove toolbar
      const toolbar = document.querySelector('.query-editor-row__actions');
      toolbar?.remove();

      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      // Should still inject, but into root element
      expect(button).toBeTruthy();
    });
  });

  describe('removeAssistantButton', () => {
    it('should remove the button from DOM', () => {
      const onClick = vi.fn();
      injectAssistantButton(mockEditor, onClick);

      expect(document.querySelector('.prom-ai-assistant-button')).toBeTruthy();

      removeAssistantButton(mockEditor);

      expect(document.querySelector('.prom-ai-assistant-button')).toBeFalsy();
    });

    it('should clear button reference in editor context', () => {
      const onClick = vi.fn();
      injectAssistantButton(mockEditor, onClick);

      removeAssistantButton(mockEditor);

      expect(mockEditor.assistantButton).toBeUndefined();
    });

    it('should handle removing non-existent button gracefully', () => {
      expect(() => {
        removeAssistantButton(mockEditor);
      }).not.toThrow();
    });
  });

  describe('hasAssistantButton', () => {
    it('should return true when button exists in DOM', () => {
      const onClick = vi.fn();
      injectAssistantButton(mockEditor, onClick);

      expect(hasAssistantButton(mockEditor)).toBe(true);
    });

    it('should return false when button does not exist', () => {
      expect(hasAssistantButton(mockEditor)).toBe(false);
    });

    it('should return false after button is removed', () => {
      const onClick = vi.fn();
      injectAssistantButton(mockEditor, onClick);
      removeAssistantButton(mockEditor);

      expect(hasAssistantButton(mockEditor)).toBe(false);
    });

    it('should return false if button exists but not in DOM', () => {
      const onClick = vi.fn();
      const button = injectAssistantButton(mockEditor, onClick);

      // Manually remove from DOM without using removeAssistantButton
      button?.parentElement?.remove();

      expect(hasAssistantButton(mockEditor)).toBe(false);
    });
  });
});
