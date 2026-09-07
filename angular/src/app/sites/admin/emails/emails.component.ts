import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { CalendarComponent } from '../../../shared/local-lib/components/calendar/calendar.component';
import { DropdownOption } from '../../../shared/local-lib/services/options-helper.service';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { EmailApiService, EmailLogEntry } from '../../../api';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';

/**
 * Read-only view of email_log — what the API has sent, when, and to whom.
 *
 * Metadata only: the backend stores no bodies and keeps a subject only for the
 * kinds whose subject is not sensitive, so a sign-in code never appears here.
 */
@Component({
  selector: 'app-emails',
  templateUrl: './emails.component.html',
  styleUrls: ['./emails.component.scss'],
  imports: [AppDatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent, CalendarComponent],
})
export class EmailsComponent implements OnInit {
  items = signal<EmailLogEntry[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(50);
  loading = signal(false);

  kinds = signal<string[]>([]);
  statuses = signal<string[]>([]);

  filterKind = signal<string | number | boolean | null | undefined>(undefined);
  filterStatus = signal<string | number | boolean | null | undefined>(undefined);
  filterRecipient = signal<string | number | null | undefined>('');
  filterFrom = signal<string | undefined>(undefined);
  filterTo = signal<string | undefined>(undefined);

  /** The kind slugs, shown as friendly labels in the dropdown but filtered by slug. */
  kindOptions = computed<DropdownOption[]>(() => this.kinds().map((kind) => ({ key: kind, value: this.kindLabel(kind) })));

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  rangeLabel = computed(() => {
    if (!this.total()) {
      return 'No emails';
    }
    const from = (this.page() - 1) * this.pageSize() + 1;
    return `${from}–${Math.min(this.page() * this.pageSize(), this.total())} of ${this.total()}`;
  });

  hasActiveFilter = computed(
    () =>
      !!this.filterKind() ||
      !!this.filterStatus() ||
      !!String(this.filterRecipient() ?? '').trim() ||
      !!this.filterFrom() ||
      !!this.filterTo()
  );

  private readonly _kindLabels: Record<string, string> = {
    confirmation: 'Email confirmation',
    password_reset: 'Password reset',
    login_code: 'Sign-in code',
  };

  private readonly _emailApi = inject(EmailApiService);
  private readonly _notify = inject(NotificationService);

  ngOnInit(): void {
    this._loadFilters();
    this.load();
  }

  /** A human label for a kind slug; the slug itself for anything unmapped. */
  kindLabel(kind: string): string {
    return this._kindLabels[kind] ?? kind;
  }

  private _loadFilters(): void {
    this._emailApi.getEmailLogFilters().subscribe({
      next: (data) => {
        this.kinds.set(data.kinds ?? []);
        this.statuses.set(data.statuses ?? []);
      },
      error: () => this._notify.showError('Failed to load the filter options'),
    });
  }

  load(): void {
    this.loading.set(true);
    this._emailApi
      .getEmailLog({
        kind: this._asString(this.filterKind()),
        status: this._asString(this.filterStatus()),
        recipient: String(this.filterRecipient() ?? '').trim() || undefined,
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
          this._notify.showError(error?.status === 403 ? 'The email log is visible to admins only.' : 'Failed to load the email log');
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filterKind.set(undefined);
    this.filterStatus.set(undefined);
    this.filterRecipient.set('');
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

  private _asString(value: string | number | boolean | null | undefined): string | undefined {
    return value === null || value === undefined || value === '' ? undefined : String(value);
  }
}
