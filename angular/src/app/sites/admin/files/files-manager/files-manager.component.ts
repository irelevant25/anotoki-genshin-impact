import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { AssetFile, AssetFolder, FileApiService, toFormData, TrashedFile } from '../../../../api';
import { FilePreviewComponent, isPreviewableFile, PLAYABLE_AUDIO, PREVIEWABLE_IMAGES } from '../file-preview/file-preview.component';
import { AssetStatsComponent } from '../asset-stats/asset-stats.component';

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

  showTrash = signal(false);
  trash = signal<TrashedFile[]>([]);

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
  private readonly _notify = inject(NotificationService);

  ngOnInit(): void {
    this.loadFolders();
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
    this.showTrash.set(false);
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

  toggleTrash(): void {
    this.showTrash.update((shown) => !shown);
    if (this.showTrash()) {
      this.loadTrash();
    }
  }

  loadTrash(): void {
    this.loadingFiles.set(true);
    this._fileApi.getTrashedFiles().subscribe({
      next: (data) => {
        this.trash.set(data ?? []);
        this.loadingFiles.set(false);
      },
      error: () => {
        this.loadingFiles.set(false);
        this._notify.showError('Failed to load the trash');
      },
    });
  }

  restore(entry: TrashedFile): void {
    this.busy.set(entry.trashed);
    this._fileApi.restoreAssetFile(toFormData({ folder: entry.folder, trashed: entry.trashed })).subscribe({
      next: () => {
        this.busy.set(undefined);
        this._notify.showSuccess(`${entry.name} restored`);
        this.loadTrash();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.showError(error?.error?.error ?? 'Could not restore the file');
      },
    });
  }
}
