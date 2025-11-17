import { describe, expect, it, beforeEach, vi } from 'vitest';
import { findPromEditors } from '../src/detection/promEditorDetector';

const editorHtml = `
  <div class="query-editor-row" data-datasource="Prometheus">
    <div class="query-editor-header">Prometheus</div>
    <div class="query-input">
      <textarea></textarea>
    </div>
    <div class="query-actions">
      <button aria-label="Run query" id="run-query"></button>
    </div>
  </div>
`;

describe('promEditorDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects editors and wires read/write access', () => {
    document.body.innerHTML = editorHtml;

    const editors = findPromEditors();
    expect(editors).toHaveLength(1);

    const editor = editors[0];
    const query = 'sum(rate(up[5m]))';
    expect(editor.getQuery()).toBe('');
    expect(editor.setQuery(query)).toBe(true);

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(query);
  });

  it('triggers Grafana run button when available', () => {
    document.body.innerHTML = editorHtml;

    const button = document.getElementById('run-query');
    let pressed = false;
    button?.addEventListener('click', () => {
      pressed = true;
    });

    const [editor] = findPromEditors();
    editor.runQuery();

    expect(pressed).toBe(true);
  });

  it('dispatches input/change events when updating the query', () => {
    document.body.innerHTML = editorHtml;
    const [editor] = findPromEditors();
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    textarea.addEventListener('input', inputSpy);
    textarea.addEventListener('change', changeSpy);

    editor.setQuery('avg(rate(up[1m]))');

    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
  });
});
