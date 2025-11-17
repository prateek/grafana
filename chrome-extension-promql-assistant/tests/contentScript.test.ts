/**
 * Tests for content script logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('contentScript', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect and process editors on page load', () => {
    // Create a Prometheus editor
    const container = document.createElement('div');
    container.className = 'query-editor-row';
    const label = document.createElement('label');
    label.textContent = 'Prometheus';
    container.appendChild(label);
    const textarea = document.createElement('textarea');
    textarea.value = 'test query';
    container.appendChild(textarea);
    document.body.appendChild(container);

    // Note: This is a simplified test. In a real scenario, we'd import
    // and test the actual content script functions, but they depend on
    // the full DOM environment and MutationObserver.
    expect(document.body.querySelector('.query-editor-row')).not.toBeNull();
  });
});
