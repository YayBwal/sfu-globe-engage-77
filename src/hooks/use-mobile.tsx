
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if window is available (for SSR compatibility)
    if (typeof window === 'undefined') return;
    
    // Function to determine if viewport is mobile size
    const checkIsMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT;
    };
    
    // Initialize with the current window width
    setIsMobile(checkIsMobile());
    
    // Create handler for window resize
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}
