/**
 * Accounts, as the admin site sees them.
 *
 * Hand-written: every response here is `SELECT USER_COLUMNS`, which is the
 * users table minus the three columns that must never be published - the
 * password hash and the reset token with its expiry.
 */

import { User } from '../models';

/** An account as the API publishes it. */
export type AdminUser = Omit<User, 'password' | 'token' | 'token_expires_at'>;

export interface UserQuery {
  /** Matches username or email, case-insensitively. */
  search?: string;
  role?: string;
  status?: 'enabled' | 'disabled';
}

export interface UserFilters {
  roles: string[];
  byRole: Record<string, number>;
  disabled: number;
  total: number;
  /** How many admins are left, so the UI can explain a refused change. */
  admins: number;
  passwordMinLength: number;
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
