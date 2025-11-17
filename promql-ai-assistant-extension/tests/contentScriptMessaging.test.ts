import { describe, expect, it, beforeEach, vi } from 'vitest';

const extensionOrigin = new URL(chrome.runtime.getURL('/')).origin;

describe('contentScript messaging', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <section class="query-editor-row" data-panelid="panel-test" data-datasource-name="Prometheus">
        <div class="gf-form-label">Prometheus</div>
        <div class="query-ctrl-actions"></div>
        <textarea></textarea>
        <button data-testid="run-queries-button" type="button">Run query</button>
      </section>`;
  });

  it('handles promql_suggestion messages by updating the editor value', async () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    textarea.addEventListener('input', inputSpy);
    textarea.addEventListener('change', changeSpy);

    const runButton = document.querySelector('[data-testid="run-queries-button"]') as HTMLButtonElement;
    const clickSpy = vi.spyOn(runButton, 'click');

    await import('../src/contentScript');

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: extensionOrigin,
        data: {
          type: 'promql_suggestion',
          editorId: 'panel-test',
          query: 'sum(rate(up[5m]))',
        },
      }),
    );

    expect(textarea.value).toBe('sum(rate(up[5m]))');
    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
