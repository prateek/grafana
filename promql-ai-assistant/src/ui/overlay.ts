import { ASSISTANT_IFRAME_URL, ASSISTANT_OVERLAY_TITLE } from '../config';
import overlayTemplate from './overlay.html?raw';

export interface OverlayOpenOptions {
  title?: string;
}

export class OverlayController {
  private root?: HTMLElement;
  private assistantFrame?: HTMLIFrameElement;
  private titleEl?: HTMLElement;
  private closeHandlers = new Set<() => void>();

  open(options: OverlayOpenOptions = {}): Promise<HTMLIFrameElement | null> {
    this.ensureMounted();
    if (!this.root) {
      return Promise.resolve(null);
    }
    this.root.hidden = false;
    if (options.title) {
      this.setTitle(options.title);
    }
    return Promise.resolve(this.ensureAssistantFrame());
  }

  close(): void {
    if (!this.root) {
      return;
    }
    this.root.hidden = true;
    for (const handler of this.closeHandlers) {
      handler();
    }
  }

  isOpen(): boolean {
    return Boolean(this.root && !this.root.hidden);
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  getAssistantFrame(): HTMLIFrameElement | null {
    return this.assistantFrame ?? null;
  }

  private ensureMounted(): void {
    if (this.root) {
      return;
    }
    const template = document.createElement('template');
    template.innerHTML = overlayTemplate.trim();
    const element = template.content.firstElementChild;
    if (!(element instanceof HTMLElement)) {
      throw new Error('Overlay template is missing a root element.');
    }

    this.root = element;
    this.assistantFrame = element.querySelector('[data-prom-ai-assistant-frame]') as HTMLIFrameElement;
    this.titleEl = element.querySelector('[data-prom-ai-overlay-title]') as HTMLElement;

    const closeTargets = element.querySelectorAll('[data-prom-ai-overlay-close]');
    closeTargets.forEach((closeEl) => closeEl.addEventListener('click', () => this.close()));

    document.body.appendChild(element);
  }

  private ensureAssistantFrame(): HTMLIFrameElement | null {
    if (!this.assistantFrame) {
      return null;
    }

    const currentSrc = this.assistantFrame.getAttribute('src');
    if (!currentSrc || currentSrc === 'about:blank') {
      this.assistantFrame.src = ASSISTANT_IFRAME_URL;
    }

    return this.assistantFrame;
  }

  private setTitle(title: string) {
    if (!this.titleEl) {
      return;
    }
    this.titleEl.textContent = title || ASSISTANT_OVERLAY_TITLE;
  }
}
