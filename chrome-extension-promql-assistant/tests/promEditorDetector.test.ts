/**
 * Tests for Prometheus editor detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findEditors } from '../src/promEditorDetector';

describe('promEditorDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect a Prometheus editor with Monaco textarea', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    container.setAttribute('data-testid', 'prometheus-query-editor');

    const label = document.createElement('label');
    label.textContent = 'Prometheus';
    container.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.className = 'monaco-mouse-cursor-text';
    textarea.value = 'up{job="prometheus"}';
    container.appendChild(textarea);

    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors).toHaveLength(1);
    expect(editors[0].getQuery()).toBe('up{job="prometheus"}');
  });

  it('should detect multiple Prometheus editors', () => {
    // Create first editor
    const container1 = document.createElement('div');
    container1.className = 'query-editor-row';
    const label1 = document.createElement('label');
    label1.textContent = 'Prometheus';
    container1.appendChild(label1);
    const textarea1 = document.createElement('textarea');
    textarea1.value = 'query1';
    container1.appendChild(textarea1);
    document.body.appendChild(container1);

    // Create second editor
    const container2 = document.createElement('div');
    container2.className = 'query-editor-row';
    const label2 = document.createElement('label');
    label2.textContent = 'Prometheus';
    container2.appendChild(label2);
    const textarea2 = document.createElement('textarea');
    textarea2.value = 'query2';
    container2.appendChild(textarea2);
    document.body.appendChild(container2);

    const editors = findEditors();
    expect(editors).toHaveLength(2);
    expect(editors[0].getQuery()).toBe('query1');
    expect(editors[1].getQuery()).toBe('query2');
    expect(editors[0].editorId).not.toBe(editors[1].editorId);
  });

  it('should set query text and dispatch events', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    const label = document.createElement('label');
    label.textContent = 'Prometheus';
    container.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.value = 'old query';
    container.appendChild(textarea);

    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors).toHaveLength(1);

    const editor = editors[0];
    const inputEvents: Event[] = [];
    const changeEvents: Event[] = [];

    textarea.addEventListener('input', (e) => inputEvents.push(e));
    textarea.addEventListener('change', (e) => changeEvents.push(e));

    editor.setQuery('new query');

    expect(textarea.value).toBe('new query');
    expect(inputEvents).toHaveLength(1);
    expect(changeEvents).toHaveLength(1);
  });

  it('should not detect non-Prometheus editors', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    const label = document.createElement('label');
    label.textContent = 'Loki';
    container.appendChild(label);
    const textarea = document.createElement('textarea');
    textarea.value = 'query';
    container.appendChild(textarea);
    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors).toHaveLength(0);
  });

  it('should handle CodeMirror editor', () => {
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    const label = document.createElement('label');
    label.textContent = 'Prometheus';
    container.appendChild(label);

    const codeMirrorDiv = document.createElement('div');
    codeMirrorDiv.className = 'CodeMirror';
    const textarea = document.createElement('textarea');
    codeMirrorDiv.appendChild(textarea);
    container.appendChild(codeMirrorDiv);

    // Mock CodeMirror instance
    const triggerFn = () => {};
    (codeMirrorDiv as any).CodeMirror = {
      getValue: () => textarea.value,
      setValue: (val: string) => {
        textarea.value = val;
      },
      trigger: triggerFn,
    };

    document.body.appendChild(container);

    const editors = findEditors();
    expect(editors).toHaveLength(1);

    const editor = editors[0];
    editor.setQuery('codemirror query');
    expect(textarea.value).toBe('codemirror query');
  });

  it('should generate unique editor IDs', () => {
    const container1 = document.createElement('div');
    container1.className = 'query-editor-row';
    container1.setAttribute('data-panelid', 'panel1');
    const label1 = document.createElement('label');
    label1.textContent = 'Prometheus';
    container1.appendChild(label1);
    const textarea1 = document.createElement('textarea');
    container1.appendChild(textarea1);
    document.body.appendChild(container1);

    const container2 = document.createElement('div');
    container2.className = 'query-editor-row';
    container2.setAttribute('data-panelid', 'panel2');
    const label2 = document.createElement('label');
    label2.textContent = 'Prometheus';
    container2.appendChild(label2);
    const textarea2 = document.createElement('textarea');
    container2.appendChild(textarea2);
    document.body.appendChild(container2);

    const editors = findEditors();
    expect(editors).toHaveLength(2);
    expect(editors[0].editorId).toContain('panel1');
    expect(editors[1].editorId).toContain('panel2');
  });
});

