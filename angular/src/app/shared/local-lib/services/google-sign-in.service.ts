import { Injectable, inject, signal } from '@angular/core';
import { Observable, ReplaySubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthApiService } from '../../../api';

/** The sliver of Google Identity Services this uses. */
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

/**
 * Loading Google Identity Services, and knowing whether to bother.
 *
 * The client id comes from the API rather than from the Angular build, so
 * turning Google sign-in on is a config file on the server and not a rebuild -
 * and a deployment that has not configured one simply never draws the button.
 *
 * GIS has exactly one callback for the whole page: `initialize` sets it, and
 * every button rendered afterwards calls it. So the handler is held here and
 * whichever button was rendered last owns it. That is the behaviour wanted
 * anyway - the buttons live in modals, and only one of those is ever open -
 * but it is the reason this is a service rather than something each button
 * does for itself.
 */
@Injectable({ providedIn: 'root' })
export class GoogleSignInService {
  private readonly _authApi = inject(AuthApiService);

  /** Null until asked, then the client id or false for "not configured". */
  private _providers$?: Observable<string | null>;

  private _scriptLoading?: Promise<boolean>;
  private _handler: ((credential: string) => void) | null = null;

  /** True once the script is in and a client id is known. */
  readonly ready = signal(false);

  /**
   * The client id this deployment uses, or null when Google sign-in is off.
   *
   * Asked once and replayed: the login modal, the register modal and the
   * account page all want the same answer, and it cannot change under them.
   */
  clientId(): Observable<string | null> {
    if (!this._providers$) {
      const subject = new ReplaySubject<string | null>(1);

      this._authApi
        .getAuthProviders()
        .pipe(
          // A deployment with no Google configured is the default, not a
          // failure, and neither is an API that could not be reached: both
          // mean the same thing here, which is no button.
          catchError(() => of({ google_enabled: false, google_client_id: null })),
          tap((providers) => subject.next(providers.google_enabled ? providers.google_client_id : null)),
        )
        .subscribe();

      this._providers$ = subject.asObservable();
    }

    return this._providers$;
  }

  /**
   * Draws Google's own button into `parent`, and calls back with the token.
   *
   * Google's button rather than one of ours, because Google's branding terms
   * ask for it and because the rendered one carries the account chooser.
   */
  async renderButton(parent: HTMLElement, clientId: string, onCredential: (credential: string) => void): Promise<boolean> {
    const loaded = await this._loadScript();
    const google = window.google;

    if (!loaded || !google) {
      return false;
    }

    this._handler = onCredential;

    // Re-initialised per button: the callback is global, and this is what makes
    // the most recently drawn button the one that owns it.
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => this._handler?.(response.credential),
    });

    google.accounts.id.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 280,
    });

    this.ready.set(true);
    return true;
  }

  /** Stops a button that has gone away from answering for one that has not. */
  release(onCredential: (credential: string) => void): void {
    if (this._handler === onCredential) {
      this._handler = null;
    }
  }

  /**
   * Puts Google's script on the page, once.
   *
   * Resolves false rather than throwing if it cannot be fetched - blocked,
   * offline, or an extension in the way. The caller draws nothing and the rest
   * of the form still works, which is the whole reason signing in with a
   * password stays available.
   */
  private _loadScript(): Promise<boolean> {
    if (this._scriptLoading) {
      return this._scriptLoading;
    }

    this._scriptLoading = new Promise<boolean>((resolve) => {
      if (window.google?.accounts?.id) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = GIS_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(!!window.google?.accounts?.id);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

    return this._scriptLoading;
  }
}
