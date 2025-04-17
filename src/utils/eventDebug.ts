
// Track modal state
const openModals: Set<string> = new Set();
const overlayTimeouts: Record<string, number> = {};

/**
 * Cleans up any stale dialogs or modals that might be stuck in the DOM
 * Only runs when explicitly called and confirms no active overlays exist
 */
export const cleanupModals = () => {
  console.log("Attempting to clean up modals...");
  
  // Check if there are any open dialogs or sheets
  const openDialogs = document.querySelectorAll('[data-state="open"]');
  
  if (openDialogs.length > 0) {
    console.log("Found open dialogs/overlays, skipping cleanup");
    return;
  }
  
  // Cleanup backdrop/overlay elements that might be stuck
  const overlays = document.querySelectorAll('[role="presentation"]');
  if (overlays.length > 0) {
    console.log(`Found ${overlays.length} overlay elements that need cleanup`);
    
    overlays.forEach(overlay => {
      // Only remove overlays that don't have open:true attribute
      // and don't have data-state="open" to avoid breaking active modals
      const isActiveOverlay = overlay.hasAttribute('data-state') && 
                             overlay.getAttribute('data-state') === 'open';
                             
      if (!isActiveOverlay) {
        console.log("Cleaning up overlay element", overlay);
        overlay.remove();
      }
    });
  } else {
    console.log("No overlay elements found");
  }
  
  // Clear any modal tracking data
  openModals.clear();
  
  // Clear any lingering timeouts
  Object.values(overlayTimeouts).forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  
  console.log("Modal cleanup completed");
};

/**
 * Register a modal as open to prevent premature cleanup
 */
export const registerModalOpen = (id: string) => {
  openModals.add(id);
  
  // Clear any existing timeout for this modal
  if (overlayTimeouts[id]) {
    clearTimeout(overlayTimeouts[id]);
    delete overlayTimeouts[id];
  }
  
  console.log(`Modal registered as open: ${id}. Total open: ${openModals.size}`);
};

/**
 * Register a modal as closed and schedule cleanup if needed
 */
export const registerModalClosed = (id: string) => {
  openModals.delete(id);
  
  // Schedule cleanup check with a delay to allow animations
  overlayTimeouts[id] = window.setTimeout(() => {
    if (openModals.size === 0) {
      cleanupModals();
    }
    delete overlayTimeouts[id];
  }, 500); // Delay to allow animations to complete
  
  console.log(`Modal registered as closed: ${id}. Total open: ${openModals.size}`);
};

/**
 * Fixes any sheet or dialog overlays that might be stuck
 */
export const fixSheetOverlays = () => {
  console.log("Found sheet/dialog overlays to fix:", document.querySelectorAll('[role="presentation"]').length);
  // This is just a wrapper for cleanupModals to maintain backwards compatibility
  cleanupModals();
};
