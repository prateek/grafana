/**
 * Integration tests for the full extension workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { findEditors } from '../promEditorDetector';
import { editorRegistry, scanAndInjectButtons, handleQuerySuggestion } from '../contentScript';
import { isPromQLSuggestionMessage } from '../types';
import type { PromQLSuggestionMessage } from '../types';

describe('Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    editorRegistry.clear();
  });

  it('should complete full workflow: detect -> inject -> suggest -> update', () => {
    // 1. Set up a mock Grafana Prometheus editor
    document.body.innerHTML = `
      <div class="query-editor-row" data-panelid="integration-test">
        <div class="datasource-picker">
          <label>Prometheus</label>
        </div>
        <div class="query-field">
          <textarea placeholder="Enter a PromQL query">rate(http_requests[5m])</textarea>
        </div>
        <div class="query-editor-row__actions" data-testid="query-editor-row-actions">
          <button>Run Query</button>
        </div>
      </div>
    `;

    // 2. Detect editors
    const detectedEditors = findEditors();
    expect(detectedEditors).toHaveLength(1);
    expect(detectedEditors[0].getQuery()).toBe('rate(http_requests[5m])');

    // 3. Scan and inject buttons
    scanAndInjectButtons();
    const button = document.querySelector('.prom-ai-assistant-button');
    expect(button).toBeTruthy();
    expect(editorRegistry.size).toBe(1);

    // 4. Simulate receiving a query suggestion
    const editorId = Array.from(editorRegistry.keys())[0];
    const suggestionMessage: PromQLSuggestionMessage = {
      type: 'promql_suggestion',
      editorId,
      query: 'sum(rate(http_requests_total[5m])) by (status)',
    };

    // 5. Handle the suggestion
    handleQuerySuggestion(suggestionMessage);

    // 6. Verify the query was updated
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('sum(rate(http_requests_total[5m])) by (status)');

    // 7. Verify we can read it back through the detector
    const updatedEditors = findEditors();
    expect(updatedEditors[0].getQuery()).toBe('sum(rate(http_requests_total[5m])) by (status)');
  });

  it('should handle multiple editors with independent state', () => {
    document.body.innerHTML = `
      <div class="dashboard">
        <div class="query-editor-row" data-panelid="panel-1">
          <label>Prometheus</label>
          <textarea>metric1</textarea>
          <div class="query-editor-row__actions"></div>
        </div>
        <div class="query-editor-row" data-panelid="panel-2">
          <label>Prometheus</label>
          <textarea>metric2</textarea>
          <div class="query-editor-row__actions"></div>
        </div>
      </div>
    `;

    scanAndInjectButtons();
    expect(editorRegistry.size).toBe(2);

    const editorIds = Array.from(editorRegistry.keys());

    // Update first editor
    handleQuerySuggestion({
      type: 'promql_suggestion',
      editorId: editorIds[0],
      query: 'updated_metric1',
    });

    // Update second editor
    handleQuerySuggestion({
      type: 'promql_suggestion',
      editorId: editorIds[1],
      query: 'updated_metric2',
    });

    const textareas = document.querySelectorAll('textarea');
    expect(textareas[0].value).toBe('updated_metric1');
    expect(textareas[1].value).toBe('updated_metric2');
  });

  it('should handle SPA navigation (editor removal and addition)', () => {
    // Initial page load with one editor
    document.body.innerHTML = `
      <div id="app">
        <div class="query-editor-row" data-panelid="initial">
          <label>Prometheus</label>
          <textarea></textarea>
          <div class="query-editor-row__actions"></div>
        </div>
      </div>
    `;

    scanAndInjectButtons();
    expect(editorRegistry.size).toBe(1);
    const initialId = Array.from(editorRegistry.keys())[0];

    // Simulate navigation to a new page with different editor
    document.getElementById('app')!.innerHTML = `
      <div class="query-editor-row" data-panelid="new-page">
        <label>Prometheus</label>
        <textarea></textarea>
        <div class="query-editor-row__actions"></div>
      </div>
    `;

    scanAndInjectButtons();

    // Old editor should be cleaned up, new one should be registered
    expect(editorRegistry.has(initialId)).toBe(false);
    expect(editorRegistry.size).toBe(1);

    const newId = Array.from(editorRegistry.keys())[0];
    expect(newId).not.toBe(initialId);
  });
});

describe('Message Type Guards', () => {
  it('should correctly identify PromQL suggestion messages', () => {
    const validMessage = {
      type: 'promql_suggestion',
      editorId: 'test-editor',
      query: 'up',
    };

    expect(isPromQLSuggestionMessage(validMessage)).toBe(true);
  });

  it('should reject invalid messages', () => {
    expect(isPromQLSuggestionMessage(null)).toBe(false);
    expect(isPromQLSuggestionMessage(undefined)).toBe(false);
    expect(isPromQLSuggestionMessage({})).toBe(false);
    expect(isPromQLSuggestionMessage({ type: 'wrong_type' })).toBe(false);
    expect(
      isPromQLSuggestionMessage({
        type: 'promql_suggestion',
        // missing editorId and query
      })
    ).toBe(false);
  });
});
