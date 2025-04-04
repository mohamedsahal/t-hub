import { queryClient } from './queryClient';

/**
 * Performance utilities for optimizing the application's performance
 */

/**
 * Create a memoized version of a function
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a debounced version of a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
}

/**
 * Set up lazy loading for images using Intersection Observer
 */
export function setupLazyLoading(): void {
  // Check if IntersectionObserver is available
  if ('IntersectionObserver' in window) {
    // Create an observer instance
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
            delete lazyImage.dataset.src;
            lazyImage.classList.remove('lazy');
            lazyImageObserver.unobserve(lazyImage);
          }
        }
      });
    });

    // Observe all images with the 'lazy' class
    const lazyImages = document.querySelectorAll('img.lazy');
    lazyImages.forEach((image) => {
      lazyImageObserver.observe(image);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img.lazy');
    lazyImages.forEach((image) => {
      const lazyImage = image as HTMLImageElement;
      if (lazyImage.dataset.src) {
        lazyImage.src = lazyImage.dataset.src;
        delete lazyImage.dataset.src;
        lazyImage.classList.remove('lazy');
      }
    });
  }
}

/**
 * Prefetch critical resources for faster navigation and initial load time
 * @param paths Array of API paths to prefetch
 */
export function prefetchResources(paths: string[]): void {
  // Prefetch API data
  paths.forEach((path) => {
    queryClient.prefetchQuery({
      queryKey: [path],
      queryFn: async () => {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to prefetch ${path}`);
          }
          return response.json();
        } catch (error) {
          console.warn(`Error prefetching ${path}:`, error);
          return null;
        }
      },
      staleTime: 30000, // 30 seconds
    });
  });

  // You can also prefetch other critical assets here if needed
  // For example, prefetching critical CSS or JS files
}

/**
 * Measure a component's render time
 * @param componentName The name of the component
 * @param callback The callback function to measure
 */
export function measureRenderTime(componentName: string, callback: () => void): void {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    console.log(`[Performance] ${componentName} rendered in ${endTime - startTime}ms`);
  } else {
    callback();
  }
}

/**
 * Track a user interaction for performance monitoring
 * @param actionName The name of the action
 * @param metadata Additional metadata
 */
export function trackUserInteraction(actionName: string, metadata?: Record<string, any>): void {
  if (window.performance && window.performance.mark) {
    window.performance.mark(`${actionName}-start`);
    
    // Use setTimeout to measure the end of the interaction
    setTimeout(() => {
      window.performance.mark(`${actionName}-end`);
      window.performance.measure(
        actionName,
        `${actionName}-start`,
        `${actionName}-end`
      );
      
      // Optional: send this data to an analytics service
      const measureEntries = window.performance.getEntriesByName(actionName);
      if (measureEntries.length > 0) {
        console.log(`[Performance] ${actionName} took ${measureEntries[0].duration}ms`, metadata);
      }
    }, 0);
  }
}