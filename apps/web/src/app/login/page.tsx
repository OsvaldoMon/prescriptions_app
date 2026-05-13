import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';
import { LoadingState } from '@/components/ui/state';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparando acceso..." />}>
      <LoginForm />
    </Suspense>
  );
}
