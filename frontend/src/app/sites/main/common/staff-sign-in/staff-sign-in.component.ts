import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

/**
 * The way in while the usual way in is shut.
 *
 * Reached at /staff, which is a path rather than a permission: it is not
 * hidden from anybody, and it grants nothing. The sign-in behind it is the
 * ordinary one at the anotoki IAM, and while the site is closed the API lets
 * an admin through and nobody else. What the path does is keep the button off
 * the page for the people the closed sign is aimed at, so a site that is
 * closed does not offer a door it will not open.
 *
 * It is also why an admin can always get back in: whoever closed the site has
 * to be able to reopen it, and an admin locked out by their own maintenance
 * mode would have no way back that did not involve the database.
 */
@Component({
  selector: 'app-staff-sign-in',
  templateUrl: './staff-sign-in.component.html',
  styleUrls: ['./staff-sign-in.component.scss'],
  imports: [ButtonComponent, TranslatePipe],
})
export class StaffSignInComponent {
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);

  /** Whether there is an IAM to send anybody to. */
  readonly available = this._security.available;

  /**
   * Back to the home page afterwards rather than here: signed in, an admin
   * sees the site as it is, closed or not, and this page has nothing more to
   * offer them.
   */
  signIn(): void {
    this._security.login({ returnTo: '/' }).catch(() => this._notifications.showError(this._i18n.t('auth.startFailed')));
  }
}
