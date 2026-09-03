import { Component, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { QrCodeComponent } from '../../../../../shared/local-lib/components/qr-code/qr-code.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface ITwoFactor {
  code: string;
}

/**
 * Where two-factor is set up, and where it is turned off again.
 *
 * Which of those it is doing is decided by the account when it opens rather
 * than passed in, and settled at that point: whichever path it started on is
 * the one it stays on.
 *
 * Setting up has two faces. The first carries the QR, the key under it for
 * anybody without a camera to hand, and the field for the first code - until
 * that code comes back the account demands nothing, so abandoning the modal
 * here leaves it exactly as it was. The second is the recovery codes, which
 * are shown once and cannot be shown again.
 */
type TwoFactorStep = 'setup' | 'codes' | 'disable';

@Component({
  selector: 'app-site-two-factor-modal',
  templateUrl: './site-two-factor-modal.component.html',
  styleUrls: ['./site-two-factor-modal.component.scss'],
  imports: [ModalComponent, ButtonComponent, TextComponent, LoaderComponent, QrCodeComponent, CheckboxComponent, TranslatePipe],
})
export class SiteTwoFactorModalComponent extends FieldsComponent<ITwoFactor> {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  form = model<ITwoFactor>({ code: '' });

  readonly step = signal<TwoFactorStep>('setup');
  readonly refusal = signal<string | null>(null);

  /** The secret, in both the forms an authenticator will take it. */
  readonly secret = signal<string | null>(null);
  readonly uri = signal<string | null>(null);

  /** Shown once, and only once - the server keeps nothing but their hashes. */
  readonly recoveryCodes = signal<string[]>([]);

  /** Ticked by the reader, because losing these is how people lose accounts. */
  readonly codesSaved = signal(false);

  constructor() {
    super();

    // Already on means the only thing this modal can do is turn it off.
    if (this._security.currentUser()?.totp_enabled) {
      this.step.set('disable');
      return;
    }

    this._start();
  }

  /** The secret in groups of four, which is how it is typed by hand. */
  readableSecret(): string {
    return (this.secret() ?? '').replace(/(.{4})/g, '$1 ').trim();
  }

  confirm(): void {
    const code = this.form().code.trim();
    if (!code) {
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._security.enableTwoFactor(code).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.recoveryCodes.set(result.recovery_codes);
        this.step.set('codes');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.refusal.set(this._i18n.t(error?.error?.code === 'totp_invalid' ? 'account.twoFactor.badCode' : 'account.methods.failed'));
      },
    });
  }

  disable(): void {
    const code = this.form().code.trim();
    if (!code) {
      return;
    }

    this.refusal.set(null);
    this.loading.set(true);

    this._security.disableTwoFactor(code).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this._i18n.t('account.twoFactor.turnedOff'));
        this.closeModal(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.refusal.set(this._i18n.t(error?.error?.code === 'totp_invalid' ? 'account.twoFactor.badCode' : 'account.methods.failed'));
      },
    });
  }

  /** Copies the codes, for whoever would rather not retype ten of them. */
  copyCodes(): void {
    void navigator.clipboard?.writeText(this.recoveryCodes().join('\n')).then(
      () => this.notificationService.showSuccess(this._i18n.t('account.twoFactor.copied')),
      // Clipboard access is refused in plenty of ordinary situations, and the
      // codes are on screen to be read either way.
      () => undefined,
    );
  }

  finish(): void {
    this.notificationService.showSuccess(this._i18n.t('account.twoFactor.turnedOn'));
    this.closeModal(true);
  }

  cancel(): void {
    this.closeModal(false);
  }

  private _start(): void {
    this.loading.set(true);

    this._security.startTwoFactor().subscribe({
      next: (setup) => {
        this.loading.set(false);
        this.secret.set(setup.secret);
        this.uri.set(setup.uri);
      },
      error: () => {
        this.loading.set(false);
        this.refusal.set(this._i18n.t('account.methods.failed'));
      },
    });
  }
}
