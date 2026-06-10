// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// Central fetch wrapper for all backend requests.
// Handles: base URL, credentials (cookies), auto token refresh, error parsing.
// ─────────────────────────────────────────────────────────────────────────────

// ✅ FIXED: Hardcoded your custom brand subdomain to force-break the old onrender cache loop
const API_BASE = 'https://api.cyrotics.in/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

class ApiError extends Error {
  status: number;
  errors?: unknown[];
  constructor(message: string, status: number, errors?: unknown[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(null));
  failedQueue = [];
};

const buildUrl = (path: string, params?: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, params } = options;

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include', // 🔥 CRITICAL: Allows first-party cookies to be sent across subdomains
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const url = buildUrl(path, params);
  let response = await fetch(url, fetchOptions);

  // Auto-refresh on 401 Unauthorized
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => request(path, options));
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(buildUrl('/auth/refresh'), { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        processQueue(null);
        isRefreshing = false;
        response = await fetch(url, fetchOptions);
      } else {
        processQueue(new ApiError('Session expired', 401));
        isRefreshing = false;
        
        // ✅ FIXED: Safely redirecting to login route on session drop
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        throw new ApiError('Session expired. Please log in again.', 401);
      }
    } catch (err) {
      isRefreshing = false;
      processQueue(err);
      throw err;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'Request failed', response.status, data.errors);
  }

  return data;
};

// ── API Methods ───────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
};

export { ApiError };
export default api;
