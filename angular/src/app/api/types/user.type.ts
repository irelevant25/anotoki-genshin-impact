/**
 * Accounts, as the admin site sees them.
 *
 * Hand-written: every response here is `SELECT USER_COLUMNS`, which is the
 * users table minus the three columns that must never be published - the
 * password hash and the reset token with its expiry.
 */

import { User } from '../models';

/**
 * The three-state answer every flag filter takes.
 *
 * Absent, rather than a third literal, is "do not ask" - so a filter that has
 * not been touched sends nothing at all.
 */
export type UserFlagFilter = 'yes' | 'no';

export interface UserQuery {
  /** Matches username or email, case-insensitively. */
  search?: string;
  role?: string;
  status?: 'enabled' | 'disabled';
  /** Whether the address on the account was ever confirmed. */
  confirmed?: UserFlagFilter;
  /** Whether signing in demands a code from an authenticator app. */
  twoFactor?: UserFlagFilter;
  /** Whether a Google account is attached. */
  google?: UserFlagFilter;
  /** Whether the account is still on a password somebody else chose. */
  mustChange?: UserFlagFilter;
  /** An exact language code, from the list on /api/users/filters. */
  language?: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  language?: string;
  /**
   * Whether this password has to be replaced before the account can be used.
   *
   * For the account made for somebody who is not in the room, whose password
   * will travel to them through a chat window or out loud. Off by default.
   */
  force_password_change?: boolean;
}

/** Everything an admin may change except the password, which has its own call. */
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  role?: string;
  language?: string;
  email_confirmed?: boolean;
  /** Settable both ways - see UserCreateRequest. */
  force_password_change?: boolean;
}

export interface SetPasswordRequest {
  password: string;
  /**
   * Absent leaves the flag as it is; the admin panel always sends it.
   *
   * A password an admin has just typed is one its owner did not choose, so
   * this arrives checked.
   */
  force_password_change?: boolean;
}

/** Disabling is reversible and destroys nothing; it sets the `deleted` flag. */
export interface EnabledRequest {
  enabled: boolean;
}

/**
 * The filter behind the session history page.
 *
 * `status` is the one it exists for: `active` means a session that would work
 * if its browser made a request this second - unrevoked and unexpired both -
 * rather than merely one nobody has signed out of.
 */
export interface SessionHistoryQuery {
  /** Matches username, email or address, case-insensitively. */
  search?: string;
  /** Everything belonging to one account. */
  user_id?: number;
  /** password, login_code, google or email_link. */
  method?: string;
  status?: 'active' | 'ended';
}
