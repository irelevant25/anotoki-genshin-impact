import { Component, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { GoogleButtonComponent } from '../../../../../shared/local-lib/components/google-button/google-button.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { SiteRegisterModalComponent } from '../site-register-modal/site-register-modal.component';
import { SiteForgotPasswordModalComponent } from '../site-forgot-password-modal/site-forgot-password-modal.component';

interface ILogin {
  email: string;
  password: string;
  code: string;
  /** From the authenticator app, or a recovery code. */
  totp: string;
}

/**
 * Which of the three ways in the modal is currently showing.
 *
 * `code` is not an error state. It is reached deliberately, from the link
 * under the form, and also arrived at when the password turns out not to be
 * the way into that account - which is a thing to do next rather than a
 * failure to report.
 */
type LoginStep = 'password' | 'code' | 'unconfirmed' | 'totp';

@Component({
  selector: 'app-site-login-modal',
  templateUrl: './site-login-modal.component.html',
  styleUrls: ['./site-login-modal.component.scss'],
  imports: [ModalComponent, TextComponent, ButtonComponent, PasswordComponent, LoaderComponent, GoogleButtonComponent, CheckboxComponent, TranslatePipe],
  providers: [],
})
export class SiteLoginModalComponent extends FieldsComponent<ILogin> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<ILogin>({
    email: '',
    password: '',
    code: '',
    totp: '',
  });

  /**
   * Which way in was being used when a second factor turned out to be needed.
   *
   * The API takes the whole sign-in again with the code attached rather than
   * handing out a half-session to finish later, so whatever was in flight has
   * to be repeatable - which for Google means keeping the token it gave us.
   */
  private _pending: 'password' | 'code' | 'google' | null = null;
  private _googleCredential: string | null = null;

  readonly step = signal<LoginStep>('password');

  /** Set once a code has actually been asked for, so the form knows to wait. */
  readonly codeSent = signal(false);

  /** What to show under the form: prose from the server, or nothing. */
  readonly refusal = signal<string | null>(null);

  /**
   * Whether this browser should be spared the code next time.
   *
   * Offered only once a code has actually been asked for, because until then
   * there is nothing to skip - and an account without two-factor would be
   * ticking a box that does nothing.
   *
   * It skips the six digits and nothing else: the password still has to be
   * right, so this is a convenience rather than a way in.
   */
  readonly rememberDevice = signal(false);

  /**
   * Signs in, or explains why not.
   *
   * The request is made here rather than through the base class's submit()
   * because there are two outcomes besides worked and failed, and neither is a
   * failure to report and forget. An unconfirmed address has something to do
   * about it; an account that signs in another way has two things.
   */
  login(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._pending = 'password';

    this._security.login(this.form().email.trim(), this.form().password, this._totp(), this.rememberDevice()).subscribe({
      next: () => this._signedIn(),
      error: (error: HttpErrorResponse) => this._refused(error, 'login.failed'),
    });
  }

  /** Google handed the browser a token; the server decides what it is worth. */
  signInWithGoogle(credential: string): void {
    this.refusal.set(null);
    this.loading.set(true);
    this._pending = 'google';
    this._googleCredential = credential;

    this._security.signInWithGoogle(credential, this._totp(), this.rememberDevice()).subscribe({
      next: () => this._signedIn(),
      error: (error: HttpErrorResponse) => this._refused(error, 'login.googleFailed'),
    });
  }

  /**
   * Repeats whatever was in flight, now with the authenticator code attached.
   *
   * Nothing was kept server-side between the two attempts - the second request
   * carries everything the first did - so there is no half-finished sign-in
   * anywhere to expire or be stolen.
   */
  submitTotp(): void {
    if (!this.form().totp.trim()) {
      return;
    }

    switch (this._pending) {
      case 'password':
        return this.login();
      case 'code':
        return this.submitCode();
      case 'google':
        return this._googleCredential ? this.signInWithGoogle(this._googleCredential) : undefined;
    }
  }

  /** Moves to the code form, whether or not the password was ever tried. */
  useCode(): void {
    this.step.set('code');
    this.refusal.set(null);
  }

  backToPassword(): void {
    this.step.set('password');
    this.codeSent.set(false);
    this.refusal.set(null);
  }

  /**
   * Asks for a code.
   *
   * The endpoint answers the same for every address, so there is nothing to
   * read back and nothing to report - the form simply moves on to asking for
   * the code, which is true whatever was found.
   */
  sendCode(): void {
    const email = this.form().email.trim();
    if (!email) {
      this.refusal.set(this._i18n.t('login.emailFirst'));
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._security.requestLoginCode(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.codeSent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.codeSent.set(true);
      },
    });
  }

  submitCode(): void {
    const code = this.form().code.trim();
    if (!code) {
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._pending = 'code';

    this._security.signInWithCode(this.form().email.trim(), code, this._totp(), this.rememberDevice()).subscribe({
      next: () => this._signedIn(),
      error: (error: HttpErrorResponse) => this._refused(error, 'login.badCode'),
    });
  }

  /** Sends the confirmation again, for the account that just could not get in. */
  resendConfirmation(): void {
    this.loading.set(true);
    this._security.resendConfirmation(this.form().email.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this._i18n.t('account.confirm.resent'));
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this._i18n.t('account.confirm.resendFailed'));
      },
    });
  }

  /** Both of these replace this modal rather than stacking on top of it. */
  register(): void {
    this.closeModal();
    this.modalService.open(SiteRegisterModalComponent, { size: '1' });
  }

  forgotPassword(): void {
    this.closeModal();
    this.modalService.open(SiteForgotPasswordModalComponent, { size: '1' });
  }

  cancel(): void {
    this.closeModal(false);
  }

  /** Empty until the second factor has actually been asked for. */
  private _totp(): string | undefined {
    return this.form().totp.trim() || undefined;
  }

  /**
   * The refusals worth telling apart, in one place.
   *
   * `code` is the stable name for each; the prose beside it may be reworded at
   * any time, so nothing here matches on the message.
   */
  private _refused(error: HttpErrorResponse, fallbackKey: string): void {
    this.loading.set(false);

    switch (error?.error?.code) {
      case 'email_not_confirmed':
        this.step.set('unconfirmed');
        return;

      // Made through Google, or the password has been switched off. Nothing is
      // emailed from here - the code is asked for by pressing the button.
      case 'password_login_unavailable':
        this.step.set('code');
        this.refusal.set(this._i18n.t('login.otherWayIn'));
        return;

      case 'totp_required':
        this.step.set('totp');
        this.refusal.set(null);
        return;

      case 'totp_invalid':
        this.step.set('totp');
        this.refusal.set(this._i18n.t('login.badTotp'));
        return;

      // Not about this account or this password: the site is closed, or
      // signing in has been switched off. Said in those words rather than as
      // "that did not work", which would send somebody to reset a password
      // that was never the problem.
      case 'maintenance':
        this.refusal.set(this._i18n.t('login.maintenanceRefusal'));
        return;

      case 'login_disabled':
        this.refusal.set(this._i18n.t('login.disabledRefusal'));
        return;

      default:
        this.refusal.set(this._i18n.t(fallbackKey));
    }
  }

  private _signedIn(): void {
    this.loading.set(false);
    this.notificationService.showSuccess(this._i18n.t('login.success'));
    this.closeModal(true);
  }
}
