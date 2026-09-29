import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { ConfigService } from '../../../shared/local-lib/services/config.service';
import { AssetFile, ExplorerApiService, ExplorerFile, ExplorerFolder, ExplorerListing, ExplorerStatus } from '../../../api';
import { FilePreviewComponent, isPreviewableFile, PLAYABLE_AUDIO, PREVIEWABLE_IMAGES } from '../files/file-preview/file-preview.component';

type ExplorerView = 'icons' | 'list';
type ExplorerMode = 'browse' | 'new';

/**
 * The asset folder browsed like a file manager - the disk itself, not the
 * catalogue the Files page keeps. Everything is drawn off one cached snapshot
 * (see backend/api/explorer.php), so paging through fifty thousand files never walks
 * the disk; only the re-scan button does, and that same walk is what refreshes
 * the Files page's on-disk figures too.
 */
@Component({
  selector: 'app-files-explorer',
  templateUrl: './files-explorer.component.html',
  styleUrls: ['./files-explorer.component.scss'],
  imports: [ButtonComponent, LoaderComponent, TextComponent],
})
export class FilesExplorerComponent extends AbstractModalComponent implements OnInit {
  /** Where we are: the folder path, whether we are listing new files, the view. */
  path = signal('');
  mode = signal<ExplorerMode>('browse');
  view = signal<ExplorerView>('icons');
  search = signal<string | number | null | undefined>('');

  folders = signal<ExplorerFolder[]>([]);
  files = signal<ExplorerFile[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(120);
  status = signal<ExplorerStatus | undefined>(undefined);

  loadingList = signal(false);
  rescanning = signal(false);

  private readonly _api = inject(ExplorerApiService);
  private readonly _config = inject(ConfigService);
  private readonly _notify = inject(NotificationService);

  /** Home / folder / sub-folder, each one a place to jump back to. */
  crumbs = computed(() => {
    const path = this.path();
    if (!path) {
      return [] as { name: string; path: string }[];
    }
    const parts = path.split('/');
    return parts.map((name, index) => ({ name, path: parts.slice(0, index + 1).join('/') }));
  });

  searching = computed(() => String(this.search() ?? '').trim() !== '');

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  rangeLabel = computed(() => {
    if (!this.total()) {
      return '0 files';
    }
    const from = (this.page() - 1) * this.pageSize() + 1;
    return `${from}–${Math.min(this.page() * this.pageSize(), this.total())} of ${this.total()}`;
  });

  newCount = computed(() => this.status()?.new_count ?? 0);
  scannedAt = computed(() => this.status()?.scanned_at ?? null);

  ngOnInit(): void {
    this.load();
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  load(): void {
    this.loadingList.set(true);
    const term = String(this.search() ?? '');
    const request =
      this.mode() === 'new'
        ? this._api.getExplorerNewFiles({ search: term, page: this.page() })
        : this._api.getExplorerListing({ path: this.path(), search: term, page: this.page() });

    request.subscribe({
      next: (data: ExplorerListing) => {
        this.folders.set(data.folders ?? []);
        this.files.set(data.files ?? []);
        this.total.set(data.total ?? 0);
        this.page.set(data.page ?? 1);
        this.pageSize.set(data.pageSize ?? 120);
        this.status.set(data.status);
        this.loadingList.set(false);
      },
      error: () => {
        this.loadingList.set(false);
        this._notify.showError('Could not read the file list.');
      },
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  openFolder(folder: ExplorerFolder): void {
    this.path.set(folder.path);
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  goToCrumb(path: string): void {
    this.path.set(path);
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  goToRoot(): void {
    this.goToCrumb('');
  }

  onSearchChange(value: string | number | null | undefined): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  setView(view: ExplorerView): void {
    this.view.set(view);
  }

  // ── New files since the last scan ─────────────────────────────────────────────

  showNew(): void {
    if (!this.newCount()) {
      return;
    }
    this.mode.set('new');
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  backToBrowse(): void {
    this.mode.set('browse');
    this.path.set('');
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  // ── Re-scan ───────────────────────────────────────────────────────────────────

  rescan(): void {
    this.rescanning.set(true);
    this._api.rescanExplorer({}).subscribe({
      next: (status) => {
        this.rescanning.set(false);
        this.status.set(status);
        this._notify.showSuccess(
          status.new_count
            ? `${status.new_count} new file${status.new_count === 1 ? '' : 's'} since the last scan.`
            : 'Nothing new since the last scan.'
        );
        // Back to the top of the tree so the fresh counts and any new folders show.
        if (this.mode() === 'browse') {
          this.load();
        } else {
          this.backToBrowse();
        }
      },
      error: () => {
        this.rescanning.set(false);
        this._notify.showError('The re-scan failed.');
      },
    });
  }

  // ── Files ─────────────────────────────────────────────────────────────────────

  /** An `<img src>` never goes through the interceptor, so the backend is put
   * in front of the API path here. */
  fileUrl(file: ExplorerFile): string {
    return (this._config.backendUrl ?? '').replace(/\/$/, '') + file.url;
  }

  isImage(file: ExplorerFile): boolean {
    return PREVIEWABLE_IMAGES.includes(file.extension);
  }

  isAudio(file: ExplorerFile): boolean {
    return PLAYABLE_AUDIO.includes(file.extension);
  }

  canPreview(file: ExplorerFile): boolean {
    return isPreviewableFile(file.extension);
  }

  /** The list-view type icon: a picture, a note, or a plain page. */
  iconFor(file: ExplorerFile): string {
    if (this.isImage(file)) {
      return 'icon-image';
    }
    if (this.isAudio(file)) {
      return 'icon-music';
    }
    return 'icon-file-text';
  }

  typeLabel(file: ExplorerFile): string {
    return file.extension ? file.extension.toUpperCase() : 'File';
  }

  openPreview(file: ExplorerFile): void {
    if (!this.canPreview(file)) {
      return;
    }
    const modal = this.modalService.open<FilePreviewComponent>(FilePreviewComponent, { size: '5', scrollable: true });
    // The preview reads an AssetFile; an ExplorerFile carries every field it
    // touches, so it stands in with the two catalogue-only ones nulled.
    modal.componentInstance.file.set({ ...file, file_id: null, category: null } as AssetFile);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
  }
}
