// Centralized API client for Next.js Server Components and client components.
// Note: This client does not handle the token refresh logic automatically
// in the browser; the AuthContext handles silent refreshing, and this
// client relies on the context providing the token via headers or args,
// or being used server-side where Route Handlers act as the BFF.

const getBaseUrl = () => {
  // If running on the server side (e.g., inside a Route Handler proxying to backend)
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL || "http://localhost:5187";
  }
  // If running on the client side, requests go to the BFF (Route Handlers)
  // or relative paths if we want to call our own BFF.
  return "";
};

type FetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const baseUrl = getBaseUrl();
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
