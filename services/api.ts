type ApiError = {
  message: string;
  status: number;
  data?: any;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL;

const getAuthToken = () => localStorage.getItem('eqorascale_token');

const buildHeaders = (init?: HeadersInit, body?: any) => {
  const headers = new Headers(init || {});
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit & { body?: any } = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = buildHeaders(options.headers, options.body);
  const body =
    headers.get('Content-Type') === 'application/json' &&
    options.body &&
    typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body;

  const response = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error: ApiError = {
      message: (data && (data.message || data.error)) || 'Request failed',
      status: response.status,
      data,
    };
    throw error;
  }

  return data as T;
};

export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem('eqorascale_token', token);
  else localStorage.removeItem('eqorascale_token');
};
