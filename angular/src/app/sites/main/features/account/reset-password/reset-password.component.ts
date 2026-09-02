import { Component, inject, model, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface IReset {
  password: string;
  passwordAgain: string;
}

/** The shortest password the API will take. Checked here so the trip is saved. */
const PASSWORD_MIN = 8;

/** Where the page is in the exchange. */
type ResetState = 'asking' | 'done' | 'missing';

/**
 * Where the password-reset link lands.
 *
 * Unlike the confirmation page this has something to ask for, so the token is
 * held until the new password is submitted with it. It still leaves the
 * address bar immediately - a live key to an account has no business sitting
 * in a URL that will be scrolled past, screenshotted or pasted somewhere.
 */
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['../account-landing.scss'],
  imports: [RouterModule, PasswordComponent, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class ResetPasswordComponent extends FieldsComponent<IReset> {
  private readonly _security = inject(SecurityService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  form = model<IReset>({ password: '', passwordAgain: '' });

  readonly state = signal<ResetState>('asking');
  readonly refusal = signal<string | null>(null);
  readonly passwordMin = PASSWORD_MIN;

  private readonly _token: string | null;

  constructor() {
    super();
    this._token = this._activatedRoute.snapshot.queryParamMap.get('token');

    if (!this._token) {
      this.state.set('missing');
      return;
    }

    // Held in the component, gone from the address bar. Same reasoning as the
    // confirmation page, and it has to happen before the form is filled in
    // rather than after it is sent.
    void this._router.navigate([], { relativeTo: this._activatedRoute, queryParams: {}, replaceUrl: true });
  }

  save(): void {
    this.markAllAsTouched();
    if (this.isInvalid() || !this._token) {
      return;
    }

    const form = this.form();

    if (form.password.length < PASSWORD_MIN) {
      this.refusal.set('account.register.passwordTooShort');
      return;
    }

    if (form.password !== form.passwordAgain) {
      this.refusal.set('account.register.passwordMismatch');
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._security.resetPassword(this._token, form.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.state.set('done');
      },
      // Expired, already used, or never issued. The link is spent either way,
      // so this offers the form again rather than a retry that cannot work.
      error: () => {
        this.loading.set(false);
        this.refusal.set('account.reset.linkDead');
      },
    });
  }
}
