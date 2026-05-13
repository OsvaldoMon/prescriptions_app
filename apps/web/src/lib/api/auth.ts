import { apiRequest } from '@/lib/api/client';
import type { AuthTokens, Profile } from '@/lib/types';

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfileRequest(): Promise<Profile> {
  return apiRequest<Profile>('/auth/profile');
}

export async function getProfileWithToken(token: string): Promise<Profile> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json() as Promise<Profile>;
}
