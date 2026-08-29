import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { CalendarComponent } from '../../../shared/local-lib/components/calendar/calendar.component';
import { DropdownOption } from '../../../shared/local-lib/services/options-helper.service';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { AdminApiService, AuditLogEntry } from '../services/admin-api.service';

interface ChangeRow {
  column: string;
  from: string;
  to: string;
}

/** Read-only view of the audit trail; there is no way to edit or delete a row. */
@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  imports: [LowerCasePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent, CalendarComponent],
})
export class AuditLogsComponent implements OnInit {
  items = signal<AuditLogEntry[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(50);
  loading = signal(false);

  tables = signal<string[]>([]);
  actions = signal<string[]>([]);
  userOptions = signal<DropdownOption[]>([]);

  filterTable = signal<string | number | boolean | null | undefined>(undefined);
  filterAction = signal<string | number | boolean | null | undefined>(undefined);
  filterUser = signal<string | number | boolean | null | undefined>(undefined);
  filterRecordId = signal<string | number | null | undefined>('');
  filterFrom = signal<string | undefined>(undefined);
  filterTo = signal<string | undefined>(undefined);

  /** Which row's changes are expanded. */
  expanded = signal<number | undefined>(undefined);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  rangeLabel = computed(() => {
    if (!this.total()) {
      return 'No entries';
    }
    const from = (this.page() - 1) * this.pageSize() + 1;
    return `${from}–${Math.min(this.page() * this.pageSize(), this.total())} of ${this.total()}`;
  });

  hasActiveFilter = computed(
    () =>
      !!this.filterTable() ||
      !!this.filterAction() ||
      !!this.filterUser() ||
      !!String(this.filterRecordId() ?? '').trim() ||
      !!this.filterFrom() ||
      !!this.filterTo()
  );

  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);

  ngOnInit(): void {
    this._loadFilters();
    this.load();
  }

  private _loadFilters(): void {
    this._api.getAuditLogFilters().subscribe({
      next: (data) => {
        this.tables.set(data.tables ?? []);
        this.actions.set(data.actions ?? []);
        this.userOptions.set((data.users ?? []).map((user) => ({ key: user.id, value: user.username })));
      },
      error: () => this._notify.showError('Failed to load the filter options'),
    });
  }

  load(): void {
    this.loading.set(true);
    this.expanded.set(undefined);
    this._api
      .getAuditLogs({
        table: this._asString(this.filterTable()),
        action: this._asString(this.filterAction()),
        user: this._asString(this.filterUser()),
        recordId: String(this.filterRecordId() ?? '').trim() || undefined,
        from: this.filterFrom(),
        to: this.filterTo(),
        page: this.page(),
      })
      .subscribe({
        next: (data) => {
          this.items.set(data.items ?? []);
          this.total.set(data.total ?? 0);
          this.pageSize.set(data.pageSize ?? 50);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this._notify.showError(error?.status === 403 ? 'Audit logs are visible to admins only.' : 'Failed to load audit logs');
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filterTable.set(undefined);
    this.filterAction.set(undefined);
    this.filterUser.set(undefined);
    this.filterRecordId.set('');
    this.filterFrom.set(undefined);
    this.filterTo.set(undefined);
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  toggle(entry: AuditLogEntry): void {
    this.expanded.update((id) => (id === entry.id ? undefined : entry.id));
  }

  /**
   * Updates log `{ column: { old, new } }`; inserts log the whole row, so those
   * are rendered as a single "set to" column.
   */
  changeRows(entry: AuditLogEntry): ChangeRow[] {
    const changes = entry.changes;
    if (!changes) {
      return [];
    }
    return Object.entries(changes).map(([column, value]) => {
      const pair = value as { old?: unknown; new?: unknown } | null;
      const isDiff = !!pair && typeof pair === 'object' && ('old' in pair || 'new' in pair);
      return {
        column,
        from: isDiff ? this.display(pair?.old) : '',
        to: isDiff ? this.display(pair?.new) : this.display(value),
      };
    });
  }

  display(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  changeCount(entry: AuditLogEntry): number {
    return entry.changes ? Object.keys(entry.changes).length : 0;
  }

  private _asString(value: string | number | boolean | null | undefined): string | undefined {
    return value === null || value === undefined || value === '' ? undefined : String(value);
  }
}
