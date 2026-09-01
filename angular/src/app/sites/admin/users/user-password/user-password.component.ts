import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { PasswordComponent } from '../../../../shared/local-lib/components/password/password.component';
import { UserApiService, AdminUser } from '../../../../api';
import { GENERATED_PASSWORD_LENGTH, randomPassword } from '../random-password';

/**
 * Setting somebody's password without knowing their old one.
 *
 * On its own rather than inside the edit form, so that a password is only ever
 * changed by somebody who came here to change a password. Typing it twice is
 * the only check there is - nobody can look the old one up, here or anywhere.
 */
@Component({
  selector: 'app-user-password',
  templateUrl: './user-password.component.html',
  styleUrls: ['./user-password.component.scss'],
  imports: [ModalComponent, ButtonComponent, PasswordComponent],
})
export class UserPasswordComponent extends AbstractModalComponent {
  private readonly _userApi = inject(UserApiService);

  /** Both set by the opener before the modal renders. */
  readonly account = signal<AdminUser | null>(null);
  readonly minLength = signal(8);

  readonly password = signal<string | null | undefined>('');
  readonly repeat = signal<string | null | undefined>('');
  readonly saving = signal(false);

  readonly passwordVisible = signal(false);

  /** True once a generated password is in the boxes, so the second one can go. */
  readonly generated = signal(false);

  readonly tooShort = computed(() => {
    const value = String(this.password() ?? '');
    return value.length > 0 && value.length < this.minLength();
  });

  readonly mismatched = computed(() => {
    const repeat = String(this.repeat() ?? '');
    return repeat.length > 0 && repeat !== String(this.password() ?? '');
  });

  readonly canSave = computed(
    () =>
      !this.saving() &&
      String(this.password() ?? '').length >= this.minLength() &&
      String(this.repeat() ?? '') === String(this.password() ?? ''),
  );

  /**
   * Fills both boxes and shows them.
   *
   * Both, because the second box exists to catch a typo, and there is no typo
   * to catch in something nobody typed. Shown, because a password nobody chose
   * has to be read off the screen to be any use.
   */
  generate(): void {
    const password = randomPassword(GENERATED_PASSWORD_LENGTH);
    this.password.set(password);
    this.repeat.set(password);
    this.passwordVisible.set(true);
    this.generated.set(true);
  }

  /**
   * Typing over a generated password puts the second box back.
   *
   * Only a real keystroke gets here - setting the value in code does not emit -
   * so generating does not immediately undo itself.
   */
  onTyped(): void {
    if (this.generated()) {
      this.generated.set(false);
      this.repeat.set('');
    }
  }

  save(): void {
    const account = this.account();
    if (!account || !this.canSave()) {
      return;
    }

    this.saving.set(true);
    this._userApi.setUserPassword(account.id, { password: String(this.password() ?? '') }).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.notificationService.showSuccess(`New password set for ${account.username}. ${result.note}`);
        this.closeModal(true);
      },
      error: (e) => {
        this.saving.set(false);
        this.notificationService.showError(e?.error?.error ?? 'Could not set that password');
      },
    });
  }
}
