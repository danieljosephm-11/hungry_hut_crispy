import type { ApiErrorShape } from '../types';

export class ApiError extends Error {
  status: number;
  details?: ApiErrorShape['errors'];

  constructor(status: number, message: string, details?: ApiErrorShape['errors']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

function withApi(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/api/')) return `${BASE}${path}`;
  return `${BASE}/api${path.startsWith('/') ? path : `/${path}`}`;
}

function headersFor(body: RequestInit['body'], custom?: HeadersInit): Headers {
  const headers = new Headers(custom);
  if (body !== undefined && body !== null && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { body, ...rest } = init;
  const payload: RequestInit['body'] =
    body && !(body instanceof FormData) && typeof body !== 'string' ? JSON.stringify(body) : (body as RequestInit['body']);

  let response: Response;
  try {
    response = await fetch(withApi(path), {
      ...rest,
      body: payload,
      credentials: 'include',
      headers: headersFor(payload, init.headers),
    });
  } catch {
    throw new ApiError(0, 'The kitchen is unreachable. Check your connection and try again.');
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 200) };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || `Request failed (${response.status}).`,
      data?.errors,
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: body as BodyInit }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PUT', body: body as BodyInit }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: body as BodyInit }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
  upload: <T>(path: string, file: File, field = 'image') => {
    const form = new FormData();
    form.append(field, file);
    return request<T>(path, { method: 'POST', body: form });
  },
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
