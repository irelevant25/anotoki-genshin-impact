import { DecimalPipe } from '@angular/common';
import { PaginationComponent } from '@anotoki/lib/ui/pagination';
import { CheckboxComponent } from '@anotoki/lib/ui/forms';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { Component, computed, inject, signal } from '@angular/core';
import { AssetCleanupFile, AssetCleanupProgress, FileApiService } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { DisclosureComponent } from '@anotoki/lib/ui/disclosure';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { FileSizePipe } from '../../../../shared/local-lib/pipes/file-size.pipe';

/** Files per request while the deletion runs. The server also stops on a clock. */
const CLEANUP_BATCH = 400;

/**
 * Taking the originals away, once the site is serving the converted files.
 *
 * Everything here is opt-out. The list arrives already agreed to - every file
 * on it has a converted twin and nothing in the database names it - and the
 * work is to take things *off* it. That is why the checkboxes start ticked and
 * why what travels back to the server is the handful somebody unticked rather
 * than the forty thousand they left alone.
 *
 * Paged, because the audio list is thirty-eight thousand rows and rendering
 * that would make the modal useless for the one thing it is for. What is
 * unticked is remembered across pages; the rest is never held here at all.
 */
@Component({
  selector: 'app-cleanup-modal',
  templateUrl: './cleanup-modal.component.html',
  styleUrls: ['./cleanup-modal.component.scss'],
  imports: [PaginationComponent, CheckboxComponent, SpinnerComponent, DialogFooterDirective, ButtonComponent, DisclosureComponent, DecimalPipe, FileSizePipe],
})
export class CleanupModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  /** Pictures or sound: what the page hands over. */
  readonly kind = signal<'image' | 'audio'>(inject<'image' | 'audio' | null>(ANOTOKI_DIALOG_DATA, { optional: true }) ?? 'image');

  readonly files = signal<AssetCleanupFile[]>([]);
  readonly total = signal(0);
  readonly bytes = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(100);

  /** Paths that were unticked. Small by design - the list is opt-out. */
  readonly kept = signal<Set<string>>(new Set());

  readonly running = signal(false);
  readonly progress = signal<AssetCleanupProgress | null>(null);

  readonly title = computed(() => (this.kind() === 'image' ? 'Delete original images' : 'Delete original audio'));

  readonly sourceFormats = computed(() => (this.kind() === 'image' ? 'PNG, JPG and WebP' : 'MP3, OGG, WAV and M4A'));
  readonly convertedFormat = computed(() => (this.kind() === 'image' ? 'AVIF' : 'Opus'));

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly willDelete = computed(() => this.total() - this.kept().size);

  readonly percent = computed(() => {
    const progress = this.progress();
    if (!progress?.total) {
      return 0;
    }
    return Math.round((100 * (progress.total - progress.remaining)) / progress.total);
  });

  constructor() {
    super();
    this.dialogHeading(() => this.title());
    this.start();
  }

  /** The first page of candidates, for the kind handed over. */
  start(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.page.set(page);

    this._fileApi.getCleanupCandidates({ kind: this.kind(), page }).subscribe({
      next: (data) => {
        this.files.set(data.files);
        this.total.set(data.total);
        this.bytes.set(data.bytes);
        this.pageSize.set(data.pageSize);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Could not read the list.');
      },
    });
  }

  isKept(file: AssetCleanupFile): boolean {
    return this.kept().has(file.path);
  }

  toggle(file: AssetCleanupFile): void {
    this.kept.update((kept) => {
      const next = new Set(kept);
      if (next.has(file.path)) {
        next.delete(file.path);
      } else {
        next.add(file.path);
      }
      return next;
    });
  }

  /** Takes this page off the list, or puts it back. Paging keeps the rest. */
  togglePage(keep: boolean): void {
    this.kept.update((kept) => {
      const next = new Set(kept);
      for (const file of this.files()) {
        if (keep) {
          next.add(file.path);
        } else {
          next.delete(file.path);
        }
      }
      return next;
    });
  }

  previous(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  next(): void {
    if (this.page() < this.totalPages()) {
      this.load(this.page() + 1);
    }
  }

  // ── Doing it ───────────────────────────────────────────────────────────────

  run(): void {
    if (!this.willDelete()) {
      return;
    }

    this.running.set(true);

    // The bar is drawn from this, so it has to exist before the first request
    // rather than after it. That request builds the whole delete list on the
    // server, which is the slowest one of the run - and until this was here it
    // was spent looking at the table, wondering whether the button had worked.
    this.progress.set({
      kind: this.kind(),
      started_at: new Date().toISOString(),
      total: this.willDelete(),
      bytes: this.bytes(),
      trashed: 0,
      failed: 0,
      kept: this.kept().size,
      remaining: this.willDelete(),
      finished: false,
      failures: [],
    });

    this._step(true);
  }

  stop(): void {
    this.running.set(false);
  }

  dismiss(): void {
    // True whenever anything moved, so the page behind re-reads its numbers.
    this.closeModal((this.progress()?.trashed ?? 0) > 0);
  }

  private _step(restart: boolean): void {
    const body = restart ? { restart: true, kind: this.kind(), keep: [...this.kept()], limit: CLEANUP_BATCH } : { limit: CLEANUP_BATCH };

    this._fileApi.cleanUpOriginals(body).subscribe({
      next: (progress) => {
        this.progress.set(progress);

        if (progress.finished) {
          this.running.set(false);
          this.notificationService.success(`${progress.trashed.toLocaleString()} moved to the trash.`);
          return;
        }

        if (!this.running()) {
          return;
        }

        this._step(false);
      },
      error: (error) => {
        this.running.set(false);
        this.notificationService.error(error?.error?.error ?? 'The cleanup stopped.');
      },
    });
  }
}
