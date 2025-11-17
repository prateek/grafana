import { describe, expect, it, vi } from 'vitest';
import { findPromEditors } from '../src/detectors/promEditorDetector';

function createEditorDom() {
  document.body.innerHTML = `
    <div class="query-editor-row" data-testid="query-editor-row">
      <div class="query-editor-row__header">Prometheus</div>
      <div class="query-editor-row__actions"></div>
      <textarea class="query-text" data-testid="prom-query"></textarea>
    </div>
  `;
}

describe('promEditorDetector', () => {
  it('detects Prometheus editors and wires setter/getter', () => {
    createEditorDom();
    const editors = findPromEditors(document);
    expect(editors).toHaveLength(1);
    const editor = editors[0];
    expect(editor.getQuery()).toBe('');
    const spy = vi.fn();
    document.querySelector('textarea')?.addEventListener('input', spy);
    editor.setQuery('rate(node_cpu_seconds_total[5m])');
    expect(editor.getQuery()).toBe('rate(node_cpu_seconds_total[5m])');
    expect(spy).toHaveBeenCalled();
  });
});
