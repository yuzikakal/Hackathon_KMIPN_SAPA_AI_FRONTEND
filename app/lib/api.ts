import { ApiResponse, User } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:5790';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL)
  .replace(/\/+$/, '');

const TOKEN_KEY = 'sapaai_token';
const USER_KEY = 'sapaai_user';

export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface UploadResult {
  url: string;
  filename: string | null;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function resolveApiAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function removeStoredUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

export interface ApiOptions extends RequestInit {
  silentError?: boolean;
}

export async function parseApiResponse<T>(
  response: Response,
  endpoint = response.url
): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body) {
    if (response.ok) return undefined as T;
    throw new ApiError(`Request failed with status ${response.status}`, response.status, endpoint);
  }

  let envelope: ApiResponse<T>;
  try {
    envelope = JSON.parse(body) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      `API returned an invalid JSON response (status ${response.status})`,
      response.status,
      endpoint
    );
  }

  if (!response.ok || envelope.success !== true) {
    throw new ApiError(
      envelope.message || `Request failed with status ${response.status}`,
      response.status,
      endpoint
    );
  }

  return envelope.data as T;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { silentError, ...fetchOptions } = options;
  const token = getAuthToken();
  const headers = new Headers(fetchOptions.headers);
  const isMultipart = fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
    return await parseApiResponse<T>(response, endpoint);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 401 && typeof window !== 'undefined') {
      removeAuthToken();
      removeStoredUser();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error && error.message.includes('Failed to fetch'));
    if (!silentError && !isNetworkError) {
      console.error(`API Error [${endpoint}]:`, error);
    } else if (!silentError && isNetworkError) {
      console.warn(
        `API Server offline/unreachable [${endpoint}]:`,
        error instanceof Error ? error.message : error
      );
    }
    throw error;
  }
}

export async function apiUpload(
  file: File,
  options: Omit<ApiOptions, 'method' | 'body'> = {}
): Promise<UploadResult> {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<UploadResult>('/api/v1/upload', {
    ...options,
    method: 'POST',
    body,
  });
}
