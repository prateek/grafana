/**
 * Button Injector
 *
 * Injects the "AI Assistant" button into Prometheus query editor toolbars.
 * Ensures idempotency (no duplicate buttons) and clean styling.
 */

import { CONFIG, logger } from '@/config';
import type { EditorContext } from '@/types';

// Marker attribute to track injected buttons
const BUTTON_MARKER = 'data-prom-ai-button';

/**
 * Inject the AI Assistant button into an editor's toolbar
 * Returns the created button element, or null if injection failed
 */
export function injectButton(
  editor: EditorContext,
  onClickCallback: (editorId: string) => void
): HTMLElement | null {
  // Check if button already exists
  if (editor.injectedButton && document.body.contains(editor.injectedButton)) {
    logger.log(`Button already exists for editor ${editor.id}`);
    return editor.injectedButton;
  }

  // Find toolbar (or use container as fallback)
  const toolbar = findToolbarElement(editor);
  if (!toolbar) {
    logger.warn(`No toolbar found for editor ${editor.id}, cannot inject button`);
    return null;
  }

  // Check if we've already injected a button in this toolbar
  const existingButton = toolbar.querySelector<HTMLElement>(`[${BUTTON_MARKER}="${editor.id}"]`);
  if (existingButton) {
    logger.log(`Button already injected in toolbar for editor ${editor.id}`);
    return existingButton;
  }

  // Create the button
  const button = createButton(editor.id, onClickCallback);

  // Inject into toolbar
  injectIntoToolbar(toolbar, button);

  logger.log(`Injected AI Assistant button for editor ${editor.id}`);
  return button;
}

/**
 * Remove an injected button
 */
export function removeButton(editor: EditorContext): void {
  if (editor.injectedButton && document.body.contains(editor.injectedButton)) {
    editor.injectedButton.remove();
    logger.log(`Removed button for editor ${editor.id}`);
  }
}

/**
 * Find the toolbar element for an editor
 */
function findToolbarElement(editor: EditorContext): HTMLElement | null {
  // First, check if we detected a specific toolbar
  if (editor.rootElement.querySelector('[class*="toolbar"]')) {
    return editor.rootElement.querySelector<HTMLElement>('[class*="toolbar"]');
  }

  // Look for action containers
  const actionContainers = editor.rootElement.querySelectorAll<HTMLElement>(
    '[class*="action"], [class*="button"]'
  );

  // Find the one that contains actual buttons
  for (const container of actionContainers) {
    if (container.querySelector('button')) {
      return container;
    }
  }

  // Fallback: use the root element
  return editor.rootElement;
}

/**
 * Create the AI Assistant button element
 */
function createButton(editorId: string, onClick: (editorId: string) => void): HTMLElement {
  const button = document.createElement('button');

  // Set attributes
  button.setAttribute(BUTTON_MARKER, editorId);
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', CONFIG.BUTTON_CONFIG.label);
  button.className = CONFIG.BUTTON_CONFIG.className;

  // Add icon and text
  button.innerHTML = `
    ${CONFIG.BUTTON_CONFIG.iconSvg}
    <span class="button-text">${CONFIG.BUTTON_CONFIG.label}</span>
  `;

  // Attach click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log(`AI Assistant button clicked for editor ${editorId}`);
    onClick(editorId);
  });

  return button;
}

/**
 * Inject the button into the toolbar in an appropriate location
 */
function injectIntoToolbar(toolbar: HTMLElement, button: HTMLElement): void {
  // Strategy 1: If toolbar has existing buttons, append after them
  const existingButtons = toolbar.querySelectorAll('button');
  if (existingButtons.length > 0) {
    const lastButton = existingButtons[existingButtons.length - 1];
    lastButton.parentElement?.appendChild(button);
    return;
  }

  // Strategy 2: Look for a flex/button container
  const flexContainers = toolbar.querySelectorAll('[class*="flex"], [class*="button-group"]');
  if (flexContainers.length > 0) {
    flexContainers[0].appendChild(button);
    return;
  }

  // Strategy 3: Create a wrapper div to avoid breaking layout
  const wrapper = document.createElement('div');
  wrapper.className = 'prom-ai-button-wrapper';
  wrapper.appendChild(button);
  toolbar.appendChild(wrapper);
}

/**
 * Update button state (e.g., show loading, disabled, etc.)
 */
export function updateButtonState(
  button: HTMLElement,
  state: 'default' | 'loading' | 'disabled'
): void {
  button.classList.remove('loading', 'disabled');

  switch (state) {
    case 'loading':
      button.classList.add('loading');
      button.setAttribute('disabled', 'true');
      break;
    case 'disabled':
      button.classList.add('disabled');
      button.setAttribute('disabled', 'true');
      break;
    case 'default':
      button.removeAttribute('disabled');
      break;
  }
}
