'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { getProfileWithToken, loginRequest } from '@/lib/api/auth';
import { setAuthCookies } from '@/lib/auth/cookies';
import { ROLE_HOME_PATH } from '@/lib/auth/constants';
import type { ApiError } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('dr@test.com');
  const [password, setPassword] = useState('dr123');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const tokens = await loginRequest(email, password);
      const profile = await getProfileWithToken(tokens.accessToken);
      setAuthCookies(tokens.accessToken, tokens.refreshToken, profile.role);
      toast.success(`Bienvenido, ${profile.name}`);
      router.replace(searchParams.get('next') ?? ROLE_HOME_PATH[profile.role]);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message ?? 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-zinc-100 px-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Accede con las credenciales de prueba del seed.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
