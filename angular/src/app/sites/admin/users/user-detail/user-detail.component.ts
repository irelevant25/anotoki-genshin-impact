import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { AdminUserDetail, SessionApiService, UserApiService } from '../../../../api';

/** What the four date and time choices are called where somebody has to read one. */
const FORMAT_NAMES: Record<string, string> = {
  dmy_dot: 'day.month.year',
  dmy_slash: 'day/month/year',
  mdy_slash: 'month/day/year',
  ymd_dash: 'year-month-day',
};

/**
 * Everything about one account, gathered from the five tables it lives in.
 *
 * The list answers "who exists". This answers "who is this person, and what
 * has been happening to their account" - how they have the site set up, which
 * ways in they have, where they have signed in from and what has been tried
 * against them and failed.
 *
 * Read-only apart from ending a session, which is the one thing an admin
 * looking at this page might actually need to do about what they are seeing: a
 * browser left signed in somewhere it should not be. Everything else - roles,
 * passwords, disabling - has its own button in the list, where somebody went
 * looking for it deliberately.
 */
@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent, AppDatePipe],
})
export class UserDetailComponent extends AbstractModalComponent {
  private readonly _userApi = inject(UserApiService);
  private readonly _sessionApi = inject(SessionApiService);

  /** Both set by the opener before the modal renders. */
  readonly userId = signal(0);
  readonly canManage = signal(false);

  readonly detail = signal<AdminUserDetail | null>(null);
  readonly busy = signal(true);
  readonly failed = signal(false);

  /** Which session the "end this" button is waiting for confirmation on. */
  readonly endConfirm = signal<number | null>(null);

  /** True once something was ended, so the list behind reloads on close. */
  private _changed = false;

  readonly account = computed(() => this.detail()?.account ?? null);

  readonly title = computed(() => this.account()?.username ?? 'Account');

  /**
   * Whether this account can be signed into at all, and how.
   *
   * Not a column anywhere - it is the same rule the account page applies from
   * the inside, read here from the outside.
   */
  readonly waysIn = computed(() => {
    const account = this.account();
    if (!account) {
      return [];
    }

    const ways: string[] = [];
    if (account.google_connected) {
      ways.push(`Google (${account.google_email ?? 'address not given'})`);
    }
    // The list has no `has_password` on it: an account made here always has
    // one, and one made through Google alone shows only Google above.
    if (!account.google_connected) {
      ways.push('Password');
    }
    return ways;
  });

  readonly dateFormat = computed(() => this._formatName(this.account()?.date_format));

  readonly timeFormat = computed(() => {
    const choice = this.account()?.time_format;
    if (!choice) {
      return 'as their device does';
    }
    return choice === '12' ? '12-hour' : '24-hour';
  });

  /** Called by the opener once the inputs above are set. */
  start(): void {
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this.failed.set(false);

    this._userApi.getUserDetail(this.userId()).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  askToEnd(id: number): void {
    this.endConfirm.set(id);
  }

  cancelEnd(): void {
    this.endConfirm.set(null);
  }

  endSession(id: number): void {
    this._sessionApi.endUserSession(id).subscribe({
      next: () => {
        this.endConfirm.set(null);
        this._changed = true;
        this.notificationService.showSuccess('That session is over.');
        this.load();
      },
      error: (e) => {
        this.endConfirm.set(null);
        this.notificationService.showError(e?.error?.error ?? 'Could not end that session');
      },
    });
  }

  close(): void {
    this.closeModal(this._changed);
  }

  private _formatName(choice: string | null | undefined): string {
    return choice ? (FORMAT_NAMES[choice] ?? choice) : 'as their device does';
  }
}
