import {
  ASSISTANT_ALLOWED_ORIGIN,
  ASSISTANT_IFRAME_URL,
  AUTO_CLOSE_OVERLAY_ON_INSERT,
  OVERLAY_APPEARANCE,
  OVERLAY_IFRAME_TITLE,
  OVERLAY_STRINGS
} from '../config';
import type { EditorContext } from '../types';
import overlayTemplate from './overlay.html?raw';
import overlayStyles from '../styles/overlay.css?raw';

export interface OverlayOpenPayload {
  editorId: string;
  currentQuery: string;
  datasource: EditorContext['datasource'];
}

export interface SuggestionPayload {
  editorId: string;
  query: string;
}

interface OverlayCallbacks {
  onSuggestion: (payload: SuggestionPayload) => void;
  onClose?: () => void;
}

export class OverlayController {
  private root: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private visible = false;
  private pendingContext: OverlayOpenPayload | null = null;
  private readonly iframeUrl: string;
  private readonly allowedOrigin: string;
  private readonly autoClose: boolean;

  constructor(private readonly callbacks: OverlayCallbacks) {
    this.iframeUrl = ASSISTANT_IFRAME_URL;
    this.allowedOrigin = ASSISTANT_ALLOWED_ORIGIN;
    this.autoClose = AUTO_CLOSE_OVERLAY_ON_INSERT;
  }

  open(context: OverlayOpenPayload): void {
    this.ensureOverlay();
    this.pendingContext = context;
    this.visible = true;
    this.root?.classList.add('prom-ai-visible');
    this.postContext();
  }

  close(): void {
    this.visible = false;
    this.root?.classList.remove('prom-ai-visible');
    this.callbacks.onClose?.();
  }

  isOpen(): boolean {
    return this.visible;
  }

  handleAssistantMessage(event: MessageEvent): void {
    if (event.origin !== this.allowedOrigin) {
      return;
    }

    const payload = event.data;
    if (!payload || typeof payload !== 'object') {
      return;
    }

    if (payload.type === 'promql_suggestion' && typeof payload.query === 'string') {
      const editorId = typeof payload.editorId === 'string' ? payload.editorId : this.pendingContext?.editorId;
      if (!editorId) {
        return;
      }
      this.callbacks.onSuggestion({ editorId, query: payload.query });
      if (this.autoClose) {
        this.close();
      }
    }
  }

  private ensureOverlay(): void {
    if (this.root) {
      return;
    }

    injectOverlayStyles();

    const root = document.createElement('div');
    root.id = 'prom-ai-overlay-root';
    root.style.zIndex = String(OVERLAY_APPEARANCE.zIndex);
    root.style.setProperty('--prom-ai-overlay-width', `${OVERLAY_APPEARANCE.width}px`);
    root.style.setProperty('--prom-ai-overlay-min-height', `${OVERLAY_APPEARANCE.minHeight}px`);
    root.innerHTML = overlayTemplate;

    const title = root.querySelector<HTMLElement>('#prom-ai-overlay-title');
    if (title) {
      title.textContent = OVERLAY_STRINGS.title;
    }

    const iframe = root.querySelector<HTMLIFrameElement>('iframe[data-role="assistant-frame"]');
    if (iframe) {
      iframe.title = OVERLAY_IFRAME_TITLE;
      iframe.src = this.iframeUrl;
      iframe.addEventListener('load', () => this.postContext());
    }

    const closeButton = root.querySelector<HTMLButtonElement>('button[data-role="overlay-close"]');
    closeButton?.addEventListener('click', () => this.close());

    const backdrop = root.querySelector<HTMLElement>('[data-role="overlay-backdrop"]');
    backdrop?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.visible) {
        this.close();
      }
    });

    document.body.appendChild(root);
    this.root = root as HTMLDivElement;
    this.iframe = iframe ?? null;
  }

  private postContext(): void {
    if (!this.pendingContext || !this.iframe?.contentWindow) {
      return;
    }

    const message = {
      type: 'promql_context',
      ...this.pendingContext
    } as const;

    this.iframe.contentWindow.postMessage(message, this.allowedOrigin);
  }
}

let overlayStylesInjected = false;

function injectOverlayStyles(): void {
  if (overlayStylesInjected) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'prom-ai-overlay-styles';
  style.textContent = overlayStyles;
  document.head.appendChild(style);
  overlayStylesInjected = true;
}
