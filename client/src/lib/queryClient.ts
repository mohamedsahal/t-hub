import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Utility function to handle non-OK responses by throwing an error
 * @param res Response object from fetch
 * @throws Error with response status and text
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Enhanced API request function with better type safety and performance
 * @param methodOrUrl HTTP method or URL for GET requests
 * @param urlOrOptions URL string or options object
 * @param data Request payload data
 * @returns Promise with response data
 */
export async function apiRequest<T = any>(
  methodOrUrl: string,
  urlOrOptions?: string | object,
  data?: unknown | undefined,
): Promise<T> {
  // Handle both signatures:
  // 1. apiRequest(url) - GET request
  // 2. apiRequest(method, url, data) - Other requests
  
  let method = 'GET';
  let url = methodOrUrl;
  let options = data;
  
  if (urlOrOptions) {
    if (typeof urlOrOptions === 'string') {
      // Original signature: apiRequest(method, url, data)
      method = methodOrUrl;
      url = urlOrOptions;
      options = data;
    } else {
      // New signature: apiRequest(url, options)
      const opts = urlOrOptions as any;
      if (opts.method) {
        method = opts.method;
      }
      if (opts.body) {
        options = typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
      } else {
        // If no body is provided, treat the entire options as the data to send
        // But exclude method, headers and other fetch options
        const { method: _, headers: __, ...rest } = opts;
        if (Object.keys(rest).length > 0) {
          options = rest;
        }
      }
    }
  }
  
  // Make sure method is a valid HTTP method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(method.toUpperCase())) {
    throw new Error(`'${method}' is not a valid HTTP method.`);
  }
  
  // Use AbortController for request timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
  
  try {
    const res = await fetch(url, {
      method: method.toUpperCase(),
      headers: options ? { 
        "Content-Type": "application/json",
        "Cache-Control": method.toUpperCase() === 'GET' ? 'max-age=3600' : 'no-cache' 
      } : {
        "Cache-Control": method.toUpperCase() === 'GET' ? 'max-age=3600' : 'no-cache'
      },
      body: options ? JSON.stringify(options) : undefined,
      credentials: "include",
      signal: controller.signal
    });

    await throwIfResNotOk(res);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Query function factory for React Query with improved caching
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use AbortController for request timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          "Cache-Control": "max-age=3600" // Enable HTTP caching for GET requests
        },
        signal: controller.signal
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

/**
 * Optimized query client with improved caching and performance settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes (more reasonable than Infinity)
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime in v4)
      retry: 1, // Allow one retry for network issues
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Allow one retry for network issues
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});
