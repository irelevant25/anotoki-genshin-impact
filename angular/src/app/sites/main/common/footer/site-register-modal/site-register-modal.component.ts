import { Component, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface IRegister {
  username: string;
  email: string;
  password: string;
  passwordAgain: string;
}

/** The shortest password the API will take. Checked here so the trip is saved. */
const PASSWORD_MIN = 8;

/**
 * Making an account.
 *
 * The modal has two faces. Until the account is made it is a form; afterwards
 * it is a note saying to go and read the message, because that is genuinely
 * all that is left to do - registering hands back no session, and nothing can
 * be done with the account until somebody opens the link.
 *
 * It does not close itself on success for the same reason. A modal that
 * vanished would take the address it was sent to with it, and that address is
 * the one thing somebody who mistyped it needs to see.
 */
@Component({
  selector: 'app-site-register-modal',
  templateUrl: './site-register-modal.component.html',
  styleUrls: ['./site-register-modal.component.scss'],
  imports: [ModalComponent, TextComponent, PasswordComponent, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class SiteRegisterModalComponent extends FieldsComponent<IRegister> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<IRegister>({
    username: '',
    email: '',
    password: '',
    passwordAgain: '',
  });

  /** The address the message went to, once it has. Null while still a form. */
  readonly sentTo = signal<string | null>(null);

  /** False when the account was made but the message did not go out. */
  readonly delivered = signal(true);

  /** What the server said, when it refused for a reason worth showing. */
  readonly refusal = signal<string | null>(null);

  readonly passwordMin = PASSWORD_MIN;

  /**
   * Checked here as well as on the server, so the two commonest mistakes - a
   * typo in the repeated password, and one that is too short - are caught
   * without a round trip and without creating anything.
   *
   * A method rather than a computed: the inputs write through
   * `[(value)]="form().password"`, which mutates the object in place and never
   * replaces the signal, so a computed would cache its first answer and keep
   * handing it back however the form was edited afterwards.
   */
  private _localProblem(): string | null {
    const form = this.form();

    if (form.password.length < PASSWORD_MIN) {
      return 'account.register.passwordTooShort';
    }

    return form.password === form.passwordAgain ? null : 'account.register.passwordMismatch';
  }

  submitRegistration(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }

    const problem = this._localProblem();
    if (problem) {
      this.refusal.set(problem);
      return;
    }

    const form = this.form();
    this.refusal.set(null);
    this.loading.set(true);

    // The language the form was read in, so the message arrives in it. The
    // account has no language of its own yet - it is being made.
    this._security.register(form.username.trim(), form.email.trim(), form.password, this._i18n.language()).subscribe({
      next: (pending) => {
        this.loading.set(false);
        this.delivered.set(pending.sent);
        this.sentTo.set(pending.email);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        // The API answers a taken username or address with prose meant to be
        // read, so it is shown rather than replaced with something vaguer.
        this.refusal.set(error?.error?.error ?? 'account.register.failed');
      },
    });
  }

  /** Asks for the message again, for an address that was right after all. */
  resend(): void {
    const email = this.sentTo();
    if (!email) {
      return;
    }

    this.loading.set(true);
    this._security.resendConfirmation(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.delivered.set(true);
        this.notificationService.showSuccess(this._i18n.t('account.confirm.resent'));
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this._i18n.t('account.confirm.resendFailed'));
      },
    });
  }

  /**
   * Whether the refusal is one of this component's own keys or the server's
   * own words. Anything with a dot and no space is a key.
   */
  refusalIsKey(): boolean {
    const refusal = this.refusal();
    return !!refusal && refusal.includes('.') && !refusal.includes(' ');
  }

  cancel(): void {
    this.closeModal(false);
  }

  /** Done, and whoever registered can go and read their mail. */
  finish(): void {
    this.closeModal(true);
  }
}
