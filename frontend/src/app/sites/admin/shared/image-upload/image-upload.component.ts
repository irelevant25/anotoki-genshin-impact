import { Component, computed, inject, signal } from '@angular/core';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { PaginationComponent } from '@anotoki/lib/ui/pagination';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../shared/local-lib/services/options-helper.service';
import { FilePickerComponent } from '@anotoki/lib/ui/file-picker';
import { AssetFile, FileApiService } from '../../../../api';
import { ConfigService } from '../../../../shared/local-lib/services/config.service';
import { AUDIO_EXTENSIONS, IMAGE_EXTENSIONS, UPLOAD_MAX_BYTES } from '../admin-full-resource.model';
import { Subject, debounceTime, takeUntil } from 'rxjs';

/**
 * What the modal hands back: an image chosen for a form slot, not yet persisted.
 *
 * One of two things, never both:
 *   - `file`     a new file to upload when the form is saved, and
 *   - `existing` a file already in the catalogue, to link by id.
 *
 * `existing` is why the same icon can sit on many entities: picking it stores
 * nothing new, it just points the entity's file_id at a row that already
 * exists. `preview` is what the form shows until it reloads — an object URL for
 * an upload, the asset URL for an existing file.
 */
export interface PickedImage {
  file?: File;
  preview: string;
  existing?: { fileId: number; path: string; name: string };
}

/** True for an existing-catalogue pick, false for a fresh upload. */
export function isExistingPick(picked: PickedImage): boolean {
  return !!picked.existing;
}

const BROWSE_PAGE_SIZE = 60;

/** What an image slot hands over when it opens the picker. */
export interface ImageUploadData {
  label: string;
  name: string;
  kind: 'image' | 'audio';
  folderHint: string;
}

