/**
 * Tests for Prometheus Editor Detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findEditors, generateEditorId } from '../src/detection/promEditorDetector';

describe('Prometheus Editor Detection', () => {
  beforeEach(() => {
    // Clear document body before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect a Prometheus editor with Monaco', () => {
    // Create a mock Grafana Prometheus editor with Monaco
    document.body.innerHTML = `
      <div class="query-editor-row" data-testid="query-editor-row">
        <label>Prometheus</label>
        <div class="query-editor-actions">
          <button>Run query</button>
        </div>
        <div class="monaco-editor">
          <textarea></textarea>
        </div>
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(1);
    expect(results[0].found).toBe(true);
    expect(results[0].editorType).toBe('monaco');
    expect(results[0].queryInput).toBeTruthy();
    expect(results[0].container).toBeTruthy();
  });

  it('should detect a Prometheus editor with CodeMirror', () => {
    document.body.innerHTML = `
      <div class="query-editor">
        <div data-datasource-type="prometheus">
          <div class="CodeMirror">
            <textarea></textarea>
          </div>
        </div>
        <div class="toolbar">
          <button>+</button>
        </div>
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(1);
    expect(results[0].found).toBe(true);
    expect(results[0].editorType).toBe('codemirror');
  });

  it('should detect a Prometheus editor with plain textarea', () => {
    document.body.innerHTML = `
      <div class="query-editor-row">
        <select>
          <option value="prometheus" selected>Prometheus</option>
        </select>
        <textarea name="query"></textarea>
        <div class="query-actions">
          <button>Run</button>
        </div>
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(1);
    expect(results[0].found).toBe(true);
    expect(results[0].editorType).toBe('textarea');
  });

  it('should detect multiple Prometheus editors', () => {
    document.body.innerHTML = `
      <div class="query-editor-row" data-panelid="panel-1">
        <label>Prometheus</label>
        <textarea></textarea>
      </div>
      <div class="query-editor-row" data-panelid="panel-2">
        <label>Prometheus</label>
        <textarea></textarea>
      </div>
    `;

    const results = findEditors();

    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should NOT detect non-Prometheus editors', () => {
    document.body.innerHTML = `
      <div class="query-editor-row">
        <label>MySQL</label>
        <textarea></textarea>
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(0);
  });

  it('should NOT detect editor containers without input elements', () => {
    document.body.innerHTML = `
      <div class="query-editor-row">
        <label>Prometheus</label>
        <!-- No textarea or input -->
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(0);
  });

  it('should generate unique editor IDs', () => {
    document.body.innerHTML = `
      <div class="query-editor" id="editor-1"></div>
      <div class="query-editor" data-panel-id="panel-42"></div>
      <div class="query-editor" data-testid="test-editor"></div>
      <div class="query-editor"></div>
    `;

    const containers = document.querySelectorAll<HTMLElement>('.query-editor');
    const ids = Array.from(containers).map((c) => generateEditorId(c));

    expect(ids[0]).toBe('editor-editor-1');
    expect(ids[1]).toBe('editor-panel-panel-42');
    expect(ids[2]).toBe('editor-test-editor');
    expect(ids[3]).toContain('editor-'); // Fallback ID

    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should handle complex nested DOM structures', () => {
    document.body.innerHTML = `
      <div class="panel">
        <div class="panel-content">
          <div class="query-editor-row">
            <div class="datasource-picker">
              <select>
                <option value="prometheus" selected>Prometheus</option>
              </select>
            </div>
            <div class="query-field">
              <div class="monaco-editor">
                <div class="overflow-guard">
                  <textarea></textarea>
                </div>
              </div>
            </div>
            <div class="query-editor-actions">
              <button>Run query</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const results = findEditors();

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].found).toBe(true);
  });

  it('should find toolbar for button injection', () => {
    document.body.innerHTML = `
      <div class="query-editor-row" data-testid="query-editor">
        <label>Prometheus</label>
        <textarea></textarea>
        <div class="query-editor-actions">
          <button>Run</button>
        </div>
      </div>
    `;

    const results = findEditors();

    expect(results).toHaveLength(1);
    expect(results[0].toolbar).toBeTruthy();
  });
});
