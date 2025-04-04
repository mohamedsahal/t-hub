import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';
import { debounce, memoize } from '@/lib/performance';

interface UseOptimizedQueryOptions<TData, TError> extends 
  Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  debounceMs?: number;
  memoize?: boolean;
}

/**
 * Custom hook that extends React Query's useQuery with performance optimizations
 * 
 * Features:
 * - Automatic debouncing of rapidly firing queries
 * - Memoization of expensive query functions
 * - Type-safe API
 * - Backwards compatible with standard useQuery
 * 
 * @param queryKey - The React Query key
 * @param queryFn - The function to fetch data
 * @param options - Extended React Query options plus optimization options
 * @returns UseQueryResult with the same API as useQuery
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (context: { queryKey: QueryKey }) => Promise<TData>,
  options?: UseOptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  // Extract optimization options
  const { debounceMs, memoize: shouldMemoize, ...queryOptions } = options || {};
  
  // Apply debouncing if requested
  let optimizedQueryFn = queryFn;
  if (debounceMs && debounceMs > 0) {
    optimizedQueryFn = createDebouncedQueryFn(queryFn, debounceMs);
  }
  
  // Apply memoization if requested
  if (shouldMemoize) {
    optimizedQueryFn = memoize(optimizedQueryFn);
  }
  
  // Use the standard useQuery with our optimized function
  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    ...queryOptions,
  });
}

/**
 * Helper function to create a debounced query function
 * Useful for search inputs or other rapidly changing query dependencies
 * 
 * @param queryFn - The original query function
 * @param delayMs - Debounce delay in milliseconds
 * @returns Debounced query function
 */
export function createDebouncedQueryFn<TData>(
  queryFn: (context: { queryKey: QueryKey }) => Promise<TData>,
  delayMs: number = 300
): (context: { queryKey: QueryKey }) => Promise<TData> {
  // Create a debounced wrapper around the original function
  const debouncedFn = debounce(
    (context: { queryKey: QueryKey }, callback: (result: TData | Error) => void) => {
      queryFn(context)
        .then(result => callback(result))
        .catch(error => callback(error));
    }, 
    delayMs
  );

  // Return a function that creates a promise interface around the debounced function
  return (context) => {
    return new Promise((resolve, reject) => {
      debouncedFn(context, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result as TData);
        }
      });
    });
  };
}