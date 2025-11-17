import { BUTTON_ICON_SVG, BUTTON_LABEL } from '../config';
import type { RegisteredEditor } from '../registry/editorRegistry';
import buttonStyles from '../styles/content.css?raw';

let stylesInjected = false;

function ensureStyles(): void {
  if (stylesInjected) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'prom-ai-button-styles';
  style.textContent = buttonStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function ensureAssistantButton(
  editor: RegisteredEditor,
  onClick: (editor: RegisteredEditor) => void
): HTMLButtonElement {
  ensureStyles();

  if (editor.button && editor.button.isConnected) {
    return editor.button;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'prom-ai-assistant-button';
  button.innerHTML = `${BUTTON_ICON_SVG}<span>${BUTTON_LABEL}</span>`;
  button.dataset.promAiEditorId = editor.id;

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    onClick(editor);
  });

  const host = editor.buttonHost ?? editor.root;
  host.appendChild(button);
  editor.button = button;

  return button;
}
