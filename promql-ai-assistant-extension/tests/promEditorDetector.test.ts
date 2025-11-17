import { describe, expect, it, beforeEach } from 'vitest';
import { findPrometheusEditors, setPromQuery, getPromQuery } from '../src/promEditorDetector';

describe('promEditorDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <section class="query-editor-row" data-panelid="panel-a" data-datasource-name="Prometheus">
          <div class="gf-form-label">Prometheus</div>
          <div class="monaco-editor">
            <textarea data-testid="prom-query-input"></textarea>
          </div>
          <div class="query-ctrl-actions"></div>
        </section>
        <section class="query-editor-row" data-panelid="panel-b" data-datasource-name="Prometheus">
          <div class="gf-form-label">Prometheus</div>
          <div class="CodeMirror">
            <textarea></textarea>
          </div>
          <div class="query-ctrl-actions"></div>
        </section>
      </div>`;
  });

  it('detects multiple editors and updates text via setPromQuery', () => {
    const editors = findPrometheusEditors();
    expect(editors).toHaveLength(2);

    const [monacoEditor, codeMirrorEditor] = editors;
    setPromQuery(monacoEditor, 'sum(rate(http_requests_total[5m]))');
    setPromQuery(codeMirrorEditor, 'avg_over_time(node_cpu_seconds_total[1h])');

    expect(getPromQuery(monacoEditor)).toContain('sum(rate');
    expect(getPromQuery(codeMirrorEditor)).toContain('avg_over_time');

    const monacoTextarea = monacoEditor.root.querySelector('textarea');
    expect(monacoTextarea?.value).toBe('sum(rate(http_requests_total[5m]))');
  });
});
