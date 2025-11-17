import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OverlayController } from '../src/ui/overlay';
import { ASSISTANT_ALLOWED_ORIGIN } from '../src/config';

describe('OverlayController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders overlay root and iframe when opened', () => {
    const overlay = new OverlayController({ onSuggestion: vi.fn() });
    overlay.open({ editorId: 'one', currentQuery: 'up', datasource: 'prometheus' });

    const root = document.getElementById('prom-ai-overlay-root');
    expect(root).not.toBeNull();
    expect(root?.classList.contains('prom-ai-visible')).toBe(true);

    const iframe = root?.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBeDefined();
  });

  it('handles promql suggestions via postMessage', () => {
    const onSuggestion = vi.fn();
    const overlay = new OverlayController({ onSuggestion });
    overlay.open({ editorId: 'two', currentQuery: 'up', datasource: 'prometheus' });

    const event = new MessageEvent('message', {
      origin: ASSISTANT_ALLOWED_ORIGIN,
      data: { type: 'promql_suggestion', editorId: 'two', query: 'sum(rate(up[5m]))' }
    });

    overlay.handleAssistantMessage(event);
    expect(onSuggestion).toHaveBeenCalledWith({ editorId: 'two', query: 'sum(rate(up[5m]))' });
  });
});
