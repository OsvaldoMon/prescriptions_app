import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAMES, ROLE_HOME_PATH } from '@/lib/auth/constants';

export default async function HomePage() {
  const cookieStore = await cookies();
  const role = cookieStore.get(AUTH_COOKIE_NAMES.userRole)?.value;

  if (role && ROLE_HOME_PATH[role]) {
    redirect(ROLE_HOME_PATH[role]);
  }

  redirect('/login');
}
