import { Component } from '@angular/core';
import { StaffSignInComponent } from '../../../common/staff-sign-in/staff-sign-in.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

/**
 * /staff, for when the site is up but the sign-in button is not.
 *
 * Switching signing in off takes the button out of the account panel, which is
 * the point of it - but somebody has to be able to sign in and turn it back
 * on. That is here, and it is the same form and the same refusals as
 * everywhere else: the API lets an admin through and nobody else.
 *
 * While maintenance mode is on this page is never reached, because the shell
 * draws the closed sign instead of the router outlet. The closed sign carries
 * the same button when the address is this one - see MaintenanceComponent.
 */
@Component({
  selector: 'app-staff-page',
  templateUrl: './staff.component.html',
  styleUrls: ['../account-landing.scss'],
  imports: [StaffSignInComponent, TranslatePipe],
})
export class StaffSignInPageComponent {}
