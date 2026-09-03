import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { Roles } from '../../../shared/local-lib/services/options-helper.service';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';
import { AdminSessionEntry, SessionApiService, SessionHistoryQuery } from '../../../api';

/**
 * Every session anybody has had here.
 *
 * A person can already see their own on their profile; this is the same table
 * from the other side, and the question it exists for is "who is signed in
 * right now". That is the default filter, and the count at the top is
 * deliberately not filtered with the rest - "eleven people are signed in" is
 * the number worth having, and it should not change because somebody typed a
 * name into the search box.
 *
 * Live means unrevoked and unexpired both, worked out by the server against
 * its own clock. A session nobody signed out of is not the same as one that
 * still works.
 *
 * Nothing here can be deleted. Ending a session marks the row and leaves it -
 * a history with holes in it is not one.
 */
@Component({
  selector: 'app-admin-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  imports: [AppDatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent],
})
export class AdminSessionsComponent extends AbstractModalComponent implements OnInit {
  private readonly _sessionApi = inject(SessionApiService);
  private readonly _roles = inject(RoleService);

  /** The whole page is ADMIN; an editor never reaches it. */
  readonly canManage = this._roles.hasRole(Roles.ADMIN);

  readonly sessions = signal<AdminSessionEntry[]>([]);
  readonly total = signal(0);
  readonly liveNow = signal(0);
  readonly methods = signal<string[]>([]);
  readonly busy = signal(false);

  readonly filterSearch = signal<string | number | null | undefined>('');
  readonly filterStatus = signal<string | number | boolean | null | undefined>('active');
  readonly filterMethod = signal<string | number | boolean | null | undefined>(undefined);

  readonly statusOptions = ['active', 'ended'];

  /** True when the page is showing fewer rows than the filter matched. */
  readonly truncated = computed(() => this.total() > this.sessions().length);

  readonly hasActiveFilter = computed(
    () => !!this.filterMethod() || !!String(this.filterSearch() ?? '').trim() || this.filterStatus() !== 'active',
  );

  readonly endConfirm = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.busy.set(true);

    const status = String(this.filterStatus() ?? '');

    this._sessionApi
      .getSessionHistory({
        search: String(this.filterSearch() ?? '').trim() || undefined,
        method: String(this.filterMethod() ?? '') || undefined,
        status: (status === 'active' || status === 'ended' ? status : undefined) as SessionHistoryQuery['status'],
      })
      .subscribe({
        next: (page) => {
          this.sessions.set(page.sessions ?? []);
          this.total.set(page.total);
          this.liveNow.set(page.active);
          this.methods.set(page.methods ?? []);
          this.busy.set(false);
        },
        error: () => {
          this.busy.set(false);
          this.notificationService.showError('Failed to load the session history');
        },
      });
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.filterSearch.set('');
    this.filterMethod.set(undefined);
    // Back to the question the page is for, rather than to no filter at all.
    this.filterStatus.set('active');
    this.load();
  }

  askToEnd(id: number): void {
    this.endConfirm.set(id);
  }

  cancelEnd(): void {
    this.endConfirm.set(null);
  }

  endSession(row: AdminSessionEntry): void {
    this._sessionApi.endUserSession(row.id).subscribe({
      next: () => {
        this.endConfirm.set(null);
        this.notificationService.showSuccess(`${row.username} is signed out of that browser.`);
        this.load();
      },
      error: (e) => {
        this.endConfirm.set(null);
        this.notificationService.showError(e?.error?.error ?? 'Could not end that session');
      },
    });
  }
}
