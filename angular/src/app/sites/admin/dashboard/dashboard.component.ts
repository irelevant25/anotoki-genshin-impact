import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardApiService, DashboardStats } from '../../../api';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';
import { FileSizePipe } from '../../../shared/local-lib/pipes/file-size.pipe';

/** Formats given a card of their own before the rest are folded together. */
const DASHBOARD_FORMAT_CARDS = 5;

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
  imports: [AppDatePipe, DecimalPipe, FileSizePipe, RouterLink, LoaderComponent],
})
export class DashboardComponent implements OnInit {
  private readonly _dashboardApi = inject(DashboardApiService);
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

  /**
   * Files with no converted copy, of either kind, in one number.
   *
   * The two media are separate jobs on the Files page, where you can do
   * something about them. Here they are one figure: what the dashboard is for
   * is noticing there is a job at all.
   */
  readonly assetsMissing = computed(() => {
    const assets = this.stats()?.assets;
    return assets ? assets.images.missing + assets.audio.missing : 0;
  });

  /** Converted files whose source is gone. A fact, not a job - nothing can
   *  rebuild an original out of a lossy copy. */
  readonly assetsOrphaned = computed(() => {
    const assets = this.stats()?.assets;
    return assets ? assets.images.converted_only + assets.audio.converted_only : 0;
  });

  /**
   * The formats worth a card of their own, and everything else folded into one.
   *
   * A row per extension is right on the Files page, which is where somebody
   * goes to read the tree. Here there is room for a handful, and the answer to
   * "what else is in there" is more useful as one number than as a card nobody
   * has space for.
   */
  readonly assetFormats = computed(() => {
    const formats = this.stats()?.assets?.formats ?? [];
    const shown = formats.slice(0, DASHBOARD_FORMAT_CARDS);
    const rest = formats.slice(DASHBOARD_FORMAT_CARDS);

    if (!rest.length) {
      return shown;
    }

    return [
      ...shown,
      {
        extension: rest.length === 1 ? rest[0].extension : `${rest.length} others`,
        files: rest.reduce((sum, format) => sum + format.files, 0),
        bytes: rest.reduce((sum, format) => sum + format.bytes, 0),
      },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._dashboardApi.getDashboardStats().subscribe({
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
