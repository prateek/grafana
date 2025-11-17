/**
 * Tests for editor registry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { editorRegistry } from '../src/editorRegistry';
import type { EditorContext } from '../src/types';

describe('editorRegistry', () => {
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
    editorRegistry.clear();
  });

  afterEach(() => {
    editorRegistry.clear();
    delete (global as any).document;
    delete (global as any).window;
  });

  it('should register an editor', () => {
    const element = document.createElement('div');
    const context: EditorContext = {
      editorId: 'editor-1',
      rootElement: element,
      getQuery: () => 'query',
      setQuery: () => {},
    };

    editorRegistry.register(context);
    expect(editorRegistry.has('editor-1')).toBe(true);
    expect(editorRegistry.get('editor-1')).toBe(context);
  });

  it('should unregister an editor', () => {
    const element = document.createElement('div');
    const context: EditorContext = {
      editorId: 'editor-2',
      rootElement: element,
      getQuery: () => 'query',
      setQuery: () => {},
    };

    editorRegistry.register(context);
    expect(editorRegistry.has('editor-2')).toBe(true);

    editorRegistry.unregister('editor-2');
    expect(editorRegistry.has('editor-2')).toBe(false);
    expect(editorRegistry.get('editor-2')).toBeUndefined();
  });

  it('should get all registered editors', () => {
    const element1 = document.createElement('div');
    const context1: EditorContext = {
      editorId: 'editor-3',
      rootElement: element1,
      getQuery: () => 'query1',
      setQuery: () => {},
    };

    const element2 = document.createElement('div');
    const context2: EditorContext = {
      editorId: 'editor-4',
      rootElement: element2,
      getQuery: () => 'query2',
      setQuery: () => {},
    };

    editorRegistry.register(context1);
    editorRegistry.register(context2);

    const all = editorRegistry.getAll();
    expect(all.length).toBe(2);
    expect(all).toContain(context1);
    expect(all).toContain(context2);
  });

  it('should cleanup removed editors', () => {
    const element1 = document.createElement('div');
    document.body.appendChild(element1);
    const context1: EditorContext = {
      editorId: 'editor-5',
      rootElement: element1,
      getQuery: () => 'query1',
      setQuery: () => {},
    };

    const element2 = document.createElement('div');
    const context2: EditorContext = {
      editorId: 'editor-6',
      rootElement: element2,
      getQuery: () => 'query2',
      setQuery: () => {},
    };

    editorRegistry.register(context1);
    editorRegistry.register(context2);

    expect(editorRegistry.size()).toBe(2);

    // Remove element1 from DOM
    document.body.removeChild(element1);

    // Cleanup should remove editor-5
    editorRegistry.cleanup();

    expect(editorRegistry.has('editor-5')).toBe(false);
    expect(editorRegistry.has('editor-6')).toBe(true);
    expect(editorRegistry.size()).toBe(1);
  });

  it('should clear all editors', () => {
    const element1 = document.createElement('div');
    const context1: EditorContext = {
      editorId: 'editor-7',
      rootElement: element1,
      getQuery: () => 'query1',
      setQuery: () => {},
    };

    const element2 = document.createElement('div');
    const context2: EditorContext = {
      editorId: 'editor-8',
      rootElement: element2,
      getQuery: () => 'query2',
      setQuery: () => {},
    };

    editorRegistry.register(context1);
    editorRegistry.register(context2);

    expect(editorRegistry.size()).toBe(2);

    editorRegistry.clear();

    expect(editorRegistry.size()).toBe(0);
    expect(editorRegistry.getAll().length).toBe(0);
  });
});
