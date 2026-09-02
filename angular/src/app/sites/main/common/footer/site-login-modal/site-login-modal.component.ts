import { Component, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { SiteRegisterModalComponent } from '../site-register-modal/site-register-modal.component';
import { SiteForgotPasswordModalComponent } from '../site-forgot-password-modal/site-forgot-password-modal.component';

interface ILogin {
  email: string;
  password: string;
}

@Component({
  selector: 'app-site-login-modal',
  templateUrl: './site-login-modal.component.html',
  styleUrls: ['./site-login-modal.component.scss'],
  imports: [ModalComponent, TextComponent, ButtonComponent, PasswordComponent, LoaderComponent, TranslatePipe],
  providers: [],
})
export class SiteLoginModalComponent extends FieldsComponent<ILogin> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<ILogin>({
    email: '',
    password: '',
  });

  /** Set when the password was right but the address has not been confirmed. */
  readonly needsConfirmation = signal(false);

  /** What to show under the form: prose from the server, or nothing. */
  readonly refusal = signal<string | null>(null);

  /**
   * Signs in, or explains why not.
   *
   * The request is made here rather than through the base class's submit()
   * because there is a third outcome besides worked and failed: right
   * credentials on an account that has never confirmed its address. That is
   * not a failure to report and forget - it is a state with something to do
   * about it, so the modal stays open and offers to send the message again.
   */
  login(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }

    this.needsConfirmation.set(false);
    this.refusal.set(null);
    this.loading.set(true);

    this._security.login(this.form().email.trim(), this.form().password).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this._i18n.t('login.success'));
        this.closeModal(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        // The one refusal worth telling apart. `code` is the stable name for
        // it; the prose beside it may be reworded at any time.
        if (error?.error?.code === 'email_not_confirmed') {
          this.needsConfirmation.set(true);
          return;
        }

        this.refusal.set(this._i18n.t('login.failed'));
      },
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
}
