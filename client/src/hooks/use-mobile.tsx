import { useState, useEffect } from 'react';

type BreakpointSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// Default breakpoints (matching Tailwind's default breakpoints)
const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to detect if screen is mobile based on specified breakpoint
 * 
 * @param breakpoint - The maximum breakpoint to consider as "mobile"
 * @param customBreakpoints - Optional custom breakpoint configuration
 * @returns Boolean indicating if the viewport is at or below the specified breakpoint
 */
export function useMobile(
  breakpoint: BreakpointSizes = 'md',
  customBreakpoints?: Partial<BreakpointConfig>
): boolean {
  // Merge default and custom breakpoints
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  // State to track if current width is at or below the specified breakpoint
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Function to check window width against breakpoint
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= breakpoints[breakpoint]);
    };
    
    // Check immediately on mount
    checkMobile();
    
    // Set up resize listener with debounce for performance
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [breakpoint, breakpoints]);
  
  return isMobile;
}

/**
 * Hook to detect current breakpoint based on window width
 * 
 * @param customBreakpoints - Optional custom breakpoint configuration
 * @returns Current breakpoint size
 */
export function useBreakpoint(
  customBreakpoints?: Partial<BreakpointConfig>
): BreakpointSizes {
  // Merge default and custom breakpoints
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  // State to track current breakpoint
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointSizes>('md');
  
  useEffect(() => {
    // Function to determine current breakpoint
    const determineBreakpoint = () => {
      const width = window.innerWidth;
      
      // Check in reverse order (from largest to smallest)
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };
    
    // Check immediately on mount
    determineBreakpoint();
    
    // Set up resize listener with debounce for performance
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(determineBreakpoint, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [breakpoints]);
  
  return currentBreakpoint;
}