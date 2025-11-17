/**
 * Overlay UI Script
 *
 * This script runs inside the overlay.html context.
 * Currently minimal as most logic is in overlayManager.ts
 * which creates the overlay dynamically in the content script.
 *
 * This file is mainly for future extensibility if we need
 * a separate overlay window or popup.
 */

// This file is intentionally minimal as the overlay is created
// and managed by overlayManager.ts in the content script context.
// If in the future we need to make this a separate popup or window,
// we can add logic here.

console.log('[PromQL AI] Overlay script loaded');

// Handle close button if this were rendered directly
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }
});
