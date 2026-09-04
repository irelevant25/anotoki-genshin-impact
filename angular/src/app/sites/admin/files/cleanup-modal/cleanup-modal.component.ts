import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AssetCleanupFile, AssetCleanupProgress, FileApiService } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
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
  imports: [ModalComponent, ButtonComponent, LoaderComponent, DecimalPipe, FileSizePipe],
})
export class CleanupModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  /** Set by the page that opens this: `image` or `audio`. */
  readonly kind = signal<'image' | 'audio'>('image');

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

  /** Called by the page once it has said which kind this is. */
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
        this.notificationService.showError('Could not read the list.');
      },
    });
  }

  isKept(file: AssetCleanupFile): boolean {
    return this.kept().has(file.path);
  }

  toggle(file: AssetCleanupFile): void {
    this.kept.update((kept) => {
      const next = new Set(kept);
      next.has(file.path) ? next.delete(file.path) : next.add(file.path);
      return next;
    });
  }

  /** Takes this page off the list, or puts it back. Paging keeps the rest. */
  togglePage(keep: boolean): void {
    this.kept.update((kept) => {
      const next = new Set(kept);
      for (const file of this.files()) {
        keep ? next.add(file.path) : next.delete(file.path);
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
          this.notificationService.showSuccess(`${progress.trashed.toLocaleString()} moved to the trash.`);
          return;
        }

        if (!this.running()) {
          return;
        }

        this._step(false);
      },
      error: (error) => {
        this.running.set(false);
        this.notificationService.showError(error?.error?.error ?? 'The cleanup stopped.');
      },
    });
  }
}
