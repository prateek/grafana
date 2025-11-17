import { BUTTON_LABEL } from './config';
import { EditorContext } from './promEditorDetector';

const BUTTON_CLASS = 'prom-ai-assistant-button';

export type ButtonHandler = (context: EditorContext) => void;

export function ensureAssistantButton(context: EditorContext, onClick: ButtonHandler): HTMLButtonElement {
  const toolbar = context.toolbar ?? context.root;
  const existing = toolbar.querySelector<HTMLButtonElement>(
    `.${BUTTON_CLASS}[data-prom-ai-editor-id="${context.id}"]`,
  );
  if (existing) {
    return existing;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = BUTTON_CLASS;
  button.dataset.promAiEditorId = context.id;
  button.innerHTML = `${assistantSvg()}<span>${BUTTON_LABEL}</span>`;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick(context);
  });

  toolbar.appendChild(button);
  return button;
}

export function removeAssistantButton(context: EditorContext) {
  const toolbar = context.toolbar ?? context.root;
  const button = toolbar.querySelector<HTMLButtonElement>(
    `.${BUTTON_CLASS}[data-prom-ai-editor-id="${context.id}"]`,
  );
  button?.remove();
}

function assistantSvg() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 2a10 10 0 0 0-7.07 17.07l-1 2.93 2.93-1A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-5.66 13.66l-.3-.3-.5.16.16-.5-.3-.3A8 8 0 0 1 12 4Zm-1 4h2v5h-2Zm0 6h2v2h-2Z"/>
  </svg>`;
}
