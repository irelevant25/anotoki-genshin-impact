import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { AssetFile, AssetFolder, FileApiService, FileCategory, FileCategoryApiService, toFormData } from '../../../../api';
import { TrashModalComponent } from '../trash-modal/trash-modal.component';
import { FilePreviewComponent, isPreviewableFile, PLAYABLE_AUDIO, PREVIEWABLE_IMAGES } from '../file-preview/file-preview.component';
import { AssetStatsComponent } from '../asset-stats/asset-stats.component';
import { ConfigService } from '../../../../shared/local-lib/services/config.service';

@Component({
  selector: 'app-files-manager',
  templateUrl: './files-manager.component.html',
  styleUrls: ['./files-manager.component.scss'],
  imports: [ButtonComponent, LoaderComponent, TextComponent, FileComponent, AssetStatsComponent],
})
export class FilesManagerComponent extends AbstractModalComponent implements OnInit {
  folders = signal<AssetFolder[]>([]);
  folderFilter = signal<string | number | null | undefined>('');
  selectedFolder = signal<string>('');

  files = signal<AssetFile[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(60);
  search = signal<string | number | null | undefined>('');

  loadingFolders = signal(false);
  loadingFiles = signal(false);
  busy = signal<string | undefined>(undefined);
  deleteConfirm = signal<string | undefined>(undefined);


  /** 900+ folders, so the sidebar is filtered rather than scrolled. */
  visibleFolders = computed(() => {
    const needle = String(this.folderFilter() ?? '')
      .trim()
      .toLowerCase();
    const list = this.folders();
    return needle ? list.filter((entry) => entry.folder.toLowerCase().includes(needle)) : list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  rangeLabel = computed(() => {
    if (!this.total()) {
      return '0 files';
    }
    const from = (this.page() - 1) * this.pageSize() + 1;
    return `${from}–${Math.min(this.page() * this.pageSize(), this.total())} of ${this.total()}`;
  });

  private readonly _fileApi = inject(FileApiService);
  private readonly _config = inject(ConfigService);
  private readonly _categoryApi = inject(FileCategoryApiService);
  private readonly _notify = inject(NotificationService);

  /** The categories a file can be moved into, for the selector on each card. */
  categories = signal<FileCategory[]>([]);

  ngOnInit(): void {
    this.loadFolders();
    this._categoryApi.getFileCategories().subscribe({
      next: (categories) => this.categories.set(categories.filter((category) => !category.deleted)),
      error: () => undefined,
    });
  }

  /**
   * Moves one file into another category, which moves it on disk.
   *
   * The listing is reloaded rather than patched: the file is not in this folder
   * any more, so leaving it on screen would be showing something that is not
   * there.
   */
  /** Which file's name is being edited, and what has been typed so far. */
  readonly renaming = signal<string | undefined>(undefined);
  readonly draftName = signal('');

  /**
   * Where to actually fetch a file's bytes from.
   *
   * The listing hands back an API path, and an `<img src>` never goes through
   * the interceptor that would put the backend in front of it - so it is put
   * there here. Reading through the API rather than the served asset path is
   * what makes a file uploaded a moment ago visible without restarting the dev
   * server, which resolves its asset glob once and never looks again.
   */
  fileUrl(file: AssetFile): string {
    const base = this._config.backendUrl ?? '';
    return base.replace(/\/$/, '') + file.url;
  }

  startRename(file: AssetFile): void {
    if (!file.file_id) {
      return;
    }
    // The extension is not part of the name: it says what the file is.
    this.renaming.set(file.name);
    this.draftName.set(file.name.replace(/\.[^.]+$/, ''));
  }

  cancelRename(): void {
    this.renaming.set(undefined);
    this.draftName.set('');
  }

  saveRename(file: AssetFile): void {
    const name = this.draftName().trim();
    if (!file.file_id || !name) {
      return;
    }

    this.busy.set(file.name);
    this._fileApi.updateFileName(file.file_id, { name }).subscribe({
      next: (result) => {
        this.busy.set(undefined);
        this.cancelRename();
        this._notify.showSuccess(`Renamed to ${result.name}.`);
        this.loadFiles();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.showError(error?.error?.error ?? 'That could not be renamed.');
      },
    });
  }

  moveTo(file: AssetFile, categoryId: string): void {
    if (!file.file_id || !categoryId) {
      return;
    }

    this.busy.set(file.name);
    this._fileApi.moveFileToCategory(file.file_id, { category_id: Number(categoryId) }).subscribe({
      next: (result) => {
        this.busy.set(undefined);
        this._notify.showSuccess(
          result.renamed
            ? `Moved to ${result.path}/ as ${result.name} — that folder already had a file of the same name.`
            : `Moved to ${result.path}/.`
        );
        this.loadFiles();
        this.loadFolders();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.showError(error?.error?.error ?? 'That could not be moved.');
        this.loadFiles();
      },
    });
  }

  loadFolders(): void {
    this.loadingFolders.set(true);
    this._fileApi.getAssetFolders().subscribe({
      next: (data) => {
        this.folders.set(data ?? []);
        this.loadingFolders.set(false);
        if (!this.selectedFolder() && data?.length) {
          this.selectFolder(data[0].folder);
        }
      },
      error: () => {
        this.loadingFolders.set(false);
        this._notify.showError('Failed to load folders');
      },
    });
  }

  selectFolder(folder: string): void {
    this.selectedFolder.set(folder);
    this.page.set(1);
    this.loadFiles();
  }

  loadFiles(): void {
    const folder = this.selectedFolder();
    if (!folder) {
      return;
    }
    this.loadingFiles.set(true);
    this._fileApi.getAssetFiles({ folder, search: String(this.search() ?? ''), page: this.page() }).subscribe({
      next: (data) => {
        this.files.set(data.files ?? []);
        this.total.set(data.total ?? 0);
        this.pageSize.set(data.pageSize ?? 60);
        this.loadingFiles.set(false);
      },
      error: () => {
        this.loadingFiles.set(false);
        this._notify.showError('Failed to load files');
      },
    });
  }

  onSearchChange(value: string | number | null | undefined): void {
    this.search.set(value);
    this.page.set(1);
    this.loadFiles();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.loadFiles();
  }

  isImage(file: AssetFile): boolean {
    return PREVIEWABLE_IMAGES.includes(file.extension);
  }

  isAudio(file: AssetFile): boolean {
    return PLAYABLE_AUDIO.includes(file.extension);
  }

  /** Images open full size, audio opens a player; anything else is not clickable. */
  canPreview(file: AssetFile): boolean {
    return isPreviewableFile(file.extension);
  }

  openPreview(file: AssetFile): void {
    if (!this.canPreview(file)) {
      return;
    }
    const modal = this.modalService.open<FilePreviewComponent>(FilePreviewComponent, { size: '5', scrollable: true });
    modal.componentInstance.file.set(file);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  /** No `name`, so each file keeps the name it was uploaded with. */
  onUpload(items: FileItemType[] | undefined | null): void {
    const files = (items ?? []).map((item) => item.file).filter((file): file is File => !!file);
    if (!files.length) {
      return;
    }
    this._runUploads(files, undefined, `${files.length} file${files.length === 1 ? '' : 's'} uploaded`);
  }

  /** Replaces one file in place, keeping its name. */
  onReplace(file: AssetFile, items: FileItemType[] | undefined | null): void {
    const replacement = items?.[0]?.file;
    if (!replacement) {
      return;
    }
    this._runUploads([replacement], file.name, `${file.name} replaced`);
  }

  private _runUploads(files: File[], name: string | undefined, success: string): void {
    const folder = this.selectedFolder();
    this.busy.set(name ?? 'upload');
    let remaining = files.length;
    let failed = 0;

    for (const file of files) {
      this._fileApi.uploadAssetFile(toFormData({ folder, file, name })).subscribe({
        next: () => this._finishUpload(--remaining, failed, success),
        error: (error) => {
          failed++;
          this._notify.showError(error?.error?.error ?? `Could not upload ${file.name}`);
          this._finishUpload(--remaining, failed, success);
        },
      });
    }
  }

  private _finishUpload(remaining: number, failed: number, success: string): void {
    if (remaining > 0) {
      return;
    }
    this.busy.set(undefined);
    if (!failed) {
      this._notify.showSuccess(success);
    }
    this.loadFiles();
  }

  confirmDelete(file: AssetFile): void {
    this.deleteConfirm.set(file.name);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(undefined);
  }

  deleteFile(file: AssetFile): void {
    this.busy.set(file.name);
    this._fileApi.deleteAssetFile({ folder: this.selectedFolder(), name: file.name }).subscribe({
      next: () => {
        this.busy.set(undefined);
        this.deleteConfirm.set(undefined);
        this._notify.showSuccess(`${file.name} moved to trash`);
        this.loadFiles();
      },
      error: (error) => {
        this.busy.set(undefined);
        this.deleteConfirm.set(undefined);
        this._notify.showError(error?.error?.error ?? 'Could not delete the file');
      },
    });
  }

  // ── Trash ───────────────────────────────────────────────────────────────────

  /**
   * The trash is a modal now rather than a second mode of this page: it used to
   * replace the browser, which read as a filter and left no way back.
   */
  openTrash(): void {
    this.openModal(TrashModalComponent, { size: '4', scrollable: true }, () => {
      this.loadFiles();
      this.loadFolders();
    });
  }


}
