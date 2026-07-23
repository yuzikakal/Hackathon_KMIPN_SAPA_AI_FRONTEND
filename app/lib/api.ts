import { ApiResponse, User } from '../types';

const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
  : 'http://localhost:3000';

const TOKEN_KEY = 'sapaai_token';
const USER_KEY = 'sapaai_user';

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

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle empty responses (e.g. 204 No Content)
    const contentLength = response.headers.get('content-length');
    const isEmpty = response.status === 204 || contentLength === '0';

    const json: ApiResponse<T> = isEmpty
      ? { success: true }
      : await response.json();

    if (!response.ok || json.success === false) {
      if (response.status === 401) {
      if (typeof window !== 'undefined') {
        // Hapus token lokal agar tidak terus-terusan dipakai request liar
        localStorage.removeItem('token'); // sesuaikan key token di projectmu
        
        // Redirect ke login jika pengguna belum di halaman login
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    return json.data as T;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
