import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { AdminApiService, FeedbackEntry } from '../../services/admin-api.service';

/** The long-text fields, in reading order, with what to call each one. */
const DETAIL_FIELDS: { field: keyof FeedbackEntry; label: string }[] = [
  { field: 'message', label: 'Message' },
  { field: 'details', label: 'Details' },
  { field: 'why_important', label: 'Why it matters' },
  { field: 'steps_to_reproduce', label: 'Steps to reproduce' },
  { field: 'expected_behavior', label: 'Expected behaviour' },
  { field: 'actual_behavior', label: 'Actual behaviour' },
  { field: 'browser_device_info', label: 'Browser & device information' },
  { field: 'additional_info', label: 'Additional information' },
];

/**
 * One message in full, opened from the list.
 *
 * Read-only apart from the status: the text is what somebody wrote, so there
 * is nothing here that edits it.
 */
@Component({
  selector: 'app-feedback-viewer',
  templateUrl: './feedback-viewer.component.html',
  styleUrls: ['./feedback-viewer.component.scss'],
  imports: [DatePipe, ModalComponent, ButtonComponent],
})
export class FeedbackViewerComponent extends AbstractModalComponent {
  private readonly _api = inject(AdminApiService);

  /** Set by the opener before the modal renders. */
  readonly entry = signal<FeedbackEntry | null>(null);
  readonly statuses = signal<string[]>([]);

  /** True once the status was changed, so the list knows to reload. */
  private _changed = false;

  readonly title = computed(() => {
    const entry = this.entry();
    if (!entry) {
      return 'Feedback';
    }
    return entry.title || `${entry.type} message`;
  });

  /** Only the fields this message actually carries - the rest never applied. */
  readonly fields = computed(() => {
    const entry = this.entry();
    if (!entry) {
      return [];
    }
    return DETAIL_FIELDS.filter((field) => !!entry[field.field]).map((field) => ({
      label: field.label,
      value: String(entry[field.field]),
    }));
  });

  readonly sender = computed(() => {
    const entry = this.entry();
    if (!entry) {
      return '';
    }
    if (entry.username) {
      return entry.email ? `${entry.username} (${entry.email})` : entry.username;
    }
    return entry.email || 'Anonymous';
  });

  setStatus(status: string): void {
    const entry = this.entry();
    if (!entry || entry.status === status) {
      return;
    }

    this._api.setFeedbackStatus(entry.id, status).subscribe({
      next: () => {
        this.entry.update((current) => (current ? { ...current, status } : current));
        this._changed = true;
        this.cd.markForCheck();
      },
      error: (e) => this.notificationService.showError(e?.error?.error ?? 'Failed to update'),
    });
  }

  /** Closing reports whether anything changed, so the list only reloads if so. */
  close(): void {
    this.closeModal(this._changed);
  }
}
