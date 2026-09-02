/**
 * Signing in, and the account settings that hang off it.
 *
 * Hand-written: /api/auth answers with a hand-built object rather than a row,
 * and deliberately so - `password` never leaves the server, for anybody.
 */

export interface LoginRequest {
  email: string;
  password: string;
  /**
   * A code from the authenticator app, for accounts that require one.
   *
   * Optional because most do not, and because the caller cannot know in
   * advance which is which - the request is made without it, refused with
   * `totp_required`, and made again with it. A recovery code is accepted here
   * too, and is spent by being used.
   */
  totp?: string;
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

/**
 * The id token Google Identity Services hands the browser.
 *
 * Called `credential` because that is the field GIS puts it in, and keeping
 * the name means the callback's payload can be passed straight through.
 */
export interface GoogleCredentialRequest {
  credential: string;
  /** See LoginRequest - two-factor applies to every way in, not just this one. */
  totp?: string;
}

/**
 * A code from the authenticator app, or a recovery code where one is allowed.
 *
 * Turning two-factor off and asking for new recovery codes both require one,
 * for the same reason changing a password requires the old one: somebody at a
 * signed-in machine should not be able to quietly remove it.
 */
export interface TotpCodeRequest {
  code: string;
}

/** An address and the six digits that were emailed to it. */
export interface LoginCodeRequest {
  email: string;
  code: string;
  /** See LoginRequest - two-factor applies to every way in, not just this one. */
  totp?: string;
}

/**
 * A first password, for an account that has none.
 *
 * No current password, because there is not one - being signed in is the
 * proof, and getting signed in already took Google or a code from the
 * account's own mailbox. Changing an existing one is ChangePasswordRequest.
 */
export interface SetOwnPasswordRequest {
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
