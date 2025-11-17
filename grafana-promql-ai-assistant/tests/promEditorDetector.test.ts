/**
 * Tests for Prometheus editor detection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { findEditors } from '../src/promEditorDetector';

describe('promEditorDetector', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });
    document = dom.window.document;
    global.document = document as any;
    global.window = dom.window as any;
  });

  afterEach(() => {
    delete (global as any).document;
    delete (global as any).window;
  });

  it('should detect a Prometheus editor with Monaco', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.innerHTML = `
      <label>Prometheus</label>
      <div class="monaco-editor">
        <textarea class="monaco-mouse-cursor-text">rate(http_requests_total[5m])</textarea>
      </div>
    `;
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors.length).toBe(1);
    expect(editors[0].editorId).toContain('prom-editor');
    expect(editors[0].getQuery()).toBe('rate(http_requests_total[5m])');
  });

  it('should detect a Prometheus editor with CodeMirror', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.innerHTML = `
      <label>Prometheus</label>
      <div class="CodeMirror">
        <textarea>sum(rate(http_requests_total[5m]))</textarea>
      </div>
    `;
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors.length).toBe(1);
    expect(editors[0].getQuery()).toBe('sum(rate(http_requests_total[5m]))');
  });

  it('should detect a Prometheus editor with plain textarea', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.innerHTML = `
      <label>Prometheus</label>
      <textarea class="query">histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))</textarea>
    `;
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors.length).toBe(1);
    expect(editors[0].getQuery()).toContain('histogram_quantile');
  });

  it('should detect multiple editors on the same page', () => {
    const container1 = document.createElement('div');
    container1.className = 'query-editor-row';
    container1.innerHTML = `
      <label>Prometheus</label>
      <textarea>query1</textarea>
    `;

    const container2 = document.createElement('div');
    container2.className = 'query-editor-row';
    container2.innerHTML = `
      <label>Prometheus</label>
      <textarea>query2</textarea>
    `;

    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const editors = findEditors();
    expect(editors.length).toBe(2);
    expect(editors[0].getQuery()).toBe('query1');
    expect(editors[1].getQuery()).toBe('query2');
    expect(editors[0].editorId).not.toBe(editors[1].editorId);
  });

  it('should not detect non-Prometheus editors', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.innerHTML = `
      <label>InfluxDB</label>
      <textarea>SELECT * FROM measurements</textarea>
    `;
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors.length).toBe(0);
  });

  it('should detect editors with data-datasource attribute', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.setAttribute('data-datasource', 'prometheus');
    container.innerHTML = `
      <textarea>up</textarea>
    `;
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors.length).toBe(1);
  });

  it('should generate unique IDs for editors', () => {
    const container1 = document.createElement('div');
    container1.className = 'query-editor-row';
    container1.setAttribute('data-panelid', 'panel-1');
    container1.innerHTML = '<label>Prometheus</label><textarea>q1</textarea>';

    const container2 = document.createElement('div');
    container2.className = 'query-editor-row';
    container2.setAttribute('data-panelid', 'panel-2');
    container2.innerHTML = '<label>Prometheus</label><textarea>q2</textarea>';

    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const editors = findEditors();
    expect(editors.length).toBe(2);
    expect(editors[0].editorId).not.toBe(editors[1].editorId);
    expect(editors[0].editorId).toContain('panel-1');
    expect(editors[1].editorId).toContain('panel-2');
  });
});
