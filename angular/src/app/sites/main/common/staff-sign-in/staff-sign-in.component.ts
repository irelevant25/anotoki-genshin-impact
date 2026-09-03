import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { SiteLoginModalComponent } from '../footer/site-login-modal/site-login-modal.component';

/**
 * The way in while the usual way in is shut.
 *
 * Reached at /staff, which is a path rather than a permission: it is not
 * hidden from anybody, and it grants nothing. The sign-in behind it is the
 * ordinary one, and the API refuses everybody but an admin while maintenance
 * or the sign-in switch is on - see refuseSignIn(). What the path does is keep
 * the button off the page for the people the switch is aimed at, so a site
 * that is closed does not offer a door it will not open.
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
  private readonly _modals = inject(ModalService);

  signIn(): void {
    this._modals.open(SiteLoginModalComponent, { size: '2' });
  }
}
