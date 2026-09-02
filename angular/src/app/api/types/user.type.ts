/**
 * Accounts, as the admin site sees them.
 *
 * Hand-written: every response here is `SELECT USER_COLUMNS`, which is the
 * users table minus the three columns that must never be published - the
 * password hash and the reset token with its expiry.
 */

import { User } from '../models';

export interface UserQuery {
  /** Matches username or email, case-insensitively. */
  search?: string;
  role?: string;
  status?: 'enabled' | 'disabled';
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  language?: string;
}

/** Everything an admin may change except the password, which has its own call. */
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  role?: string;
  language?: string;
  email_confirmed?: boolean;
}

export interface SetPasswordRequest {
  password: string;
}

/** Disabling is reversible and destroys nothing; it sets the `deleted` flag. */
export interface EnabledRequest {
  enabled: boolean;
}
