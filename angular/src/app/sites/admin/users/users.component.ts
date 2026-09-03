import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { Roles } from '../../../shared/local-lib/services/options-helper.service';
import { SecurityService } from '../../../shared/local-lib/services/security.service';
import { AdminUser, UserApiService, UserFilters, UserFlagFilter, UserQuery } from '../../../api';
import { UserFormComponent } from './user-form/user-form.component';
import { UserPasswordComponent } from './user-password/user-password.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';

/** What a signal holding a dropdown's value can be. */
type FilterValue = string | number | boolean | null | undefined;

/**
 * Accounts: who exists, what they may do, and who is switched off.
 *
 * Disabling rather than deleting is the honest description of what happens -
 * the row stays and the account simply cannot be used, which is what the rest
 * of the API has always meant by its `deleted` flag. Nothing here removes
 * anybody's history.
 *
 * The table shows the four things that answer "can this person get in, and
 * how": whether their address was confirmed, whether a code is demanded,
 * whether Google is attached, and whether they are still on a password an
 * admin chose. Everything else about an account - appearance, date and time
 * formats, sessions, what has been tried against it and failed - is a click
 * away in the detail view, because a table wide enough to hold all of it is a
 * table nobody can read.
 */
@Component({
  selector: 'app-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [AppDatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent],
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
  readonly filterRole = signal<FilterValue>(undefined);
  readonly filterStatus = signal<FilterValue>(undefined);
  readonly filterConfirmed = signal<FilterValue>(undefined);
  readonly filterTwoFactor = signal<FilterValue>(undefined);
  readonly filterGoogle = signal<FilterValue>(undefined);
  readonly filterMustChange = signal<FilterValue>(undefined);
  readonly filterLanguage = signal<FilterValue>(undefined);

  readonly disableConfirm = signal<number | null>(null);

  readonly roleOptions = computed(() => this.filters()?.roles ?? []);
  readonly languageOptions = computed(() => this.filters()?.languages ?? []);

  readonly statusOptions = ['enabled', 'disabled'];

  /** Every flag filter takes the same two answers; absent means "do not ask". */
  readonly flagOptions = ['yes', 'no'];

  private readonly _flagFilters = computed(() => [
    this.filterConfirmed(),
    this.filterTwoFactor(),
    this.filterGoogle(),
    this.filterMustChange(),
    this.filterLanguage(),
  ]);

  readonly hasActiveFilter = computed(
    () =>
      !!this.filterRole() ||
      !!this.filterStatus() ||
      !!String(this.filterSearch() ?? '').trim() ||
      this._flagFilters().some((value) => !!value),
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
        confirmed: this._flag(this.filterConfirmed()),
        twoFactor: this._flag(this.filterTwoFactor()),
        google: this._flag(this.filterGoogle()),
        mustChange: this._flag(this.filterMustChange()),
        language: String(this.filterLanguage() ?? '') || undefined,
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
    [
      this.filterRole,
      this.filterStatus,
      this.filterConfirmed,
      this.filterTwoFactor,
      this.filterGoogle,
      this.filterMustChange,
      this.filterLanguage,
    ].forEach((filter) => filter.set(undefined));
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

  /**
   * Everything about one account, gathered from the five tables it is in.
   *
   * Open to editors as well: reading who somebody is and where they have
   * signed in from is System-read, and it is the same right that already lets
   * an editor see the list.
   */
  details(account: AdminUser): void {
    const modal = this.openModal<UserDetailComponent>(UserDetailComponent, { size: '4', scrollable: true }, () => this._reload());
    modal.componentInstance.userId.set(account.id);
    modal.componentInstance.canManage.set(this.canManage);
    modal.componentInstance.start();
  }

  changePassword(account: AdminUser): void {
    const modal = this.openModal<UserPasswordComponent>(UserPasswordComponent, { size: '2' }, () => this._reload());
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

  /** A dropdown's value as the query wants it: 'yes', 'no', or nothing at all. */
  private _flag(value: FilterValue): UserFlagFilter | undefined {
    const text = String(value ?? '');
    return text === 'yes' || text === 'no' ? text : undefined;
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
