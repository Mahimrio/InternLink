// Centralized API client for Next.js Server Components and client components.
// Note: This client does not handle the token refresh logic automatically
// in the browser; the AuthContext handles silent refreshing, and this
// client relies on the context providing the token via headers or args,
// or being used server-side where Route Handlers act as the BFF.

const getBaseUrl = (endpoint: string) => {
  // If running on the server side (e.g., inside a Route Handler proxying to backend)
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL || "http://localhost:5187";
  }
  
  // If client-side and calling auth BFF route handlers
  if (endpoint.startsWith("/api/auth")) {
    return "";
  }

  // Client-side direct call to .NET API
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5187";
};

type FetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const baseUrl = getBaseUrl(endpoint);
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const headers = new Headers(customHeaders);
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  // Attempt to parse JSON response
  let data: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const errData = data as { error?: string; details?: unknown } | null;
    const errorMsg = errData?.error || response.statusText || "An unexpected error occurred.";
    const err = new Error(errorMsg) as Error & { status: number; details?: unknown };
    err.status = response.status;
    err.details = errData?.details;
    throw err;
  }

  return data as T;
}
