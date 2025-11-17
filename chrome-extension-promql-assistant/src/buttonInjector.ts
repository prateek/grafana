/**
 * Button injection module.
 * Handles injecting AI Assistant buttons into Prometheus query editors.
 */

import { BUTTON_LABEL } from './config';
import type { EditorContext } from './types';

/**
 * Creates the AI Assistant button element.
 */
function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'prom-ai-assistant-button';
  button.type = 'button';
  button.textContent = BUTTON_LABEL;

  // Add a simple icon (SVG sparkle/star icon)
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.style.marginRight = '4px';
  icon.style.verticalAlign = 'middle';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z'
  );
  path.setAttribute('fill', 'currentColor');
  icon.appendChild(path);

  button.insertBefore(icon, button.firstChild);

  return button;
}

/**
 * Finds the toolbar/action area in a query editor where buttons should be injected.
 * This looks for common Grafana UI patterns.
 */
function findToolbarArea(container: HTMLElement): HTMLElement | null {
  // Common selectors for toolbar/action areas in Grafana query editors
  const toolbarSelectors = [
    '.query-row-actions', // Common action button container
    '.gf-form-button-row', // Grafana form button row
    '.query-editor-row-actions', // Alternative pattern
    '[class*="query-row"] [class*="action"]', // Generic action container
    '.gf-form', // Grafana form container (fallback)
  ];

  for (const selector of toolbarSelectors) {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  // Fallback: look for any button container or create one
  const buttonContainer = container.querySelector<HTMLElement>('.gf-form-button-row');
  if (buttonContainer) {
    return buttonContainer;
  }

  // Last resort: return the container itself
  return container;
}

/**
 * Checks if a button has already been injected for this editor.
 */
function hasButton(container: HTMLElement): boolean {
  return container.querySelector('.prom-ai-assistant-button') !== null;
}

/**
 * Injects an AI Assistant button into a query editor.
 * Returns the button element if successful, null otherwise.
 */
export function injectButton(
  editorContext: EditorContext,
  onClick: (editorContext: EditorContext) => void
): HTMLButtonElement | null {
  const { rootElement } = editorContext;

  // Check if button already exists
  if (hasButton(rootElement)) {
    const existingButton = rootElement.querySelector<HTMLButtonElement>('.prom-ai-assistant-button');
    if (existingButton) {
      editorContext.buttonElement = existingButton;
      return existingButton;
    }
  }

  // Find where to inject the button
  const toolbarArea = findToolbarArea(rootElement);
  if (!toolbarArea) {
    console.warn('[PromQL Assistant] Could not find toolbar area for button injection');
    return null;
  }

  // Create and inject the button
  const button = createButton();
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(editorContext);
  });

  toolbarArea.appendChild(button);
  editorContext.buttonElement = button;

  return button;
}

/**
 * Removes the injected button from an editor.
 */
export function removeButton(editorContext: EditorContext): void {
  if (editorContext.buttonElement) {
    editorContext.buttonElement.remove();
    editorContext.buttonElement = undefined;
  } else {
    const button = editorContext.rootElement.querySelector<HTMLButtonElement>('.prom-ai-assistant-button');
    if (button) {
      button.remove();
    }
  }
}
