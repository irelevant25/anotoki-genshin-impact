import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';
import { NotificationService } from '../components/notification/notification.service';
import { jwtDecode } from '../jwt-decode';
import { RoleService } from './role.service';
import { Roles } from './options-helper.service';
import { HttpClient } from '@angular/common/http';

export interface UserInfo {
  username: string;
  roles: string;
  background?: string;
  theme?: string;
  email?: string;
  email_confirmed?: boolean;
  version?: string;
  token?: string;
  created_at?: string;
}

interface MeResponse {
  username: string;
  email: string;
  role: string;
  background?: string;
  theme?: string;
  email_confirmed?: boolean;
  version?: string;
  created_at?: string;
}

interface LoginResponse {
  token: string;
  user: MeResponse;
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
    private readonly _httpClient: HttpClient,
  ) { }

  get accessToken(): string | undefined {
    return this._currentUserData.value?.token;
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

      this._httpClient.get<MeResponse>('/api/auth/me').pipe(
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
  login(email: string, password: string): Observable<void> {
    return this._httpClient.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      map((res) => {
        this._storageService.write(this.TOKEN_KEY, res.token);
        this._applySession(res.user, res.token);
      }),
    );
  }

  /** Clears the local session and notifies the server (fire-and-forget). */
  logout(callbackFunction?: (isSuccess: boolean) => void): void {
    this._storageService.remove(this.TOKEN_KEY);
    this._currentUserData.next(null);
    this._isLoggedIn.next(false);
    this._roleService.setRoles([]);
    this._httpClient.post('/api/auth/logout', {}).subscribe({
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

  private _applySession(user: MeResponse, token: string): void {
    this._currentUserData.next({
      username: user.username,
      email: user.email,
      roles: user.role,
      background: user.background,
      theme: user.theme,
      email_confirmed: user.email_confirmed,
      version: user.version,
      created_at: user.created_at,
      token,
    });
    this._isLoggedIn.next(true);
    this._roleService.setRoles([ROLE_MAP[user.role] ?? Roles.USER]);
  }
}
