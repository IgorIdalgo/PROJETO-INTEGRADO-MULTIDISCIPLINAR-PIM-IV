// Centraliza a base URL da API e helpers simples de request
export const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('authToken');
}

async function handleResponse(res: Response) {
  const text = await res.text();
  
  // Handle 401 - Token expirado ou inválido
  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Redirecionar para login após um pequeno delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }
  
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      // Mensagem específica para token expirado
      if (res.status === 401 && json?.msg?.includes('expired')) {
        const error: any = new Error('Sua sessão expirou. Por favor, faça login novamente.');
        error.status = res.status;
        error.body = json;
        throw error;
      }
      const error: any = new Error(json?.detail || json?.title || json?.msg || 'Request failed');
      error.status = res.status;
      error.body = json;
      throw error;
    }
    return json;
  } catch (err: any) {
    if (!res.ok) {
      if (err.status) throw err; // Already formatted error
      const error: any = new Error(text || 'Request failed');
      error.status = res.status;
      error.body = text;
      throw error;
    }
    // If parsing failed but response was ok, return raw text
    return text;
  }
}

function getHeaders(opts: RequestInit = {}): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  
  const token = getAuthToken();
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiGet(path: string, opts: RequestInit & { silent?: boolean } = {}) {
  const { silent, ...fetchOpts } = opts;
  
  if (!silent) {
    console.log('API GET:', `${API_URL}${path}`);
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: getHeaders(fetchOpts),
    credentials: 'omit',
    ...fetchOpts,
  });
  
  if (!silent && !res.ok) {
    console.warn(`GET ${path} - Status: ${res.status}`);
  }
  
  return handleResponse(res);
}

export async function apiPost(path: string, body: any, opts: RequestInit & { silent?: boolean } = {}) {
  const { silent, ...fetchOpts } = opts;
  const stringifiedBody = JSON.stringify(body);
  
  if (!silent) {
    console.log('API POST:', `${API_URL}${path}`);
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(fetchOpts),
    body: stringifiedBody,
    credentials: 'omit',
    ...fetchOpts,
  });
  
  if (!silent && !res.ok) {
    console.warn(`POST ${path} - Status: ${res.status}`);
  }
  
  return handleResponse(res);
}

export async function apiPut(path: string, body: any, opts: RequestInit & { silent?: boolean } = {}) {
  const { silent, ...fetchOpts } = opts;
  
  if (!silent) {
    console.log('API PUT:', `${API_URL}${path}`);
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(fetchOpts),
    body: JSON.stringify(body),
    credentials: 'omit',
    ...fetchOpts,
  });
  
  if (!silent && !res.ok) {
    console.warn(`PUT ${path} - Status: ${res.status}`);
  }
  
  return handleResponse(res);
}

export async function apiDelete(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(opts),
    credentials: 'omit',
    ...opts,
  });
  return handleResponse(res);
}

export async function apiPatch(path: string, body: any, opts: RequestInit & { silent?: boolean } = {}) {
  const { silent, ...fetchOpts } = opts;
  
  if (!silent) {
    console.log('API PATCH:', `${API_URL}${path}`, body);
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: getHeaders(fetchOpts),
    body: JSON.stringify(body),
    credentials: 'omit',
    ...fetchOpts,
  });
  
  if (!silent && !res.ok) {
    console.warn(`PATCH ${path} - Status: ${res.status}`);
  }
  
  return handleResponse(res);
}

export default {
  API_URL,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
};
