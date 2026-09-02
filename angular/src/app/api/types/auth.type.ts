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
  /**
   * The language the form was filled in in, so the confirmation arrives in it.
   *
   * Sent rather than settled afterwards: the account is written and the message
   * goes out in the same breath, before anybody has signed in to set anything.
   */
  language?: string;
}

/** The token out of a confirmation link. */
export interface ConfirmEmailRequest {
  token: string;
}

/**
 * An address, for the two endpoints that will send to it if there is an account
 * behind it - resending a confirmation, and asking to reset a password.
 *
 * Both answer the same whatever they find, so there is nothing to read back
 * beyond that the request was made.
 */
export interface EmailRequest {
  email: string;
}

/** The token out of a reset link, and the password to put behind it. */
export interface PasswordResetRequest {
  token: string;
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
