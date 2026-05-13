import {
  clearAuthCookies,
  getAccessTokenFromDocument,
  getRefreshTokenFromDocument,
  setAuthCookies,
} from '@/lib/auth/cookies';
import type { ApiError, AuthTokens } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshTokenFromDocument();

  if (!refreshToken) {
    clearAuthCookies();
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthCookies();
    return null;
  }

  const tokens = (await response.json()) as AuthTokens;
  const role = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('user_role='))
    ?.split('=')[1];

    if (role) {
      setAuthCookies(
        tokens.accessToken,
        tokens.refreshToken,
        decodeURIComponent(role) as never,
      );
    } else {
      setAuthCookies(tokens.accessToken, tokens.refreshToken, 'patient');
    }

  return tokens.accessToken;
}

async function getValidAccessToken(): Promise<string | null> {
  const currentToken = getAccessTokenFromDocument();

  if (currentToken) {
    return currentToken;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const accessToken = await getValidAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retry) {
    const refreshedToken = await refreshAccessToken();

    if (!refreshedToken) {
      throw {
        message: 'Sesión expirada.',
        code: 'UNAUTHORIZED',
      } satisfies ApiError;
    }

    return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw error ?? {
      message: 'No se pudo completar la solicitud.',
      code: 'HTTP_ERROR',
    };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const accessToken = await getValidAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw error ?? {
      message: 'No se pudo descargar el archivo.',
      code: 'HTTP_ERROR',
    };
  }

  return response.blob();
}
