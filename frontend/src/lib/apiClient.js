const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let refreshPromise = null;

async function refreshSessionToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function request(endpoint, options = {}, retryOnUnauthorized = true) {
  const { params, headers, body, ...rest } = options;
  const queryString = params ? buildQueryString(params) : '';
  const url = `${API_BASE_URL}${endpoint}${queryString}`;

  const config = {
    credentials: 'include',
    headers: {
      ...(body && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
    ...rest,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (_networkErr) {
    throw new ApiClientError(
      'Unable to connect to the API server. Please ensure the backend is running.',
      0
    );
  }

  const isAuthEndpoint =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/logout');

  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    const refreshed = await refreshSessionToken();
    if (refreshed) {
      return request(endpoint, options, false);
    }
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_parseErr) {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiClientError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.errors || null
    );
  }

  return payload;
}

export const apiClient = {
  get: (endpoint, params) => request(endpoint, { method: 'GET', params }),
  post: (endpoint, body, params) =>
    request(endpoint, { method: 'POST', body, params }),
  put: (endpoint, body, params) =>
    request(endpoint, { method: 'PUT', body, params }),
  patch: (endpoint, body, params) =>
    request(endpoint, { method: 'PATCH', body, params }),
  delete: (endpoint, params) =>
    request(endpoint, { method: 'DELETE', params }),
};
