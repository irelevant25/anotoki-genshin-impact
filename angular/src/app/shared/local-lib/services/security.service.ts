import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';
import { NotificationService } from '../components/notification/notification.service';
import { jwtDecode } from '../jwt-decode';
import { RoleService } from './role.service';
import { Roles } from './options-helper.service';
import { AuthApiService, AuthMailRequested, AuthPending, AuthSession, AuthUser, TotpRecoveryCodes, TotpSetup } from '../../../api';

export interface UserInfo {
  username: string;
  roles: string;
  background?: string;
  /** Light/dark choice, kept per area - see ThemeToggleService. */
  theme_main?: string;
  theme_admin?: string;
  /** Language code the site is read in - see TranslationService. */
  language?: string;
  email?: string;
  email_confirmed?: boolean;
  version?: string;
  token?: string;
  created_at?: string;
  /**
   * The ways into this account, which the account page reads to decide what to
   * offer. `has_password` and `password_login_enabled` are different questions:
   * one is whether there is a password, the other whether it is still accepted.
   */
  has_password?: boolean;
  password_login_enabled?: boolean;
  google_connected?: boolean;
  google_email?: string;
  /** Whether a code from an authenticator app is required to sign in. */
  totp_enabled?: boolean;
  /** Unused recovery codes left, so the account page can warn when they run low. */
  recovery_codes_remaining?: number;
}

const ROLE_MAP: Record<string, Roles> = {
  ADMIN: Roles.ADMIN,
  EDITOR: Roles.EDITOR,
  USER: Roles.USER,
};

