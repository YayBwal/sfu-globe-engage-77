
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
  overlays.forEach(overlay => {
    // Try to find close buttons and click them
    const closeButton = overlay.querySelector('[aria-label="Close"]');
    if (closeButton && closeButton instanceof HTMLElement) {
      closeButton.click();
    }
  });
  
  console.log('Modal cleanup completed');
};
