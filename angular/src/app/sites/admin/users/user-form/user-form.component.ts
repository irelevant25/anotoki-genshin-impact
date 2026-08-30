import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CheckboxComponent } from '../../../../shared/local-lib/components/checkbox/checkbox.component';
import { PasswordComponent } from '../../../../shared/local-lib/components/password/password.component';
import { AccountEntry, AdminApiService } from '../../services/admin-api.service';

/**
 * Creating an account by hand, or changing one that exists.
 *
 * The password is only here when creating, because a new account needs one to
 * exist at all. Changing an existing password is its own modal - bundling it
 * into a form about usernames and roles is how somebody resets a password they
 * only meant to rename.
 */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  imports: [ModalComponent, ButtonComponent, TextComponent, DropdownComponent, CheckboxComponent, PasswordComponent],
})
export class UserFormComponent extends AbstractModalComponent {
  private readonly _api = inject(AdminApiService);

  /** All set by the opener before the modal renders. */
  readonly account = signal<AccountEntry | null>(null);
  readonly roles = signal<string[]>([]);
  readonly passwordMinLength = signal(8);
  readonly isSelf = signal(false);

  readonly username = signal<string | number | null | undefined>('');
  readonly email = signal<string | number | null | undefined>('');
  readonly password = signal<string | null | undefined>('');
  readonly role = signal<string | number | boolean | null | undefined>('USER');
  readonly confirmed = signal(false);
  readonly saving = signal(false);

  readonly isNew = computed(() => !this.account());

  readonly title = computed(() => (this.isNew() ? 'New account' : `Edit ${this.account()?.username}`));

  readonly canSave = computed(() => {
    if (this.saving()) {
      return false;
    }
    if (!String(this.username() ?? '').trim() || !String(this.email() ?? '').trim()) {
      return false;
    }
    return !this.isNew() || String(this.password() ?? '').length >= this.passwordMinLength();
  });

  /** Called by the opener once the inputs above are set. */
  start(): void {
    const account = this.account();
    if (account) {
      this.username.set(account.username);
      this.email.set(account.email);
      this.role.set(account.role);
      this.confirmed.set(account.email_confirmed);
    }
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    this.saving.set(true);
    const account = this.account();

    const request = account
      ? this._api.updateUser(account.id, {
          username: String(this.username() ?? '').trim(),
          email: String(this.email() ?? '').trim(),
          role: String(this.role() ?? 'USER'),
          email_confirmed: this.confirmed(),
        })
      : this._api.createUser({
          username: String(this.username() ?? '').trim(),
          email: String(this.email() ?? '').trim(),
          password: String(this.password() ?? ''),
          role: String(this.role() ?? 'USER'),
        });

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.notificationService.showSuccess(account ? `${saved.username} updated` : `${saved.username} created`);
        this.closeModal(true);
      },
      error: (e) => {
        this.saving.set(false);
        this.notificationService.showError(e?.error?.error ?? 'Could not save that');
        this.cd.markForCheck();
      },
    });
  }
}
