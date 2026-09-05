import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AssetConversionCount, AssetConvertProgress, AssetStats, FileApiService } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { CleanupModalComponent } from '../cleanup-modal/cleanup-modal.component';
import { MissingModalComponent } from '../missing-modal/missing-modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { FileSizePipe } from '../../../../shared/local-lib/pipes/file-size.pipe';

/**
 * How many files to ask for per request.
 *
 * The server stops on a clock as well, so this is only a ceiling - it keeps a
 * batch of icons from finishing in fifty milliseconds and spending the rest of
 * the conversion on HTTP.
 */
const CONVERT_BATCH = 40;

/**
 * What is in the asset tree, and converting what is missing from it.
 *
 * The survey walks sixty-odd thousand files, so the server caches it for a day
 * and this shows how old the answer is with a button to walk it again. Nothing
 * here polls: a stale number that says it is stale is better than a page that
 * re-reads the disk every thirty seconds.
 *
 * The conversion is driven from here rather than left to the server, one batch
 * per request in a loop. That is what turns "seven thousand files" into a
 * progress bar instead of a request that dies of old age - and it means
 * stopping is instant, because stopping is simply not asking for the next one.
 */
@Component({
  selector: 'app-asset-stats',
  templateUrl: './asset-stats.component.html',
  styleUrls: ['./asset-stats.component.scss'],
  imports: [ButtonComponent, LoaderComponent, DecimalPipe, FileSizePipe],
})
export class AssetStatsComponent extends AbstractModalComponent implements OnInit, OnDestroy {
  private readonly _fileApi = inject(FileApiService);
  private readonly _notify = inject(NotificationService);

  readonly stats = signal<AssetStats | null>(null);

  readonly progress = signal<AssetConvertProgress | null>(null);
  readonly converting = signal(false);

  /** Set when the page is closed mid-run, so the loop stops asking for more. */
  private _abandoned = false;

  /** Everything the two encoders could still make, when they are both here. */
  readonly missingTotal = computed(() => {
    const stats = this.stats();
    return stats ? stats.images.missing + stats.audio.missing : 0;
  });

  /** What this box can actually do something about right now. */
  readonly convertible = computed(() => {
    const stats = this.stats();
    if (!stats) {
      return 0;
    }
    return (stats.images.can_convert ? stats.images.missing : 0) + (stats.audio.can_convert ? stats.audio.missing : 0);
  });

  /**
   * How far along, to a tenth while it is still early.
   *
   * A third of a second an image means the first minute of a two-thousand file
   * run is all under one per cent. Rounded to whole numbers that reads 0 while
   * files are plainly being converted, which looks stuck rather than slow.
   */
  readonly percent = computed(() => {
    const progress = this.progress();
    if (!progress?.total) {
      return 0;
    }
    const exact = (100 * (progress.total - progress.remaining)) / progress.total;

    return exact < 10 ? Math.round(exact * 10) / 10 : Math.round(exact);
  });

  /** The share of the tree each format takes, for the bar behind its row. */
  readonly formats = computed(() => {
    const stats = this.stats();
    if (!stats?.total_bytes) {
      return [];
    }
    const largest = stats.formats[0]?.bytes ?? 1;
    return stats.formats.map((format) => ({
      ...format,
      // Against the biggest rather than the total, or every row but one would
      // be a sliver of a bar that reads as "nothing".
      share: Math.max(1, Math.round((100 * format.bytes) / largest)),
      percent: Math.round((1000 * format.bytes) / stats.total_bytes) / 10,
    }));
  });

  /**
   * The two media, side by side.
   *
   * Built here rather than written twice in the template: they differ only in
   * which extensions feed them and which encoder is missing when one is, and
   * two near-identical blocks of markup drift apart the first time one changes.
   */
  readonly health = computed(() => {
    const stats = this.stats();
    if (!stats) {
      return [];
    }
    return [
      {
        label: 'Images → AVIF',
        from: 'png, jpg, jpeg, webp',
        target: 'AVIF',
        hint: 'Enable the imagick or gd extension and it will be picked up.',
        counts: stats.images as AssetConversionCount,
      },
      {
        label: 'Audio → Opus',
        from: 'mp3, ogg, wav, m4a',
        target: 'Opus',
        hint: 'Install ffmpeg and it will be picked up.',
        counts: stats.audio as AssetConversionCount,
      },
    ];
  });

  /** "4 hours ago", for a number that is allowed to be a day old. */
  readonly surveyedAgo = computed(() => {
    const age = this.stats()?.age;
    if (age === undefined || age === null) {
      return '';
    }
    if (age < 90) {
      return 'just now';
    }
    if (age < 5400) {
      return `${Math.round(age / 60)} minutes ago`;
    }
    const hours = Math.round(age / 3600);
    return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  });

  /**
   * Which media have originals worth offering to remove.
   *
   * Only where nothing is left to convert. The count is deliberately not shown
   * on the button: it would have to be guessed from the catalogue without the
   * "nothing points at it" check the modal applies, and a button promising
   * 5,052 that opens on 5,049 is worse than a button that promises nothing.
   */
  readonly reclaimable = computed(() => {
    const stats = this.stats();
    if (!stats) {
      return [] as { kind: 'image' | 'audio'; label: string }[];
    }

    const options: { kind: 'image' | 'audio'; label: string }[] = [];
    if (!stats.images.missing && stats.images.sources) {
      options.push({ kind: 'image', label: 'Delete original images' });
    }
    if (!stats.audio.missing && stats.audio.sources) {
      options.push({ kind: 'audio', label: 'Delete original audio' });
    }

    return options;
  });

