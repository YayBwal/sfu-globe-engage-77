
/**
 * Utility to help debug UI interaction issues
 */

// This function can be used to test if elements are receiving click events
export const checkInteractivity = (element: HTMLElement) => {
  console.log('Element interactivity check:', element);
  
  // Check for pointer-events: none
  const style = window.getComputedStyle(element);
  const pointerEvents = style.getPropertyValue('pointer-events');
  console.log('Pointer-events style:', pointerEvents);
  
  // Check for overlapping elements
  const rect = element.getBoundingClientRect();
  const elementsAtPoint = document.elementsFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
  
  console.log('Elements at this point:', elementsAtPoint);
  
  // Check for z-index issues
  console.log('Z-index:', style.getPropertyValue('z-index'));
  console.log('Position:', style.getPropertyValue('position'));
  
  return {
    element,
    pointerEvents,
    elementsAtPoint
  };
};

// Add this to window for debugging
if (typeof window !== 'undefined') {
  (window as any).checkInteractivity = checkInteractivity;
}

// Helper to ensure popovers and modals are properly cleaned up
export const cleanupModals = () => {
  // Force remove any lingering modal backdrops or overlays
  const overlays = document.querySelectorAll('[data-state="open"]');
  console.log('Found overlays to clean:', overlays.length);
  
  overlays.forEach(overlay => {
    // Try to find close buttons and click them
    const closeButton = overlay.querySelector('[aria-label="Close"]');
    if (closeButton && closeButton instanceof HTMLElement) {
      closeButton.click();
      console.log('Clicked close button on overlay');
    } else {
      // Force remove the overlay if no close button found
      if (overlay.parentNode && overlay instanceof HTMLElement) {
        overlay.setAttribute('data-state', 'closed');
        console.log('Forced overlay to closed state');
      }
    }
  });
  
  // Also check for any backdrop elements that might be blocking clicks
  const backdrops = document.querySelectorAll('.backdrop, [role="presentation"]');
  backdrops.forEach(backdrop => {
    if (backdrop.parentNode && backdrop instanceof HTMLElement) {
      console.log('Removing potential blocking backdrop');
      backdrop.style.pointerEvents = 'none';
    }
  });
  
  console.log('Modal cleanup completed');
};

// New function to fix sheet overlay issues
export const fixSheetOverlays = () => {
  // Sometimes the sheet overlay remains with pointer-events: auto which blocks clicks
  const sheetOverlays = document.querySelectorAll('[data-radix-sheet-overlay]');
  console.log('Found sheet overlays to fix:', sheetOverlays.length);
  
  sheetOverlays.forEach(overlay => {
    if (overlay instanceof HTMLElement) {
      const state = overlay.getAttribute('data-state');
      console.log('Sheet overlay state:', state);
      
      if (state === 'closed') {
        // Remove the overlay completely if it's closed
        overlay.remove();
        console.log('Removed closed sheet overlay');
      } else if (!state || state !== 'open') {
        // Fix any overlay without proper state
        overlay.style.pointerEvents = 'none';
        console.log('Fixed sheet overlay pointer events');
      }
    }
  });
  
  return sheetOverlays.length;
};

// Call this function on page load to ensure clean state
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      cleanupModals();
      fixSheetOverlays();
    }, 1000); // Small delay to ensure the DOM is fully loaded
  });
}
