import { Component, computed, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface IChangePassword {
  current: string;
  password: string;
  passwordAgain: string;
}

/** The shortest password the API will take. Checked here so the trip is saved. */
const PASSWORD_MIN = 8;

/**
 * Changing a password that already exists.
 *
 * The old one is asked for, and that is the whole difference from setting a
 * first one. Being signed in is not proof enough on its own here: a session
 * left open on a shared machine is exactly the situation where somebody else
 * would like to change the password, and asking for the current one is what
 * stops them.
 *
 * `forced` is the same form with the way out taken off it, for an account
 * still on a password an admin chose. The lead says why, there is no cancel,
 * and the modal it opens in refuses the backdrop and the escape key - see
 * where it is opened. Signing out is left, because being unable to leave is
 * not the same as being trapped.
 *
 * The account with no password at all is not this modal's business: nothing
 * would go in the first field. That is SiteSetPasswordModalComponent, which
 * proves the same thing a different way - being signed in through Google or a
 * code from the account's own mailbox.
 */
@Component({
  selector: 'app-site-change-password-modal',
  templateUrl: './site-change-password-modal.component.html',
  styleUrls: ['../site-register-modal/site-register-modal.component.scss'],
  imports: [ModalComponent, PasswordComponent, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class SiteChangePasswordModalComponent extends FieldsComponent<IChangePassword> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<IChangePassword>({ current: '', password: '', passwordAgain: '' });

  /** Set by the opener when the account is still on a password it was given. */
  readonly forced = model(false);

  readonly refusal = signal<string | null>(null);
  readonly passwordMin = PASSWORD_MIN;

  readonly title = computed(() => (this.forced() ? 'account.methods.mustChangeTitle' : 'account.methods.changePasswordTitle'));

  save(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }

    const form = this.form();

    if (!form.current) {
      this.refusal.set('account.methods.currentRequired');
      return;
    }

    if (form.password.length < PASSWORD_MIN) {
      this.refusal.set('account.register.passwordTooShort');
      return;
    }

    if (form.password !== form.passwordAgain) {
      this.refusal.set('account.register.passwordMismatch');
      return;
    }

    // Worth catching here rather than letting the server accept it: the server
    // has no reason to refuse it, and somebody who meant to change their
    // password and did not is worse off than somebody told they have not.
    if (form.password === form.current) {
      this.refusal.set('account.methods.passwordUnchanged');
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._security.changePassword(form.current, form.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this._i18n.t('account.methods.passwordChanged'));
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

  /**
   * The way out of a forced change for somebody who cannot make one.
   *
   * They are still signed in until they press this, so it has to be here: the
   * alternative is a person stuck in front of a form they cannot fill in with
   * no way back to the site at all.
   */
  signOut(): void {
    this._security.logout(() => this.closeModal(false));
  }

  cancel(): void {
    this.closeModal(false);
  }
}
