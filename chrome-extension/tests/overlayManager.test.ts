/**
 * Tests for Overlay Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  openOverlay,
  closeOverlay,
  isOverlayOpen,
  getCurrentEditorId,
  destroyOverlay,
} from '../src/overlayManager';
import type { EditorContext } from '../src/types';

describe('overlayManager', () => {
  let mockEditor: EditorContext;

  beforeEach(() => {
    document.body.innerHTML = '';

    const element = document.createElement('div');
    element.id = 'test-editor';
    document.body.appendChild(element);

    mockEditor = {
      id: 'test-editor-1',
      rootElement: element,
      queryInputElement: element,
      editorType: 'textarea',
      getQuery: vi.fn(() => 'rate(http_requests_total[5m])'),
      setQuery: vi.fn(),
    };
  });

  afterEach(() => {
    destroyOverlay();
    document.body.innerHTML = '';
  });

  describe('openOverlay', () => {
    it('should create overlay in DOM', () => {
      openOverlay(mockEditor);

      const overlay = document.getElementById('prom-ai-overlay-root');
      expect(overlay).toBeTruthy();
    });

    it('should show the overlay', () => {
      openOverlay(mockEditor);

      const overlay = document.getElementById('prom-ai-overlay-root') as HTMLElement;
      expect(overlay.style.display).toBe('flex');
    });

    it('should set overlay state to open', () => {
      openOverlay(mockEditor);
      expect(isOverlayOpen()).toBe(true);
    });

    it('should set current editor ID', () => {
      openOverlay(mockEditor);
      expect(getCurrentEditorId()).toBe('test-editor-1');
    });

    it('should create iframe with correct source', () => {
      openOverlay(mockEditor);

      const iframe = document.querySelector('.prom-ai-overlay__iframe') as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(iframe.src).toContain('assistant.example.com');
    });

    it('should create backdrop', () => {
      openOverlay(mockEditor);

      const backdrop = document.querySelector('.prom-ai-overlay__backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('should create close button', () => {
      openOverlay(mockEditor);

      const closeButton = document.querySelector('.prom-ai-overlay__close');
      expect(closeButton).toBeTruthy();
    });

    it('should reuse existing overlay if already created', () => {
      openOverlay(mockEditor);
      const firstOverlay = document.getElementById('prom-ai-overlay-root');

      openOverlay(mockEditor);
      const secondOverlay = document.getElementById('prom-ai-overlay-root');

      expect(firstOverlay).toBe(secondOverlay);
    });
  });

  describe('closeOverlay', () => {
    it('should hide the overlay', () => {
      openOverlay(mockEditor);
      closeOverlay();

      const overlay = document.getElementById('prom-ai-overlay-root') as HTMLElement;
      expect(overlay.style.display).toBe('none');
    });

    it('should set overlay state to closed', () => {
      openOverlay(mockEditor);
      closeOverlay();

      expect(isOverlayOpen()).toBe(false);
    });

    it('should clear current editor ID', () => {
      openOverlay(mockEditor);
      closeOverlay();

      expect(getCurrentEditorId()).toBeNull();
    });

    it('should handle closing when not open', () => {
      expect(() => {
        closeOverlay();
      }).not.toThrow();
    });
  });

  describe('isOverlayOpen', () => {
    it('should return false initially', () => {
      expect(isOverlayOpen()).toBe(false);
    });

    it('should return true when overlay is open', () => {
      openOverlay(mockEditor);
      expect(isOverlayOpen()).toBe(true);
    });

    it('should return false after closing', () => {
      openOverlay(mockEditor);
      closeOverlay();
      expect(isOverlayOpen()).toBe(false);
    });
  });

  describe('getCurrentEditorId', () => {
    it('should return null initially', () => {
      expect(getCurrentEditorId()).toBeNull();
    });

    it('should return editor ID when overlay is open', () => {
      openOverlay(mockEditor);
      expect(getCurrentEditorId()).toBe('test-editor-1');
    });

    it('should return null after closing', () => {
      openOverlay(mockEditor);
      closeOverlay();
      expect(getCurrentEditorId()).toBeNull();
    });
  });

  describe('destroyOverlay', () => {
    it('should remove overlay from DOM', () => {
      openOverlay(mockEditor);
      destroyOverlay();

      const overlay = document.getElementById('prom-ai-overlay-root');
      expect(overlay).toBeFalsy();
    });

    it('should reset overlay state', () => {
      openOverlay(mockEditor);
      destroyOverlay();

      expect(isOverlayOpen()).toBe(false);
      expect(getCurrentEditorId()).toBeNull();
    });

    it('should handle destroying non-existent overlay', () => {
      expect(() => {
        destroyOverlay();
      }).not.toThrow();
    });
  });

  describe('overlay interactions', () => {
    it('should close overlay when clicking backdrop', () => {
      openOverlay(mockEditor);

      const backdrop = document.querySelector('.prom-ai-overlay__backdrop') as HTMLElement;
      backdrop.click();

      expect(isOverlayOpen()).toBe(false);
    });

    it('should close overlay when clicking close button', () => {
      openOverlay(mockEditor);

      const closeButton = document.querySelector('.prom-ai-overlay__close') as HTMLElement;
      closeButton.click();

      expect(isOverlayOpen()).toBe(false);
    });

    it('should not close when clicking inside panel', () => {
      openOverlay(mockEditor);

      const panel = document.querySelector('.prom-ai-overlay__panel') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      panel.dispatchEvent(clickEvent);

      // Should still be open
      expect(isOverlayOpen()).toBe(true);
    });
  });
});
