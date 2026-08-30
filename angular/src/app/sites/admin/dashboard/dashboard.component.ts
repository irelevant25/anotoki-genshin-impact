import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService, DashboardStats } from '../services/admin-api.service';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';

/**
 * What needs attention, and what is still missing.
 *
 * Deliberately not a summary of how much data there is - that number is large
 * and never changes usefully. The dashboard is a to-do list assembled from the
 * database: unread feedback, records missing the rows they should have, and
 * where the last editing session left off.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [DatePipe, RouterLink, LoaderComponent],
})
export class DashboardComponent implements OnInit {
  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(false);

  /** Every gap, biggest first - the server has already dropped the empty ones. */
  readonly gaps = computed(() =>
    (this.stats()?.gaps ?? []).map((gap) => ({
      ...gap,
      percent: gap.total ? Math.round((100 * gap.missing) / gap.total) : 0,
      // A gap covering most of a table is a different kind of job from one
      // covering a handful of stragglers, so the colour says which.
      severe: gap.total > 0 && gap.missing / gap.total > 0.5,
    })),
  );

  readonly translationCoverage = computed(() => {
    const translations = this.stats()?.translations;
    if (!translations?.keys) {
      return [];
    }
    return translations.languages.map((language) => ({
      ...language,
      percent: Math.round((100 * language.translated) / translations.keys),
      total: translations.keys,
    }));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._api.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Failed to load dashboard');
      },
    });
  }
}