  readonly checking = signal(false);

  /**
   * Whether the table and the disk have drifted apart.
   *
   * Only worth drawing when they have. A row saying "0 files unaccounted for"
   * on every visit is a row nobody reads, and the number is only interesting
   * the moment it is not zero.
   */
  readonly drifted = computed(() => {
    const catalogue = this.stats()?.catalogue;
    return !!catalogue && (catalogue.uncatalogued > 0 || catalogue.missing > 0);
  });

  /**
   * Looks for files that turned up without going through the API.
   *
   * Which is what FTP is: the tree changes and nothing tells the table. The
   * sweep adopts what it finds, moves anything in no category into `unfiled`,
   * and reports rows whose file has gone rather than deleting them.
   */
  check(): void {
    this.checking.set(true);

    this._fileApi.reconcileCatalogue({}).subscribe({
      next: (result) => {
        this.checking.set(false);
        this._notify.showSuccess(
          result.adopted || result.moved_to_unfiled ? `${result.adopted.toLocaleString()} adopted, ${result.moved_to_unfiled.toLocaleString()} moved to unfiled.` : 'Nothing had changed.',
        );
        this.load(true);
      },
      error: (error) => {
        this.checking.set(false);
        this._notify.showError(error?.error?.error ?? 'The check could not run.');
      },
    });
  }

  /** What the queue could not take, because nothing here can encode it. */
  blockedTotal(job: AssetConvertProgress): number {
    return job.blocked.images + job.blocked.audio;
  }

  /**
   * Offers to take the originals away.
   *
   * Its own modal rather than a confirm, because "delete forty thousand files"
   * is not a question anybody should answer without seeing which ones. The
   * button only appears once there is nothing left to convert - taking the
   * originals away while their converted copies are still being made is how
   * you lose a picture.
   */
  cleanUp(kind: 'image' | 'audio'): void {
    const modal = this.openModal(CleanupModalComponent, { size: '5', scrollable: true }, () => this.load(true));
    modal.componentInstance.kind.set(kind);
    modal.componentInstance.start();
  }

  /** The rows naming files that are not there, and the chance to forget them. */
  showMissing(): void {
    this.openModal(MissingModalComponent, { size: '5', scrollable: true }, () => this.load(true));
  }

  ngOnInit(): void {
    this.load();

    // A conversion left running by a closed tab is still on disk. Picking it up
    // is only reading it: it carries on when somebody presses the button.
    this._fileApi.getConversionProgress().subscribe({
      next: (progress) => {
        if (!progress.finished) {
          this.progress.set(progress);
        }
      },
      // A 404 is the ordinary case - nothing has been started.
      error: () => undefined,
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._abandoned = true;
  }

  load(refresh = false): void {
    this.loading.set(true);
    this._fileApi.getAssetStats(refresh ? { refresh: true } : undefined).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Could not read the asset library');
      },
    });
  }

  /** Walks the tree again rather than answering from the day-old cache. */
  refresh(): void {
    this.load(true);
  }

  // ── Converting ─────────────────────────────────────────────────────────────

  start(): void {
    this._run(true);
  }

  /** Carries on a job this page found already in flight. */
  resume(): void {
    this._run(false);
  }

  /**
   * Stops after the batch already in the air.
   *
   * The queue stays on disk, so this is a pause rather than a cancel - which is
   * what somebody who has to go and do something else actually wants.
   */
  stop(): void {
    this.converting.set(false);
  }

  dismiss(): void {
    this.progress.set(null);
  }

  private _run(restart: boolean): void {
    this.converting.set(true);

    // Drawn from this, so it has to exist before the first request rather than
    // after it. Starting a run surveys the whole tree to build the queue, and
    // until this was here that wait was spent with no bar to show for it.
    if (restart) {
      this.progress.set({
        started_at: new Date().toISOString(),
        total: this.convertible(),
        converted: 0,
        failed: 0,
        skipped: 0,
        remaining: this.convertible(),
        finished: false,
        blocked: { images: 0, audio: 0 },
        failures: [],
      });
    }

    this._step(restart);
  }

  private _step(restart: boolean): void {
    this._fileApi.convertAssets({ restart, limit: CONVERT_BATCH }).subscribe({
      next: (progress) => {
        this.progress.set(progress);

        if (progress.finished) {
          this.converting.set(false);
          this._notify.showSuccess(`Converted ${progress.converted} ${progress.converted === 1 ? 'file' : 'files'}.`);
          this.load(true);
          return;
        }

        // Stopped, or the page was left. Either way the queue keeps its place.
        if (!this.converting() || this._abandoned) {
          this.converting.set(false);
          return;
        }

        this._step(false);
      },
      error: (error) => {
        this.converting.set(false);
        this._notify.showError(error?.error?.error ?? 'The conversion stopped.');
      },
    });
  }
}