/**
 * Picks one image for a form slot — by uploading a new file, or by choosing one
 * already in the catalogue. A slot that holds a sound (a character's demo
 * music) sets `kind` to 'audio', and the same two ways pick a sound instead.
 *
 * Upload names are not asked for: they are derived from the entity that owns the
 * picture and shown read-only, so the asset tree keeps its naming. Nothing is
 * uploaded here — the form keeps the pick and resolves it on save, so creating
 * an entity stays a single step and child rows get their images too.
 *
 * Choosing an existing file is how one icon comes to sit on several entities:
 * it links the file by id rather than making a copy.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  imports: [SegmentedComponent, PaginationComponent, SpinnerComponent, DialogFooterDirective, ButtonComponent, TextComponent, DropdownComponent, FilePickerComponent],
})
export class ImageUploadComponent extends AbstractModalComponent {
  /** What the slot hands over (ImageUploadData). */
  private readonly _data = inject<ImageUploadData | null>(ANOTOKI_DIALOG_DATA, { optional: true });

  /** Shown in the title, e.g. "Card Icon". */
  label = signal<string>(this._data?.label ?? 'Image');
  /** The name a fresh upload will be stored under, derived by the form. */
  name = signal<string>(this._data?.name ?? '');
  /** The folder to open the "choose existing" browser on, if the form knows one. */
  folderHint = signal<string>(this._data?.folderHint ?? '');
  /** What the slot takes: a picture, or a sound. */
  kind = signal<'image' | 'audio'>(this._data?.kind ?? 'image');

  /** Which half of the dialog is showing. */
  mode = signal<'upload' | 'existing'>('upload');
  readonly modes = [
    { value: 'upload', label: 'Upload a file' },
    { value: 'existing', label: 'Choose from files' }];

  // ── Upload ──────────────────────────────────────────────────────────────────
  file = signal<File | undefined>(undefined);
  uploadPreview = signal<string | undefined>(undefined);
  extensions = computed(() => (this.kind() === 'audio' ? AUDIO_EXTENSIONS : IMAGE_EXTENSIONS));
  /**
   * The kit's file picker's checks (@anotoki/lib/ui/file-picker): the kinds the slot takes, by their extensions, and
   * the server's size limit - a convenience; the server checks both again, the kind by the file's bytes
   * (backend api/upload_guard.php).
   */
  readonly accept = computed(() => this.extensions().join(','));
  readonly maxBytes = UPLOAD_MAX_BYTES;
  /** What the picker lists: the file chosen, or none. */
  readonly chosen = computed<File[]>(() => {
    const file = this.file();
    return file ? [file] : [];
  });

  // ── Choose existing ───────────────────────────────────────────────────────────
  private readonly _files = inject(FileApiService);
  private readonly _config = inject(ConfigService);
  folders = signal<DropdownOption[]>([]);
  folder = signal<string | number | boolean | null | undefined>(undefined);
  search = signal<string | number | null | undefined>('');
  browsing = signal(false);
  results = signal<AssetFile[]>([]);
  total = signal(0);
  page = signal(1);
  selected = signal<AssetFile | undefined>(undefined);

  readonly pageSize = BROWSE_PAGE_SIZE;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  /** Debounces the search box so typing filters after a pause, not on blur. */
  private readonly _searchDebounce = new Subject<void>();

  title = computed(() => (this.mode() === 'upload' ? `Upload ${this.label()}` : `Choose ${this.label()}`));

  constructor() {
    super();
    // The dialog's heading says which half is showing.
    this.dialogHeading(() => this.title());
  }

  /** Upload needs a file and a name; choosing needs a catalogued file selected. */
  canSubmit = computed(() =>
    this.mode() === 'upload'
      ? !!this.file() && this.name().length > 0
      : !!this.selected() && this.selected()!.file_id !== null
  );

  ngOnInit(): void {
    // The browser is loaded lazily the first time it is shown, but the folder
    // list is cheap and having it ready makes the toggle feel instant.
    this._loadFolders();

    // Search as you type: reload half a second after the last keystroke, so it
    // does not fire a request per character and does not wait for a blur.
    this._searchDebounce.pipe(debounceTime(500), takeUntil(this.unsubscriber)).subscribe(() => this.applySearch());
  }

  onSearchInput(): void {
    this._searchDebounce.next();
  }

  show(mode: 'upload' | 'existing'): void {
    this.mode.set(mode);
    if (mode !== 'existing' || this.results().length || this.browsing()) {
      return;
    }
    if (this._hasFolder()) {
      this.load();
    } else {
      // Folders are still loading; show the loader now so the empty-state does
      // not flash, and let the folder callback start the first browse.
      this.browsing.set(true);
    }
  }

  private _hasFolder(): boolean {
    const folder = this.folder();
    return folder !== undefined && folder !== null && folder !== '';
  }

  // ── Upload half ──────────────────────────────────────────────────────────────
  /** A file chosen in the picker (or taken away from it): what will be uploaded, and its preview. */
  onFilesChosen(files: readonly File[]): void {
    const picked = files[0];
    this._revokeUpload();
    this.file.set(picked);
    this.uploadPreview.set(picked ? URL.createObjectURL(picked) : undefined);
  }

  // ── Choose-existing half ───────────────────────────────────────────────────────
  private _loadFolders(): void {
    this._files.getAssetFolders().subscribe({
      next: (folders) => {
        this.folders.set(folders.map((f) => ({ key: f.folder, value: `${f.folder} (${f.files})` })));
        // Default to the folder the form suggested, if that folder exists.
        const hint = this.folderHint();
        if (hint && folders.some((f) => f.folder === hint)) {
          this.folder.set(hint);
        } else if (folders.length) {
          this.folder.set(folders[0].folder);
        }
        // If the browser is already open (the user switched before the folders
        // arrived), start the first browse now that there is a folder to browse.
        if (this.mode() === 'existing' && this._hasFolder() && !this.results().length) {
          this.load();
        }
      },
      error: () => {
        this.browsing.set(false);
        this.notificationService.error('Could not read the asset folders');
      },
    });
  }

  load(): void {
    const folder = this.folder();
    if (folder === undefined || folder === null || folder === '') {
      return;
    }
    this.browsing.set(true);
    this.selected.set(undefined);
    this._files.getAssetFiles({ folder: String(folder), search: String(this.search() ?? '').trim() || undefined, page: this.page() }).subscribe({
      next: (result) => {
        // A form slot wants a picture (or a sound), so the folder's other files are hidden.
        this.results.set(result.files.filter((f) => this.extensions().includes(`.${f.extension.toLowerCase()}`)));
        this.total.set(result.total);
        this.browsing.set(false);
      },
      error: () => {
        this.browsing.set(false);
        this.notificationService.error('Could not read that folder');
      },
    });
  }

  onFolderChange(): void {
    this.page.set(1);
    this.load();
  }

  applySearch(): void {
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

  select(file: AssetFile): void {
    // A file the catalogue has not caught up on has no id to link to.
    if (file.file_id === null) {
      return;
    }
    this.selected.set(file);
  }

  isSelected(file: AssetFile): boolean {
    return this.selected()?.url === file.url;
  }

  /**
   * The URL a browser can actually load the file from.
   *
   * The listing hands back an API path (`/api/files/raw?…`), and an `<img src>`
   * never passes through the interceptor that puts the backend in front of it —
   * so the backend origin is prepended here, the same way the Files page does.
   */
  thumbUrl(file: AssetFile): string {
    return (this._config.backendUrl ?? '').replace(/\/$/, '') + file.url;
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    if (this.mode() === 'upload') {
      const file = this.file();
      const preview = this.uploadPreview();
      if (!file || !preview) {
        return;
      }
      // Hand the object URL over; the form owns revoking it from here.
      this.uploadPreview.set(undefined);
      this.dialogRef?.close({ file, preview } satisfies PickedImage);
      return;
    }

    const chosen = this.selected()!;
    // preview is a full URL the form can render immediately; path is the bare
    // catalogue path stored for display until the row reloads (the backend
    // ignores it once the file_id is set).
    this.dialogRef?.close({
      preview: this.thumbUrl(chosen),
      existing: { fileId: chosen.file_id!, path: chosen.url, name: chosen.name },
    } satisfies PickedImage);
  }

  cancel(): void {
    this._revokeUpload();
    this.dialogRef?.close(undefined);
  }

  private _revokeUpload(): void {
    const url = this.uploadPreview();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.uploadPreview.set(undefined);
  }
}
