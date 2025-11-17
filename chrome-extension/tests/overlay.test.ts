/**
 * Tests for Overlay Manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  openOverlay,
  closeOverlay,
  toggleOverlay,
  getOverlayState,
  destroyOverlay,
} from '../src/overlay/overlayManager';

describe('Overlay Manager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    destroyOverlay(); // Clean state
  });

  afterEach(() => {
    destroyOverlay();
    document.body.innerHTML = '';
  });

  it('should create overlay when opened', () => {
    openOverlay('editor-1', 'up');

    const overlay = document.getElementById('prom-ai-overlay-root');
    expect(overlay).toBeTruthy();
    expect(document.body.contains(overlay!)).toBe(true);
  });

  it('should show overlay when opened', () => {
    openOverlay('editor-1', 'up');

    const state = getOverlayState();
    expect(state.isVisible).toBe(true);
    expect(state.activeEditorId).toBe('editor-1');
  });

  it('should create iframe in overlay', () => {
    openOverlay('editor-1', 'rate(metric[5m])');

    const iframe = document.getElementById('prom-ai-overlay-iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.tagName).toBe('IFRAME');
  });

  it('should set iframe src to configured URL', () => {
    openOverlay('editor-1', 'query');

    const iframe = document.getElementById('prom-ai-overlay-iframe') as HTMLIFrameElement;
    expect(iframe?.src).toContain('assistant.example.com');
  });

  it('should hide overlay when closed', () => {
    openOverlay('editor-1', 'query');
    closeOverlay();

    const state = getOverlayState();
    expect(state.isVisible).toBe(false);
    expect(state.activeEditorId).toBeNull();

    const overlay = document.getElementById('prom-ai-overlay-root') as HTMLElement;
    expect(overlay?.style.display).toBe('none');
  });

  it('should toggle overlay visibility', () => {
    toggleOverlay('editor-1', 'query');
    expect(getOverlayState().isVisible).toBe(true);

    toggleOverlay('editor-1', 'query');
    expect(getOverlayState().isVisible).toBe(false);
  });

  it('should reopen overlay for different editor', () => {
    openOverlay('editor-1', 'query1');
    expect(getOverlayState().activeEditorId).toBe('editor-1');

    openOverlay('editor-2', 'query2');
    expect(getOverlayState().activeEditorId).toBe('editor-2');
    expect(getOverlayState().isVisible).toBe(true);
  });

  it('should contain backdrop element', () => {
    openOverlay('editor-1', 'query');

    const backdrop = document.querySelector('.overlay-backdrop');
    expect(backdrop).toBeTruthy();
  });

  it('should contain panel element', () => {
    openOverlay('editor-1', 'query');

    const panel = document.querySelector('.overlay-panel');
    expect(panel).toBeTruthy();
  });

  it('should contain header with title', () => {
    openOverlay('editor-1', 'query');

    const title = document.querySelector('.overlay-title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('PromQL Assistant');
  });

  it('should contain close button', () => {
    openOverlay('editor-1', 'query');

    const closeButton = document.querySelector('.overlay-close-button');
    expect(closeButton).toBeTruthy();
  });

  it('should close overlay when close button clicked', () => {
    openOverlay('editor-1', 'query');

    const closeButton = document.querySelector('.overlay-close-button') as HTMLElement;
    closeButton?.click();

    expect(getOverlayState().isVisible).toBe(false);
  });

  it('should close overlay when backdrop clicked', () => {
    openOverlay('editor-1', 'query');

    const backdrop = document.querySelector('.overlay-backdrop') as HTMLElement;
    backdrop?.click();

    expect(getOverlayState().isVisible).toBe(false);
  });

  it('should NOT close overlay when panel clicked', () => {
    openOverlay('editor-1', 'query');

    const panel = document.querySelector('.overlay-panel') as HTMLElement;
    panel?.click();

    // Should still be visible
    expect(getOverlayState().isVisible).toBe(true);
  });

  it('should destroy overlay completely', () => {
    openOverlay('editor-1', 'query');

    const overlay = document.getElementById('prom-ai-overlay-root');
    expect(overlay).toBeTruthy();

    destroyOverlay();

    const overlayAfter = document.getElementById('prom-ai-overlay-root');
    expect(overlayAfter).toBeNull();

    const state = getOverlayState();
    expect(state.overlayElement).toBeNull();
    expect(state.iframeElement).toBeNull();
  });

  it('should maintain only one overlay instance', () => {
    openOverlay('editor-1', 'query1');
    openOverlay('editor-2', 'query2');

    const overlays = document.querySelectorAll('#prom-ai-overlay-root');
    expect(overlays.length).toBe(1);
  });

  it('should reuse existing overlay when reopening', () => {
    openOverlay('editor-1', 'query');
    const overlay1 = document.getElementById('prom-ai-overlay-root');

    closeOverlay();

    openOverlay('editor-2', 'query2');
    const overlay2 = document.getElementById('prom-ai-overlay-root');

    expect(overlay1).toBe(overlay2);
  });

  it('should have proper sandbox attributes on iframe', () => {
    openOverlay('editor-1', 'query');

    const iframe = document.getElementById('prom-ai-overlay-iframe') as HTMLIFrameElement;
    const sandbox = iframe?.getAttribute('sandbox');

    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).toContain('allow-same-origin');
  });
});
