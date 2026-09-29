import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

/**
 * What to say when a sign-in came back from the IAM without working, and the
 * two ways on from it.
 *
 * Nothing has changed by then - the reader is as signed in or out as they were
 * before they pressed the button - so the page is calm about it: why, in a
 * sentence, and "try again" or "go back". The code is shown too, small, for
 * whoever gets asked about it; for a sign-in the person cancelled themselves
 * it would only be noise.
 *
 * Drawn on the callback page, and on the closed sign when maintenance mode has
 * the site shut and an admin's sign-in did not go through.
 */
@Component({
  selector: 'app-sign-in-failure',
  templateUrl: './sign-in-failure.component.html',
  styleUrls: ['./sign-in-failure.component.scss'],
  imports: [ButtonComponent, TranslatePipe],
})
export class SignInFailureComponent {
  private readonly _security = inject(SecurityService);
  private readonly _router = inject(Router);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);

  readonly failure = this._security.signInFailure;

  /** Trying again needs an IAM to go to; going back never does. */
  readonly canRetry = this._security.available;

  readonly reasonKey = computed(() => {
    switch (this.failure()?.code) {
      case 'access_denied':
        return 'auth.callback.cancelled';
      case 'state_mismatch':
        return 'auth.callback.expired';
      case 'unavailable':
        return 'auth.unavailable';
      default:
        return 'auth.callback.failed';
    }
  });

  /** The code, where it is worth reading: not for a sign-in somebody cancelled. */
  readonly code = computed(() => {
    const code = this.failure()?.code;
    return code && code !== 'access_denied' ? code : null;
  });

  retry(): void {
    this._security
      .login({ returnTo: this.failure()?.returnTo ?? '/' })
      .catch(() => this._notifications.showError(this._i18n.t('auth.startFailed')));
  }

  back(): void {
    void this._router.navigateByUrl(this.failure()?.returnTo ?? '/');
  }
}
