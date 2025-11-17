import { ASSISTANT_BUTTON_LABEL } from '../config';
import type { EditorContext } from '../types/editor';

const BUTTON_ATTRIBUTE = 'data-prom-ai-button';

export interface ButtonOptions {
  onClick: (editor: EditorContext) => void;
}

export function ensureAssistantButton(editor: EditorContext, options: ButtonOptions): HTMLButtonElement {
  const existing = editor.toolbar.querySelector(`[${BUTTON_ATTRIBUTE}="${editor.id}"]`);
  if (existing instanceof HTMLButtonElement) {
    return existing;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'prom-ai-assistant-button';
  button.setAttribute(BUTTON_ATTRIBUTE, editor.id);
  button.title = 'Open the PromQL AI assistant';
  button.innerHTML = `${sparkIcon()}<span>${ASSISTANT_BUTTON_LABEL}</span>`;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    options.onClick(editor);
  });

  editor.toolbar.appendChild(button);
  return button;
}

function sparkIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l1.76 5.42H19l-4.38 3.18L16.38 16 12 12.82 7.62 16l1.76-5.4L5 7.42h5.24z"></path>
    </svg>
  `;
}
