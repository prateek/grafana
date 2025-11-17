/**
 * Prometheus Query Editor Detector
 *
 * This module detects Prometheus query editors in Grafana's DOM.
 * It's designed to be defensive and work across different Grafana versions.
 *
 * Detection strategy:
 * 1. Find potential query editor containers using configurable selectors
 * 2. Verify they're Prometheus editors (not other datasources)
 * 3. Locate the query input element within each container
 * 4. Determine the editor type (Monaco, CodeMirror, or plain textarea)
 * 5. Find the toolbar area for button injection
 */

import { CONFIG, logger } from '@/config';
import type { DetectionResult, EditorType } from '@/types';

/**
 * Detects all Prometheus query editors currently in the DOM
 * @returns Array of detection results for each found editor
 */
export function findEditors(): DetectionResult[] {
  logger.log('Starting editor detection...');

  const containers = findEditorContainers();
  logger.log(`Found ${containers.length} potential editor containers`);

  const results: DetectionResult[] = [];

  for (const container of containers) {
    const result = analyzeContainer(container);
    if (result.found) {
      results.push(result);
      logger.log('Valid Prometheus editor detected:', {
        editorType: result.editorType,
        hasToolbar: !!result.toolbar,
      });
    }
  }

  logger.log(`Detection complete: ${results.length} Prometheus editors found`);
  return results;
}

/**
 * Find all potential query editor containers in the DOM
 */
function findEditorContainers(): HTMLElement[] {
  const containers: HTMLElement[] = [];
  const selectors = CONFIG.PROM_EDITOR_SELECTORS.containerSelectors;

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      containers.push(...Array.from(elements));
    } catch (error) {
      logger.warn(`Invalid selector "${selector}":`, error);
    }
  }

  // Remove duplicates (an element might match multiple selectors)
  return Array.from(new Set(containers));
}

/**
 * Analyze a container to determine if it's a valid Prometheus editor
 */
function analyzeContainer(container: HTMLElement): DetectionResult {
  // Check if this container is actually for Prometheus
  if (!isPrometheusEditor(container)) {
    return createNegativeResult();
  }

  // Find the query input element
  const queryInput = findQueryInput(container);
  if (!queryInput) {
    logger.warn('Container appears to be Prometheus editor but no input found');
    return createNegativeResult();
  }

  // Determine editor type
  const editorType = detectEditorType(queryInput);

  // Find toolbar for button injection
  const toolbar = findToolbar(container);

  return {
    found: true,
    container,
    queryInput,
    editorType,
    toolbar,
  };
}

/**
 * Check if a container is a Prometheus query editor
 */
function isPrometheusEditor(container: HTMLElement): boolean {
  // Strategy 1: Check data attributes
  if (container.dataset.testid?.includes('prometheus')) return true;
  if (container.dataset.datasourceType === 'prometheus') return true;
  if (container.dataset.pluginId === 'prometheus') return true;

  // Strategy 2: Look for Prometheus-related text in labels or selects
  const labels = container.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent?.toLowerCase().includes('prometheus')) {
      return true;
    }
  }

  // Strategy 3: Check for selected datasource in dropdowns
  const selects = container.querySelectorAll('select');
  for (const select of selects) {
    const selectedOption = select.querySelector('option:checked');
    if (
      selectedOption?.value.toLowerCase().includes('prometheus') ||
      selectedOption?.textContent?.toLowerCase().includes('prometheus')
    ) {
      return true;
    }
  }

  // Strategy 4: Check for Prometheus in any descendant text or attributes
  // (more aggressive, might have false positives)
  const textContent = container.textContent?.toLowerCase() || '';
  const hasPrometheusText = textContent.includes('prometheus') || textContent.includes('promql');

  // Also check all data attributes
  const allDataAttrs = Array.from(container.querySelectorAll('[data-testid], [data-datasource]'));
  const hasPrometheusAttr = allDataAttrs.some((el) => {
    return Array.from(el.attributes).some(
      (attr) =>
        attr.name.startsWith('data-') &&
        attr.value.toLowerCase().includes('prometheus')
    );
  });

  return hasPrometheusText || hasPrometheusAttr;
}

/**
 * Find the query input element within a container
 */
function findQueryInput(container: HTMLElement): HTMLElement | null {
  const selectors = CONFIG.PROM_EDITOR_SELECTORS.queryInputSelectors;

  for (const selector of selectors) {
    try {
      const element = container.querySelector<HTMLElement>(selector);
      if (element) {
        logger.log(`Found query input using selector: ${selector}`);
        return element;
      }
    } catch (error) {
      logger.warn(`Invalid query input selector "${selector}":`, error);
    }
  }

  // Fallback: look for any textarea or contenteditable
  const textarea = container.querySelector<HTMLElement>('textarea');
  if (textarea) {
    logger.log('Found query input using fallback textarea');
    return textarea;
  }

  const contentEditable = container.querySelector<HTMLElement>('[contenteditable="true"]');
  if (contentEditable) {
    logger.log('Found query input using fallback contenteditable');
    return contentEditable;
  }

  return null;
}

/**
 * Detect the type of editor (Monaco, CodeMirror, or textarea)
 */
function detectEditorType(inputElement: HTMLElement): EditorType {
  // Check for Monaco
  if (inputElement.closest('.monaco-editor')) {
    return 'monaco';
  }

  // Check for CodeMirror
  if (inputElement.closest('.CodeMirror') || (inputElement as any).CodeMirror) {
    return 'codemirror';
  }

  // Check if it's a plain textarea
  if (inputElement.tagName === 'TEXTAREA') {
    return 'textarea';
  }

  // Unknown type
  logger.warn('Could not determine editor type, defaulting to unknown');
  return 'unknown';
}

/**
 * Find the toolbar area where we can inject our button
 */
function findToolbar(container: HTMLElement): HTMLElement | null {
  const selectors = CONFIG.PROM_EDITOR_SELECTORS.toolbarSelectors;

  for (const selector of selectors) {
    try {
      const toolbar = container.querySelector<HTMLElement>(selector);
      if (toolbar) {
        logger.log(`Found toolbar using selector: ${selector}`);
        return toolbar;
      }
    } catch (error) {
      logger.warn(`Invalid toolbar selector "${selector}":`, error);
    }
  }

  // Fallback: try to find any element with "action" or "toolbar" in class name
  const allDivs = container.querySelectorAll<HTMLElement>('div[class*="action"], div[class*="toolbar"]');
  if (allDivs.length > 0) {
    logger.log('Found toolbar using fallback class name search');
    return allDivs[0];
  }

  // Last resort: use the container itself
  logger.warn('No toolbar found, will use container as fallback');
  return container;
}

/**
 * Create a negative detection result
 */
function createNegativeResult(): DetectionResult {
  return {
    found: false,
    container: null,
    queryInput: null,
    editorType: 'unknown',
    toolbar: null,
  };
}

/**
 * Generate a unique ID for an editor based on its position in the DOM
 */
export function generateEditorId(container: HTMLElement): string {
  // Try to use existing IDs
  if (container.id) {
    return `editor-${container.id}`;
  }

  // Try data-panel-id or data-testid
  if (container.dataset.panelId) {
    return `editor-panel-${container.dataset.panelId}`;
  }

  if (container.dataset.testid) {
    return `editor-${container.dataset.testid}`;
  }

  // Fallback: generate based on position
  const allContainers = Array.from(document.querySelectorAll('.query-editor-row, .query-editor'));
  const index = allContainers.indexOf(container);

  return `editor-${index >= 0 ? index : Date.now()}`;
}
