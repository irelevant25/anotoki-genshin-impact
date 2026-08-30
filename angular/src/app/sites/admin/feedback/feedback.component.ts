import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs';
import { AdminApiService, FeedbackEntry, FeedbackFilters } from '../services/admin-api.service';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { Roles } from '../../../shared/local-lib/services/options-helper.service';
import { FeedbackViewerComponent } from './feedback-viewer/feedback-viewer.component';

/**
 * What people have sent through the contact form on the site.
 *
 * Read-only apart from the status, which is the difference between an inbox
 * and a pile. The long text lives in the viewer rather than the table: a
 * report with steps to reproduce does not fit in a cell.
 */
@Component({
  selector: 'app-admin-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  imports: [DatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent],
})
export class FeedbackComponent extends AbstractModalComponent implements OnInit {
  private readonly _api = inject(AdminApiService);
  private readonly _roles = inject(RoleService);

  readonly items = signal<FeedbackEntry[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly busy = signal(false);

  readonly filters = signal<FeedbackFilters | null>(null);
  readonly filterType = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterStatus = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterSection = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterSearch = signal<string | number | null | undefined>('');

  readonly deleteConfirm = signal<number | null>(null);

  readonly typeOptions = computed(() => this.filters()?.types ?? []);
  readonly statusOptions = computed(() => this.filters()?.statuses ?? []);
  readonly sectionOptions = computed(() => this.filters()?.sections ?? []);

  readonly unread = computed(() => this.filters()?.byStatus?.['new'] ?? 0);

  /**
   * Deleting is an admin's call; an editor can triage but not destroy.
   * Roles are fixed for the session by the time any admin page renders, so
   * this is read once rather than tracked.
   */
  readonly canDelete = this._roles.hasRole(Roles.ADMIN);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  readonly rangeLabel = computed(() => {
    if (!this.total()) {
      return 'No messages';
    }
    const from = (this.page() - 1) * this.pageSize() + 1;
    return `${from}–${Math.min(this.page() * this.pageSize(), this.total())} of ${this.total()}`;
  });

  readonly hasActiveFilter = computed(
    () =>
      !!this.filterType() ||
      !!this.filterStatus() ||
      !!this.filterSection() ||
      !!String(this.filterSearch() ?? '').trim(),
  );

  ngOnInit(): void {
    this._loadFilters();
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this._api
      .getFeedback({
        page: this.page(),
        type: String(this.filterType() ?? ''),
        status: String(this.filterStatus() ?? ''),
        section: String(this.filterSection() ?? ''),
        search: String(this.filterSearch() ?? '').trim(),
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.total.set(result.total);
          this.pageSize.set(result.pageSize);
          this.busy.set(false);
        },
        error: () => {
          this.busy.set(false);
          this.notificationService.showError('Failed to load feedback');
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filterType.set(undefined);
    this.filterStatus.set(undefined);
    this.filterSection.set(undefined);
    this.filterSearch.set('');
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  view(entry: FeedbackEntry): void {
    const modal = this.openModal<FeedbackViewerComponent>(FeedbackViewerComponent, { size: '4', scrollable: true });
    modal.componentInstance.entry.set(entry);
    modal.componentInstance.statuses.set(this.statusOptions());

    // Opening a message is what marks it read: it is the moment somebody
    // actually looked at it, which is what "new" was tracking.
    if (entry.status === 'new') {
      this._setStatus(entry, 'read');
    }

    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((changed) => {
      if (changed) {
        this.load();
        this._loadFilters();
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteConfirm.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(id: number): void {
    this._api.deleteFeedback(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.notificationService.showSuccess('Deleted');
        this.load();
        this._loadFilters();
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this.notificationService.showError(e?.error?.error ?? 'Failed to delete');
      },
    });
  }

  /** The title, or the opening of whichever text field this type filled in. */
  summaryOf(entry: FeedbackEntry): string {
    if (entry.title) {
      return entry.title;
    }
    const body = entry.message ?? entry.details ?? entry.steps_to_reproduce ?? '';
    return body ? body.slice(0, 70) + (body.length > 70 ? '…' : '') : '—';
  }

  senderOf(entry: FeedbackEntry): string {
    if (entry.username) {
      return entry.email ? `${entry.username} (${entry.email})` : entry.username;
    }
    return entry.email || 'Anonymous';
  }

  private _setStatus(entry: FeedbackEntry, status: string): void {
    this._api.setFeedbackStatus(entry.id, status).subscribe({
      next: () => {
        this.items.update((items) => items.map((item) => (item.id === entry.id ? { ...item, status } : item)));
        this._loadFilters();
      },
      error: () => undefined,
    });
  }

  private _loadFilters(): void {
    this._api.getFeedbackFilters().subscribe({
      next: (filters) => this.filters.set(filters),
      error: () => undefined,
    });
  }
}
