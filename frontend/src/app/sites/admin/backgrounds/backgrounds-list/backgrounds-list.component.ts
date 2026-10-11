import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { Observable } from 'rxjs';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { ConfirmService } from '@anotoki/lib/ui/dialog';
import { ToastService } from '@anotoki/lib/ui/toast';
import { Background, BackgroundApiService, FileApiService, toFormData } from '../../../../api';
import { EntityImageComponent } from '../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { revokePicked } from '../../shared/admin-full-resource.model';
import { assetSuffix, toAssetLiteralName } from '../../shared/asset-name';

/**
 * Site backgrounds: a name plus a wallpaper and its thumbnail, both filed
 * under that name.
 *
 * Unlike the entity forms this page has no save button, so a picked image is
 * uploaded straight away against the row it belongs to.
 */
@Component({
  selector: 'app-backgrounds-list',
  templateUrl: './backgrounds-list.component.html',
  styleUrls: ['./backgrounds-list.component.scss'],
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, ButtonComponent, TextComponent, EntityImageComponent],
})
export class BackgroundsListComponent implements OnInit {
  backgrounds = signal<Background[]>([]);
  loading = signal(false);
  busy = signal<number | undefined>(undefined);

  newName = signal<string | number | null | undefined>('');
  renaming = signal<number | undefined>(undefined);
  renameValue = signal<string | number | null | undefined>('');

  /** Shown until the reload lands, so a replaced picture is visible at once. */
  picked = signal<Record<string, PickedImage>>({});

  private readonly _backgroundApi = inject(BackgroundApiService);
  private readonly _fileApi = inject(FileApiService);
  private readonly _notify = inject(ToastService);
  private readonly _confirm = inject(ConfirmService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._backgroundApi.getBackgrounds().subscribe({
      next: (data) => {
        this.backgrounds.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.error('Failed to load backgrounds');
      },
    });
  }

  add(): void {
    const name = String(this.newName() ?? '').trim();
    if (!name) {
      return;
    }
    this._backgroundApi.createBackground({ name }).subscribe({
      next: () => {
        this.newName.set('');
        this._notify.success(`${name} added`);
        this.load();
      },
      error: (error) => this._notify.error(error?.error?.error ?? 'Could not add the background'),
    });
  }

  startRename(entry: Background): void {
    this.renaming.set(entry.id);
    this.renameValue.set(entry.name);
  }

  cancelRename(): void {
    this.renaming.set(undefined);
  }

  saveRename(entry: Background): void {
    const name = String(this.renameValue() ?? '').trim();
    if (!name || name === entry.name) {
      this.cancelRename();
      return;
    }
    this.busy.set(entry.id);
    this._backgroundApi.updateBackground(entry.id, { name }).subscribe({
      next: () => {
        this.busy.set(undefined);
        this.renaming.set(undefined);
        // The files are named after the background, so they need renaming too.
        this._notify.success(`Renamed to ${name}. Rename the image files to match on the Files page.`);
        this.load();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.error(error?.error?.error ?? 'Could not rename the background');
      },
    });
  }

  /** Asks first (the kit's question, its focus on No), then removes it. */
  async confirmDelete(entry: Background): Promise<void> {
    if (await this._confirm.ask({ title: `Remove ${entry.name}?`, message: 'Its image files are left where they are.', confirmLabel: 'Remove', tone: 'danger' })) {
      this.delete(entry);
    }
  }

  delete(entry: Background): void {
    this.busy.set(entry.id);
    this._backgroundApi.deleteBackground(entry.id).subscribe({
      next: () => {
        this.busy.set(undefined);
        this._notify.success(`${entry.name} removed. Its image files are untouched.`);
        this.load();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.error(error?.error?.error ?? 'Could not remove the background');
      },
    });
  }

  // ── Images ─────────────────────────────────────────────────────────────────────

  /** Both files are named after the background; the thumbnail says so. */
  imageName(entry: Background, field: 'image' | 'preview'): string {
    const base = toAssetLiteralName(entry.name);
    return field === 'preview' ? assetSuffix(base, 'preview') : base;
  }

  pendingFor(entry: Background, field: 'image' | 'preview'): PickedImage | undefined {
    return this.picked()[`${entry.id}:${field}`];
  }

  /** `image` is the full wallpaper, `preview` the thumbnail beside it. */
  onPicked(entry: Background, field: 'image' | 'preview', picked: PickedImage): void {
    const key = `${entry.id}:${field}`;
    revokePicked(this.picked()[key]);
    this.picked.update((current) => ({ ...current, [key]: picked }));

    this.busy.set(entry.id);

    // A background saves as soon as a picture is chosen. An existing-catalogue
    // pick is linked by id through a plain update; only a fresh file is uploaded.
    const existing = picked.existing;
    const request$: Observable<unknown> = existing
      ? this._backgroundApi.updateBackground(entry.id, { [`${field}_file_id`]: existing.fileId })
      : this._fileApi.uploadRecordFile('background', entry.id, field, toFormData({ file: picked.file!, name: this.imageName(entry, field) }));

    request$.subscribe({
      next: (result) => {
        this.busy.set(undefined);
        // An upload answers with {path, name}; an update answers with the row.
        entry[field] = existing ? existing.path : (result as { path: string }).path;
        entry[`${field}_name`] = existing ? existing.name : (result as { name: string }).name;
        this._notify.success(`${entry.name} ${field} updated`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this._clearPicked(key);
        this._notify.error(error?.error?.error ?? `Could not set the ${field}`);
      },
    });
  }

  private _clearPicked(key: string): void {
    revokePicked(this.picked()[key]);
    this.picked.update((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
}
