import { Component, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface ISetPassword {
  password: string;
  passwordAgain: string;
}

/** The shortest password the API will take. Checked here so the trip is saved. */
const PASSWORD_MIN = 8;

/**
 * Putting a first password on an account that has none.
 *
 * Only reachable from an account made through Google, and only while it still
 * has no password. No current password is asked for because there is not one -
 * being signed in is the proof, and getting signed in already took either
 * Google or a code sent to the account's own mailbox.
 *
 * This is half of handing an account over to somebody else: set a password,
 * then disconnect Google. The account page will not offer the second until the
 * first has been done, and neither will the server.
 */
@Component({
  selector: 'app-site-set-password-modal',
  templateUrl: './site-set-password-modal.component.html',
  styleUrls: ['../site-register-modal/site-register-modal.component.scss'],
  imports: [ModalComponent, PasswordComponent, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class SiteSetPasswordModalComponent extends FieldsComponent<ISetPassword> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<ISetPassword>({ password: '', passwordAgain: '' });

  readonly refusal = signal<string | null>(null);
  readonly passwordMin = PASSWORD_MIN;

  save(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
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

    this._security.setOwnPassword(form.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this._i18n.t('account.methods.passwordSet'));
        this.closeModal(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.refusal.set(error?.error?.error ?? 'account.methods.failed');
      },
    });
  }

  /** Whether the refusal is one of this component's keys or the server's words. */
  refusalIsKey(): boolean {
    const refusal = this.refusal();
    return !!refusal && refusal.includes('.') && !refusal.includes(' ');
  }

  cancel(): void {
    this.closeModal(false);
  }
}
