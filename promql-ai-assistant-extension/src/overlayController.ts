import {
  ASSISTANT_IFRAME_URL,
  IFRAME_ALLOWED_ORIGIN,
  OVERLAY_ROOT_ID,
  AUTO_CLOSE_OVERLAY_ON_INSERT,
} from './config';
import { EditorContext, getPromQuery } from './promEditorDetector';

export type OverlayContextPayload = {
  editorId: string;
  datasource: string;
  currentQuery: string;
};

type OverlayOptions = {
  onClose?: () => void;
};

export class OverlayController {
  private root: HTMLElement;
  private iframe: HTMLIFrameElement;
  private isIframeReady = false;
  private pendingContext: OverlayContextPayload | null = null;
  private activeEditorId: string | null = null;
  private onClose?: () => void;

  constructor(options: OverlayOptions = {}) {
    this.onClose = options.onClose;
    const existing = document.getElementById(OVERLAY_ROOT_ID);
    if (existing) {
      this.root = existing;
      this.iframe = existing.querySelector('iframe') as HTMLIFrameElement;
    } else {
      const { root, iframe } = this.createOverlayDOM();
      this.root = root;
      this.iframe = iframe;
    }
  }

  openForEditor(editor: EditorContext) {
    this.activeEditorId = editor.id;
    this.root.classList.add('prom-ai-open');
    const payload: OverlayContextPayload = {
      editorId: editor.id,
      datasource: 'prometheus',
      currentQuery: getPromQuery(editor),
    };
    this.sendContext(payload);
  }

  close() {
    this.activeEditorId = null;
    this.root.classList.remove('prom-ai-open');
    this.onClose?.();
  }

  markIframeReady() {
    this.isIframeReady = true;
    if (this.pendingContext) {
      this.postContext(this.pendingContext);
      this.pendingContext = null;
    }
  }

  sendContext(payload: OverlayContextPayload) {
    if (!this.isIframeReady) {
      this.pendingContext = payload;
      return;
    }
    this.postContext(payload);
  }

  private postContext(payload: OverlayContextPayload) {
    this.iframe.contentWindow?.postMessage(
      {
        type: 'promql_context',
        ...payload,
      },
      IFRAME_ALLOWED_ORIGIN === 'null' ? '*' : IFRAME_ALLOWED_ORIGIN,
    );
  }

  getCurrentEditorId() {
    return this.activeEditorId;
  }

  getIframeOrigin() {
    return IFRAME_ALLOWED_ORIGIN;
  }

  shouldAutoCloseAfterInsert() {
    return AUTO_CLOSE_OVERLAY_ON_INSERT;
  }

  getIframeElement() {
    return this.iframe;
  }

  private createOverlayDOM() {
    const root = document.createElement('div');
    root.id = OVERLAY_ROOT_ID;

    const backdrop = document.createElement('div');
    backdrop.className = 'prom-ai-overlay-backdrop';
    backdrop.addEventListener('click', () => this.close());

    const panel = document.createElement('div');
    panel.className = 'prom-ai-overlay-panel';

    const header = document.createElement('div');
    header.className = 'prom-ai-overlay-header';
    header.textContent = 'PromQL Assistant';

    const closeButton = document.createElement('button');
    closeButton.className = 'prom-ai-overlay-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close PromQL Assistant');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.close());
    header.appendChild(closeButton);

    const body = document.createElement('div');
    body.className = 'prom-ai-overlay-body';

    const iframe = document.createElement('iframe');
    iframe.src = ASSISTANT_IFRAME_URL;
    iframe.referrerPolicy = 'no-referrer';
    iframe.setAttribute('aria-label', 'PromQL assistant chat');
    iframe.allow = 'clipboard-write';
    body.appendChild(iframe);

    panel.appendChild(header);
    panel.appendChild(body);

    root.appendChild(backdrop);
    root.appendChild(panel);
    document.body.appendChild(root);

    return { root, iframe };
  }
}
