/**
 * Signing in, and the account settings that hang off it.
 *
 * Hand-written: /api/auth answers with a hand-built object rather than a row,
 * and deliberately so - `password` never leaves the server, for anybody.
 */

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

export interface LanguageRequest {
  language: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
