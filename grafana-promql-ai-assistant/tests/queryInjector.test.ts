/**
 * Tests for query injection functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { setPromQuery, getPromQuery } from '../src/queryInjector';
import type { EditorContext } from '../src/types';

describe('queryInjector', () => {
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

  it('should set query in Monaco textarea', () => {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.className = 'monaco-mouse-cursor-text';
    textarea.value = 'old query';
    container.appendChild(textarea);

    const context: EditorContext = {
      editorId: 'test-1',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    setPromQuery(context, 'new query');
    expect(textarea.value).toBe('new query');
  });

  it('should set query in CodeMirror textarea', () => {
    const container = document.createElement('div');
    const cmDiv = document.createElement('div');
    cmDiv.className = 'CodeMirror';
    const textarea = document.createElement('textarea');
    textarea.value = 'old query';
    cmDiv.appendChild(textarea);
    container.appendChild(cmDiv);

    const context: EditorContext = {
      editorId: 'test-2',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    setPromQuery(context, 'new query');
    expect(textarea.value).toBe('new query');
  });

  it('should set query in plain textarea', () => {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.value = 'old query';
    container.appendChild(textarea);

    const context: EditorContext = {
      editorId: 'test-3',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    setPromQuery(context, 'new query');
    expect(textarea.value).toBe('new query');
  });

  it('should dispatch input and change events', () => {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.value = 'old query';
    container.appendChild(textarea);

    let inputFired = false;
    let changeFired = false;

    textarea.addEventListener('input', () => {
      inputFired = true;
    });
    textarea.addEventListener('change', () => {
      changeFired = true;
    });

    const context: EditorContext = {
      editorId: 'test-4',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    setPromQuery(context, 'new query');
    expect(inputFired).toBe(true);
    expect(changeFired).toBe(true);
  });

  it('should get query from Monaco textarea', () => {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.className = 'monaco-mouse-cursor-text';
    textarea.value = 'test query';
    container.appendChild(textarea);

    const context: EditorContext = {
      editorId: 'test-5',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    expect(getPromQuery(context)).toBe('test query');
  });

  it('should get query from plain textarea', () => {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.value = 'test query 2';
    container.appendChild(textarea);

    const context: EditorContext = {
      editorId: 'test-6',
      rootElement: container,
      getQuery: () => '',
      setQuery: () => {},
    };

    expect(getPromQuery(context)).toBe('test query 2');
  });
});
