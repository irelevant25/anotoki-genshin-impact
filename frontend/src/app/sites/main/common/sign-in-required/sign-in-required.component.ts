import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { VisitorKey } from '../../../../shared/local-lib/services/visitor-key.service';
import { SignInFailureComponent } from '@anotoki/lib/auth';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AUTH_CALLBACK_PATH } from '../../../../shared/routing-definition';

/**
 * What the site is while the IAM requires everybody to sign in and this reader
 * has not.
 *
 * Drawn instead of the header, the page and the footer, like the closed sign:
 * every link behind it would answer 401. Most people see it only for the
 * moment before the IAM's sign-in page loads - the app initializer sends them
 * there by itself - so it says what is happening and offers the same way in
 * again: signing in, or making an account, both at the IAM and both coming
 * back to the address being read. It stays when that cannot happen on its own:
 * the browser would not start the sign-in, the library holds a session this
 * site's API refuses (going again by itself would only loop), or a sign-in came
 * back without working - which the library's screen explains here, at the
 * callback's address, since the card would otherwise swallow the only
 * explanation.
 *
 * No language chooser, as on the closed sign: the language is the stored
 * choice or the browser's.
 */
@Component({
  selector: 'app-sign-in-required',
  templateUrl: './sign-in-required.component.html',
  styleUrls: ['./sign-in-required.component.scss'],
  imports: [ButtonComponent, SignInFailureComponent, TranslatePipe],
})
export class SignInRequiredComponent {
  private readonly _security = inject(SecurityService);
  private readonly _router = inject(Router);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);
  private readonly _visitorKey = inject(VisitorKey);

  /** The address bar's path right now, without the query. */
  private readonly _path = signal(this._pathOf(this._router.url));

  /** Whether there is an IAM to send anybody to. */
  readonly available = this._security.available;

  /**
   * Whether this browser holds a visitor key from before sign-in became
   * required: kept, not sent, so signing in still moves what it holds.
   */
  readonly visitorKeyHeld = computed(() => this._visitorKey.key() !== null);

  /** A sign-in that did not work, to be explained at the callback's address. */
  readonly signInFailure = computed(() => (this._path() === AUTH_CALLBACK_PATH ? this._security.signInFailure() : null));

  constructor() {
    // The router still runs behind the card - the failure's "go back" is a
    // navigation - so this follows it rather than reading the URL once.
    this._router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this._path.set(this._pathOf(event.urlAfterRedirects));
    });
  }

  signIn(): void {
    this._security.login({ returnTo: this._returnTo() }).catch(() => this._startFailed());
  }

  createAccount(): void {
    this._security.register(this._returnTo()).catch(() => this._startFailed());
  }

  /** Back to the page being read, with its query and fragment. */
  private _returnTo(): string {
    return this._router.url;
  }

  private _startFailed(): void {
    this._notifications.showError(this._i18n.t('auth.startFailed'));
  }

  private _pathOf(url: string): string {
    return url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  }
}
