/**
 * Button Injector
 *
 * Handles injecting the AI Assistant button into Prometheus query editors.
 * Ensures idempotency and proper styling.
 */

import { config, debugLog, debugError } from './config';
import type { EditorContext } from './types';

// CSS class for the injected button to avoid conflicts
const BUTTON_CLASS = 'prom-ai-assistant-button';
const BUTTON_CONTAINER_CLASS = 'prom-ai-assistant-button-container';

/**
 * Inject the AI Assistant button into an editor
 * @param editor The editor context
 * @param onClickCallback Callback when button is clicked
 * @returns The created button element, or null if injection failed
 */
export function injectAssistantButton(
  editor: EditorContext,
  onClickCallback: (editorId: string) => void
): HTMLButtonElement | null {
  // Check if button already exists
  if (editor.assistantButton && document.body.contains(editor.assistantButton)) {
    debugLog('Button already exists for editor:', editor.id);
    return editor.assistantButton;
  }

  // Find the toolbar area to inject into
  const toolbar = findToolbarElement(editor.rootElement);
  if (!toolbar) {
    debugError('Could not find toolbar for editor:', editor.id);
    return null;
  }

  // Create the button
  const button = createButton(editor.id, onClickCallback);

  // Create a container for the button to isolate it
  const container = document.createElement('div');
  container.className = BUTTON_CONTAINER_CLASS;
  container.appendChild(button);

  // Inject into toolbar
  toolbar.appendChild(container);

  // Store reference in editor context
  editor.assistantButton = button;

  debugLog('Injected AI button for editor:', editor.id);
  return button;
}

/**
 * Find the toolbar element within an editor container
 * @param container The editor root element
 * @returns The toolbar element, or null if not found
 */
function findToolbarElement(container: HTMLElement): HTMLElement | null {
  const { toolbarSelectors } = config.PROM_EDITOR_SELECTORS;

  // Try each toolbar selector
  for (const selector of toolbarSelectors) {
    const toolbar = container.querySelector(selector);
    if (toolbar instanceof HTMLElement) {
      return toolbar;
    }
  }

  // Fallback: look for common button containers
  const fallbackSelectors = [
    '.query-editor-row__actions',
    '.query-editor__actions',
    '[class*="toolbar"]',
    '[class*="actions"]',
  ];

  for (const selector of fallbackSelectors) {
    const element = container.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }
  }

  // Last resort: use the container itself
  return container;
}

/**
 * Create the AI Assistant button element
 * @param editorId The editor ID this button is for
 * @param onClick Click callback
 * @returns The button element
 */
function createButton(
  editorId: string,
  onClick: (editorId: string) => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = BUTTON_CLASS;
  button.type = 'button';
  button.setAttribute('data-editor-id', editorId);
  button.setAttribute('aria-label', 'Open AI Assistant for PromQL query building');
  button.title = 'Get AI assistance with your PromQL query';

  // Add button content
  button.innerHTML = `
    <span class="prom-ai-assistant-button__icon">
      ${getIconSVG()}
    </span>
    <span class="prom-ai-assistant-button__label">
      ${config.UI.BUTTON_LABEL}
    </span>
  `;

  // Attach click handler
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick(editorId);
  });

  return button;
}

/**
 * Get the SVG icon for the button
 * Using a simple sparkles icon to indicate AI
 */
function getIconSVG(): string {
  return `
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="prom-ai-assistant-button__svg"
    >
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M19 3L20 6L23 7L20 8L19 11L18 8L15 7L18 6L19 3Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  `;
}

/**
 * Remove the button from an editor
 * @param editor The editor context
 */
export function removeAssistantButton(editor: EditorContext): void {
  if (editor.assistantButton) {
    // Remove the container if it exists
    const container = editor.assistantButton.closest(`.${BUTTON_CONTAINER_CLASS}`);
    if (container) {
      container.remove();
    } else {
      editor.assistantButton.remove();
    }
    editor.assistantButton = undefined;
    debugLog('Removed AI button for editor:', editor.id);
  }
}

/**
 * Check if an editor has the button injected
 * @param editor The editor context
 * @returns True if button exists and is in the DOM
 */
export function hasAssistantButton(editor: EditorContext): boolean {
  return !!(editor.assistantButton && document.body.contains(editor.assistantButton));
}
