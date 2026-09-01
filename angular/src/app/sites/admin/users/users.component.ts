import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { Roles } from '../../../shared/local-lib/services/options-helper.service';
import { SecurityService } from '../../../shared/local-lib/services/security.service';
import { AdminUser, UserApiService, UserFilters, UserQuery } from '../../../api';
import { UserFormComponent } from './user-form/user-form.component';
import { UserPasswordComponent } from './user-password/user-password.component';

/**
 * Accounts: who exists, what they may do, and who is switched off.
 *
 * Disabling rather than deleting is the honest description of what happens -
 * the row stays and the account simply cannot be used, which is what the rest
 * of the API has always meant by its `deleted` flag. Nothing here removes
 * anybody's history.
 */
@Component({
  selector: 'app-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [DatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent],
})
export class UsersComponent extends AbstractModalComponent implements OnInit {
  private readonly _userApi = inject(UserApiService);
  private readonly _roles = inject(RoleService);
  private readonly _security = inject(SecurityService);

  /** Accounts are System: an editor sees the list and changes nothing. */
  readonly canManage = this._roles.hasRole(Roles.ADMIN);

  readonly accounts = signal<AdminUser[]>([]);
  readonly filters = signal<UserFilters | null>(null);
  readonly busy = signal(false);

  readonly filterSearch = signal<string | number | null | undefined>('');
  readonly filterRole = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterStatus = signal<string | number | boolean | null | undefined>(undefined);

  readonly disableConfirm = signal<number | null>(null);

  readonly roleOptions = computed(() => this.filters()?.roles ?? []);

  readonly statusOptions = ['enabled', 'disabled'];

  readonly hasActiveFilter = computed(
    () => !!this.filterRole() || !!this.filterStatus() || !!String(this.filterSearch() ?? '').trim(),
  );

  /** The signed-in account, so its own row can say so and protect itself. */
  readonly myUsername = signal('');

  readonly summary = computed(() => {
    const filters = this.filters();
    if (!filters) {
      return '';
    }
    const parts = [`${filters.total} active`];
    if (filters.disabled) {
      parts.push(`${filters.disabled} disabled`);
    }
    return parts.join(' · ');
  });

  ngOnInit(): void {
    this._security.currentUserData$
      .pipe(takeUntil(this.unsubscriber))
      .subscribe((user) => this.myUsername.set(user?.username ?? ''));

    this._loadFilters();
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this._userApi
      .getUsers({
        search: String(this.filterSearch() ?? '').trim(),
        role: String(this.filterRole() ?? ''),
        status: (String(this.filterStatus() ?? '') || undefined) as UserQuery['status'],
      })
      .subscribe({
        next: (accounts) => {
          this.accounts.set(accounts ?? []);
          this.busy.set(false);
        },
        error: () => {
          this.busy.set(false);
          this.notificationService.showError('Failed to load accounts');
        },
      });
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.filterSearch.set('');
    this.filterRole.set(undefined);
    this.filterStatus.set(undefined);
    this.load();
  }

  create(): void {
    const modal = this.openModal<UserFormComponent>(UserFormComponent, { size: '3' }, () => this._reload());
    modal.componentInstance.roles.set(this.roleOptions());
    modal.componentInstance.passwordMinLength.set(this.filters()?.passwordMinLength ?? 8);
    modal.componentInstance.start();
  }

  edit(account: AdminUser): void {
    const modal = this.openModal<UserFormComponent>(UserFormComponent, { size: '3' }, () => this._reload());
    modal.componentInstance.roles.set(this.roleOptions());
    modal.componentInstance.passwordMinLength.set(this.filters()?.passwordMinLength ?? 8);
    modal.componentInstance.account.set(account);
    modal.componentInstance.isSelf.set(this.isSelf(account));
    // Fills the fields from the account, so it has to run after the set above.
    modal.componentInstance.start();
  }

  changePassword(account: AdminUser): void {
    const modal = this.openModal<UserPasswordComponent>(UserPasswordComponent, { size: '2' });
    modal.componentInstance.account.set(account);
    modal.componentInstance.minLength.set(this.filters()?.passwordMinLength ?? 8);
  }

  askToDisable(id: number): void {
    this.disableConfirm.set(id);
  }

  cancelDisable(): void {
    this.disableConfirm.set(null);
  }

  setEnabled(account: AdminUser, enabled: boolean): void {
    this._userApi.setUserEnabled(account.id, { enabled }).subscribe({
      next: () => {
        this.disableConfirm.set(null);
        this.notificationService.showSuccess(enabled ? `${account.username} can sign in again` : `${account.username} is disabled`);
        this._reload();
      },
      error: (e) => {
        this.disableConfirm.set(null);
        this.notificationService.showError(e?.error?.error ?? 'Could not change that');
      },
    });
  }

  isSelf(account: AdminUser): boolean {
    return account.username === this.myUsername();
  }

  private _reload(): void {
    this.load();
    this._loadFilters();
  }

  private _loadFilters(): void {
    this._userApi.getUserFilters().subscribe({
      next: (filters) => this.filters.set(filters),
      error: () => undefined,
    });
  }
}
