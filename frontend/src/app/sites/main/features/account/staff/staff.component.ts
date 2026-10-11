import { Component } from '@angular/core';
import { StaffSignInComponent } from '../../../common/staff-sign-in/staff-sign-in.component';
import { TranslatePipe } from '@anotoki/lib/translations';

/**
 * /staff while the site is open: the same sign-in as the account panel's, at
 * the address an admin has learned to type.
 *
 * It matters while maintenance mode is on, and then this page is never
 * reached, because the shell draws the closed sign instead of the router
 * outlet. The closed sign carries the same button when the address is this
 * one - see MaintenanceComponent.
 */
@Component({
  selector: 'app-staff-page',
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
  imports: [StaffSignInComponent, TranslatePipe],
})
export class StaffSignInPageComponent {}
