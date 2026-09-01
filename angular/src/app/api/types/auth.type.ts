/**
 * Signing in, and the account settings that hang off it.
 *
 * Hand-written: /api/auth answers with a hand-built object rather than a row,
 * and deliberately so - `password` never leaves the server, for anybody.
 */

/** The account as the auth endpoints describe it. Never includes the password. */
export interface AuthUser {
  username: string;
  email: string;
  role: string;
  background: string | null;
  /** The site's own light/dark choice. */
  theme_main: string;
  /** The admin panel's, remembered separately. */
  theme_admin: string;
  language: string;
  email_confirmed: boolean;
  version: string | null;
  created_at: string;
}

/** What a successful register or login hands back. */
export interface AuthSession {
  /** The bearer token. The interceptor puts it on every later request. */
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/** Which area's theme is being set: the site, or the admin panel. */
export type ThemeArea = 'main' | 'admin';

export interface ThemeRequest {
  area: ThemeArea;
  theme: 'light' | 'dark' | 'auto';
}

/** Echoed back so the caller can confirm what was stored. */
export interface ThemeChanged {
  area: ThemeArea;
  theme: string;
}

export interface LanguageRequest {
  language: string;
}

export interface LanguageChanged {
  language: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