export function initializeAuthenticationFactory(secSvc: SecurityService): () => Promise<void> {
  return () => secSvc.init();
}

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly TOKEN_KEY = 'jwt';

  private readonly _isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this._isLoggedIn.asObservable();

  private readonly _currentUserData = new BehaviorSubject<UserInfo | null>(null);
  currentUserData$: Observable<UserInfo | null> = this._currentUserData.asObservable();

  private readonly _isRedirecting = new BehaviorSubject<boolean>(false);
  isRedirecting$: Observable<boolean> = this._isRedirecting.asObservable();

  get isTest(): boolean {
    return (window as any)?.jasmine !== undefined;
  }

  constructor(
    private readonly _storageService: LocalStorageService,
    private readonly _notificationService: NotificationService,
    private readonly _roleService: RoleService,
    private readonly _authApi: AuthApiService,
  ) { }

  get accessToken(): string | undefined {
    return this._currentUserData.value?.token;
  }

  /**
   * The account as it stands, for a one-shot read.
   *
   * currentUserData$ is the way to follow it; this is for the callers that
   * only want to know once - which way a modal should open, say - and would
   * otherwise subscribe and immediately unsubscribe.
   */
  currentUser(): UserInfo | null {
    return this._currentUserData.value;
  }

  /**
   * Called at app startup via APP_INITIALIZER.
   * Reads the stored JWT, validates expiry client-side, then fetches fresh
   * user data from /api/auth/me. On any failure the session is cleared.
   */
  init(): Promise<void> {
    return new Promise((resolve) => {
      const token = this._storageService.read(this.TOKEN_KEY);

      if (!token) {
        resolve();
        return;
      }

      // Client-side expiry check — avoids an unnecessary round-trip
      try {
        const payload = jwtDecode<{ exp?: number }>(token);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          this._storageService.remove(this.TOKEN_KEY);
          resolve();
          return;
        }
      } catch {
        this._storageService.remove(this.TOKEN_KEY);
        resolve();
        return;
      }

      // Expose the token so the auth interceptor can attach it to the /me request
      this._currentUserData.next({ username: '', roles: '', token });

      this._authApi.getCurrentUser().pipe(
        catchError(() => {
          this._storageService.remove(this.TOKEN_KEY);
          this._currentUserData.next(null);
          return of(null);
        }),
      ).subscribe((user) => {
        if (user) {
          this._applySession(user, token);
        }
        resolve();
      });
    });
  }

  /**
   * Authenticates with email + password.
   * Returns an Observable so the caller can react to success or failure.
   */
  login(email: string, password: string, totp?: string): Observable<void> {
    return this._authApi.login({ email, password, totp }).pipe(map((session) => this.adoptSession(session)));
  }

  /**
   * Creates an account. No session comes back and none is meant to: the
   * address has to be confirmed before the account can be used, so what the
   * caller gets is whether the message went out.
   */
  register(username: string, email: string, password: string, language?: string): Observable<AuthPending> {
    return this._authApi.register({ username, email, password, language });
  }

  /**
   * Confirms an address from the link in the message, and signs the account in.
   *
   * Holding the link is proof of the mailbox, which is a stronger claim than
   * the password they would otherwise be asked for, so there is no reason to
   * ask for one as well.
   */
  confirmEmail(token: string): Observable<void> {
    return this._authApi.confirmEmail({ token }).pipe(map((session) => this.adoptSession(session)));
  }

  /** Sets a new password from a reset link, and signs the account in. */
  resetPassword(token: string, password: string): Observable<void> {
    return this._authApi.resetPassword({ token, password }).pipe(map((session) => this.adoptSession(session)));
  }

  /**
   * Asks for another confirmation message, or for a reset link.
   *
   * Both answer the same whatever they find - whether the address has an
   * account, whether it still needs confirming - so neither tells the caller
   * anything to act on beyond that the request was made.
   */
  resendConfirmation(email: string): Observable<AuthMailRequested> {
    return this._authApi.resendConfirmation({ email });
  }

  requestPasswordReset(email: string): Observable<AuthMailRequested> {
    return this._authApi.requestPasswordReset({ email });
  }

  /**
   * Signs in with a Google id token, making the account if there is not one.
   *
   * The token means nothing until the server has checked it - that it is
   * Google's, and that it was minted for this site - so all this does is carry
   * it across.
   */
  signInWithGoogle(credential: string, totp?: string): Observable<void> {
    return this._authApi.signInWithGoogle({ credential, totp }).pipe(map((session) => this.adoptSession(session)));
  }

  /** Asks for a sign-in code by email, and signs in with one. */
  requestLoginCode(email: string): Observable<AuthMailRequested> {
    return this._authApi.requestLoginCode({ email });
  }

  signInWithCode(email: string, code: string, totp?: string): Observable<void> {
    return this._authApi.signInWithCode({ email, code, totp }).pipe(map((session) => this.adoptSession(session)));
  }

  /**
   * The four that change how the account can be reached.
   *
   * Each answers with the account as it now stands, which is applied to the
   * session on the spot - the account page reads its state from there, so
   * connecting Google has to be visible before the next request rather than
   * after the next reload.
   */
  connectGoogle(credential: string): Observable<AuthUser> {
    return this._authApi.connectGoogle({ credential }).pipe(tap((user) => this._refreshUser(user)));
  }

  disconnectGoogle(): Observable<AuthUser> {
    return this._authApi.disconnectGoogle().pipe(tap((user) => this._refreshUser(user)));
  }

  setOwnPassword(password: string): Observable<AuthUser> {
    return this._authApi.setOwnPassword({ password }).pipe(tap((user) => this._refreshUser(user)));
  }

  setPasswordLoginEnabled(enabled: boolean): Observable<AuthUser> {
    return this._authApi.setPasswordLoginEnabled({ enabled }).pipe(tap((user) => this._refreshUser(user)));
  }

  /**
   * Setting up two-factor, in the three steps the API asks for.
   *
   * `startTwoFactor` issues a secret and requires nothing; `enableTwoFactor`
   * proves it was scanned and answers with the recovery codes, which is the
   * only time they can be read; `disableTwoFactor` needs a code for the same
   * reason changing a password needs the old one.
   */
  startTwoFactor(): Observable<TotpSetup> {
    return this._authApi.startTwoFactorSetup({});
  }

  enableTwoFactor(code: string): Observable<TotpRecoveryCodes> {
    // The account itself changed - it now demands a code - so the session is
    // refreshed rather than left saying two-factor is off.
    return this._authApi.enableTwoFactor({ code }).pipe(tap(() => this.refreshCurrentUser()));
  }

  disableTwoFactor(code: string): Observable<AuthUser> {
    return this._authApi.disableTwoFactor({ code }).pipe(tap((user) => this._refreshUser(user)));
  }

  regenerateRecoveryCodes(code: string): Observable<TotpRecoveryCodes> {
    return this._authApi.regenerateRecoveryCodes({ code }).pipe(tap(() => this.refreshCurrentUser()));
  }

  /**
   * Re-reads the account behind the current token.
   *
   * For the endpoints that change it without answering with it - enabling
   * two-factor hands back recovery codes, not an account, and the account page
   * still has to notice.
   */
  refreshCurrentUser(): void {
    if (!this._currentUserData.value?.token) {
      return;
    }

    this._authApi.getCurrentUser().subscribe({
      next: (user) => this._refreshUser(user),
      error: () => undefined,
    });
  }

  /** Takes up a session handed back by any endpoint that issues one. */
  adoptSession(session: AuthSession): void {
    this._storageService.write(this.TOKEN_KEY, session.token);
    this._applySession(session.user, session.token);
  }

  /** Clears the local session and notifies the server (fire-and-forget). */
  logout(callbackFunction?: (isSuccess: boolean) => void): void {
    this._storageService.remove(this.TOKEN_KEY);
    this._currentUserData.next(null);
    this._isLoggedIn.next(false);
    this._roleService.setRoles([]);
    this._authApi.logout({}).subscribe({
      next: () => {
        this._notificationService.showSuccess('You were successfully logged out.');
        callbackFunction?.(true);
      },
      error: () => {
        this._notificationService.showError('Logout failed on server, but local session was cleared.');
        callbackFunction?.(false);
      },
    });
  }

  /**
   * Stores a renewed token received in the X-Refresh-Token response header.
   * Called by the auth interceptor — not intended for direct use.
   */
  updateToken(newToken: string): void {
    this._storageService.write(this.TOKEN_KEY, newToken);
    const current = this._currentUserData.value;
    if (current) {
      this._currentUserData.next({ ...current, token: newToken });
    }
  }

  /**
   * Puts a fresh copy of the account into the session, keeping the token.
   *
   * The endpoints that change how an account can be reached answer with the
   * account rather than a session, because the token they were called with is
   * still good - none of them changes who you are.
   */
  private _refreshUser(user: AuthUser): void {
    const token = this._currentUserData.value?.token;
    if (token) {
      this._applySession(user, token);
    }
  }

  private _applySession(user: AuthUser, token: string): void {
    this._currentUserData.next({
      username: user.username,
      email: user.email,
      roles: user.role,
      // The API says null where this shape says absent; both mean the same
      // thing here, and the rest of the app already reads these as optional.
      background: user.background ?? undefined,
      theme_main: user.theme_main,
      theme_admin: user.theme_admin,
      language: user.language,
      email_confirmed: user.email_confirmed,
      version: user.version ?? undefined,
      created_at: user.created_at,
      has_password: user.has_password,
      password_login_enabled: user.password_login_enabled,
      google_connected: user.google_connected,
      google_email: user.google_email ?? undefined,
      totp_enabled: user.totp_enabled,
      recovery_codes_remaining: user.recovery_codes_remaining,
      token,
    });
    this._isLoggedIn.next(true);
    this._roleService.setRoles([ROLE_MAP[user.role] ?? Roles.USER]);
  }
}
