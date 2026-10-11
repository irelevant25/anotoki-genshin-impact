import { Component } from '@angular/core';
import { TranslatePipe } from '@anotoki/lib/translations';
import { SignInFailureComponent } from '../../../common/sign-in-failure/sign-in-failure.component';

/**
 * /auth/callback, where the anotoki IAM hands a sign-in back.
 *
 * Normally never drawn. SecurityService.init() finishes the sign-in before the
 * router's first navigation and puts the address the person started from into
 * the address bar, so the router draws that page instead. This page is what is
 * left when it did not work - the IAM said no, the person cancelled, the code
 * could not be exchanged - and a visit with nothing to report (a reload, a
 * bookmark) is sent home by the route's guard rather than shown an empty page.
 */
@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
  imports: [SignInFailureComponent, TranslatePipe],
})
export class AuthCallbackComponent {}
