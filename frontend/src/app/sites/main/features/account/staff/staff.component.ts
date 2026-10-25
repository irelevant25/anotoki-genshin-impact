import { Component, inject } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ToastService } from '@anotoki/lib/ui/toast';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';

/**
 * /staff while the site is open: the same sign-in as the account panel's, at
 * the address an admin has learned to type.
 *
 * It matters while maintenance mode is on, and then this page is never
 * reached: the root gate draws the library's closed sign instead of the site,
 * and at this address the sign carries the same button for somebody not signed
 * in (@anotoki/lib/migrations, shared/site-status.ts's staffRoute). Its words
 * are the sign's too - the library's anotoki.maintenance.* - so the door reads
 * the same open or closed.
 *
 * A path rather than a permission: it is hidden from nobody and grants
 * nothing. The sign-in behind it is the ordinary one at the anotoki IAM, and
 * while the site is closed the API lets an admin through and nobody else.
 */
@Component({
  selector: 'app-staff-page',
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
  imports: [ButtonComponent, TranslatePipe],
})
export class StaffSignInPageComponent {
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(ToastService);
  private readonly _i18n = inject(TranslationService);

  /** Whether there is an IAM to send anybody to. */
  readonly available = this._security.available;

  /**
   * Back to the home page afterwards rather than here: signed in, an admin
   * sees the site as it is, closed or not, and this page has nothing more to
   * offer them.
   */
  signIn(): void {
    this._security.login({ returnTo: '/' }).catch(() => this._notifications.error(this._i18n.t('auth.startFailed')));
  }
}
