import { describe, expect, it } from 'vitest';
import { OverlayController } from '../src/ui/overlay';

function resetDom() {
  document.body.innerHTML = '';
}

describe('OverlayController', () => {
  it('mounts, opens, and closes the overlay', async () => {
    resetDom();
    const controller = new OverlayController();
    const frame = await controller.open();
    expect(frame).toBeInstanceOf(HTMLIFrameElement);
    expect(controller.isOpen()).toBe(true);
    controller.close();
    expect(controller.isOpen()).toBe(false);
  });
});
