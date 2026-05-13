export const AUTH_COOKIE_NAMES = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userRole: 'user_role',
} as const;

export const ROLE_HOME_PATH: Record<string, string> = {
  admin: '/admin',
  doctor: '/doctor/prescriptions',
  patient: '/patient/prescriptions',
};
