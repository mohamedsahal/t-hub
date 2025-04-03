import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions?: string | object,
  data?: unknown | undefined,
): Promise<any> {
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
  
  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers: options ? { "Content-Type": "application/json" } : {},
    body: options ? JSON.stringify(options) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
