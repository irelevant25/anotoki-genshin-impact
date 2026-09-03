import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { NotificationService } from '../../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

/** What became of the token in the address bar. */
type ConfirmState = 'working' | 'done' | 'failed' | 'missing';

/**
 * Where the confirmation link lands.
 *
 * The whole page is one request made on arrival, so there is nothing to press:
 * the account is confirmed and signed in by the time it has finished drawing.
 *
 * The token is taken out of the query string and never put back. It is a live
 * key to an account, and an address bar is copied into chat windows, pasted
 * into issues and read over shoulders - so once it has been spent the URL is
 * replaced with a clean one.
 *
 * When it does not work, this is also where a new link is asked for. It used
 * to say "try signing in - you can ask for a new one there", which is a fair
 * description of where the button was and a poor answer to somebody standing
 * on a dead link: they cannot sign in, that is why they are here.
 */
@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['../account-landing.scss'],
  imports: [NgTemplateOutlet, FormsModule, RouterModule, ButtonComponent, LoaderComponent, TextComponent, TranslatePipe],
})
export class ConfirmEmailComponent {
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  readonly state = signal<ConfirmState>('working');

  /** The address to send a new link to, which nothing here can know. */
  readonly email = signal('');
  readonly sending = signal(false);

  /**
   * Whether a request has gone off.
   *
   * The form is replaced by its own answer rather than left sitting there: a
   * button that gives no sign of having worked gets pressed again, and each
   * press sends another message to somebody's inbox.
   */
  readonly sent = signal(false);

  constructor() {
    const token = this._route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('missing');
      return;
    }

    this._security.confirmEmail(token).subscribe({
      next: () => {
        this.state.set('done');
        this._forgetToken();
      },
      // Expired, already used, or never issued - the API does not say which,
      // on purpose, and neither does this.
      error: () => {
        this.state.set('failed');
        this._forgetToken();
      },
    });
  }

  /**
   * Asks for another confirmation link.
   *
   * The API answers the same whatever the address turns out to be - taken,
   * unknown, or already confirmed - so this cannot say more than "if that
   * address needs confirming, it is on its way". Saying which it was would
   * turn this page into a way of testing whether somebody has an account here.
   */
  resend(): void {
    const email = this.email().trim();

    if (!email || this.sending()) {
      return;
    }

    this.sending.set(true);

    this._security.resendConfirmation(email).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this._notifications.showSuccess(this._i18n.t('account.confirm.resent'));
      },
      error: () => {
        this.sending.set(false);
        this._notifications.showError(this._i18n.t('account.confirm.resendFailed'));
      },
    });
  }

  /** Drops the token from the address bar without adding a history entry. */
  private _forgetToken(): void {
    void this._router.navigate([], { relativeTo: this._route, queryParams: {}, replaceUrl: true });
  }
}
