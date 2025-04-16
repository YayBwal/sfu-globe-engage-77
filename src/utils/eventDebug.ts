
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
  console.log('Running modal cleanup');
  
  // Only target stale overlays - those that have been visually hidden but not properly closed
  const overlays = document.querySelectorAll('[data-state="open"].fixed:not(:hover):not(:focus-within)');
  console.log('Found overlays to clean:', overlays.length);
  
  overlays.forEach(overlay => {
    try {
      // Check if this overlay is actually visible and being used
      if (overlay instanceof HTMLElement) {
        const style = window.getComputedStyle(overlay);
        const opacity = parseFloat(style.opacity);
        
        // Only close overlays that appear to be "stale" (hidden or transparent)
        if (style.display === 'none' || opacity < 0.1 || !overlay.offsetParent) {
          console.log('Cleaning up stale overlay:', overlay);
          
          // Try to find close buttons and click them
          const closeButton = overlay.querySelector('[aria-label="Close"]');
          if (closeButton && closeButton instanceof HTMLElement) {
            closeButton.click();
            console.log('Clicked close button on overlay');
          } else {
            // Force remove the overlay if no close button found
            overlay.setAttribute('data-state', 'closed');
            overlay.style.pointerEvents = 'none';
            console.log('Forced overlay to closed state');
          }
        } else {
          console.log('Skipping active overlay:', overlay);
        }
      }
    } catch (err) {
      console.error('Error cleaning up overlay:', err);
    }
  });
  
  // Also check for any backdrop elements that might be blocking clicks
  const backdrops = document.querySelectorAll('.backdrop[data-state="closed"], [role="presentation"][data-state="closed"]');
  backdrops.forEach(backdrop => {
    if (backdrop.parentNode && backdrop instanceof HTMLElement) {
      console.log('Removing potential blocking backdrop');
      backdrop.style.pointerEvents = 'none';
      backdrop.style.display = 'none';
    }
  });
  
  console.log('Modal cleanup completed');
};

// Fix sheet overlay issues
export const fixSheetOverlays = () => {
  // Sometimes the sheet overlay remains with pointer-events: auto which blocks clicks
  const sheetOverlays = document.querySelectorAll('[data-radix-sheet-overlay][data-state="closed"], [data-radix-dialog-overlay][data-state="closed"]');
  console.log('Found sheet/dialog overlays to fix:', sheetOverlays.length);
  
  sheetOverlays.forEach(overlay => {
    if (overlay instanceof HTMLElement) {
      const state = overlay.getAttribute('data-state');
      console.log('Overlay state:', state);
      
      if (state === 'closed' || !state) {
        // Remove the overlay completely if it's closed or has no state
        overlay.remove();
        console.log('Removed closed/invalid overlay');
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
  
  // Use a more conservative mutation observer approach
  const observer = new MutationObserver((mutations) => {
    // Only run cleanup when the document body is modified with new nodes
    const hasNewModalElements = mutations.some(mutation => {
      // Only check for added nodes that might be modals
      return Array.from(mutation.addedNodes).some(node => 
        node instanceof HTMLElement && 
        (node.hasAttribute('data-state') || 
         node.querySelector('[data-state="open"]'))
      );
    });
    
    if (hasNewModalElements) {
      // Don't run cleanup immediately - give the UI time to settle
      setTimeout(() => {
        fixSheetOverlays();
      }, 500);
    }
  });
  
  // Start observing the document with configured parameters - but be more selective
  observer.observe(document.body, { 
    childList: true,
    subtree: false  // Only watch direct children of body, not the entire tree
  });
}
