import { AUTH_COOKIE_NAMES } from '@/lib/auth/constants';
import type { Role } from '@/lib/types';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setCookie(name: string, value: string, maxAge = MAX_AGE_SECONDS): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  role: Role,
): void {
  setCookie(AUTH_COOKIE_NAMES.accessToken, accessToken);
  setCookie(AUTH_COOKIE_NAMES.refreshToken, refreshToken);
  setCookie(AUTH_COOKIE_NAMES.userRole, role);
}

export function clearAuthCookies(): void {
  clearCookie(AUTH_COOKIE_NAMES.accessToken);
  clearCookie(AUTH_COOKIE_NAMES.refreshToken);
  clearCookie(AUTH_COOKIE_NAMES.userRole);
}

export function getAccessTokenFromDocument(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAMES.accessToken}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split('=').slice(1).join('='));
}

export function getRefreshTokenFromDocument(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAMES.refreshToken}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split('=').slice(1).join('='));
}
