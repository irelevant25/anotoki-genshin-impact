import { Component, inject, model, signal } from '@angular/core';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface IForgot {
  email: string;
}

/**
 * Asking for a link to set a new password.
 *
 * The server answers the same whatever it finds - an address with an account,
 * one without, one that signs in some other way - so this cannot say whether
 * anything was actually sent, and does not try. It says a message is on its
 * way if there was anywhere to send one, which is true in every case and gives
 * away nothing about who has an account here.
 */
@Component({
  selector: 'app-site-forgot-password-modal',
  templateUrl: './site-forgot-password-modal.component.html',
  styleUrls: ['../site-register-modal/site-register-modal.component.scss'],
  imports: [ModalComponent, TextComponent, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class SiteForgotPasswordModalComponent extends FieldsComponent<IForgot> {
  private readonly _security = inject(SecurityService);

  form = model<IForgot>({ email: '' });

  /** True once the request has been made, whatever came of it. */
  readonly asked = signal(false);

  ask(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }

    this.loading.set(true);
    this._security.requestPasswordReset(this.form().email.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.asked.set(true);
      },
      // Even a failed request is answered the same way. The alternative is a
      // form that says "no account here" whenever the network hiccups, which
      // is both wrong and the exact thing the endpoint refuses to tell anyone.
      error: () => {
        this.loading.set(false);
        this.asked.set(true);
      },
    });
  }

  cancel(): void {
    this.closeModal(false);
  }
}
