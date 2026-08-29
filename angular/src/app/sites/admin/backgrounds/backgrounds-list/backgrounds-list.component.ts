import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { AdminApiService, BackgroundEntry } from '../../services/admin-api.service';
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
  imports: [ButtonComponent, LoaderComponent, TextComponent, EntityImageComponent],
})
export class BackgroundsListComponent implements OnInit {
  backgrounds = signal<BackgroundEntry[]>([]);
  loading = signal(false);
  busy = signal<number | undefined>(undefined);

  newName = signal<string | number | null | undefined>('');
  renaming = signal<number | undefined>(undefined);
  renameValue = signal<string | number | null | undefined>('');
  deleteConfirm = signal<number | undefined>(undefined);

  /** Shown until the reload lands, so a replaced picture is visible at once. */
  picked = signal<Record<string, PickedImage>>({});

  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._api.getBackgrounds().subscribe({
      next: (data) => {
        this.backgrounds.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Failed to load backgrounds');
      },
    });
  }

  add(): void {
    const name = String(this.newName() ?? '').trim();
    if (!name) {
      return;
    }
    this._api.createBackground(name).subscribe({
      next: () => {
        this.newName.set('');
        this._notify.showSuccess(`${name} added`);
        this.load();
      },
      error: (error) => this._notify.showError(error?.error?.error ?? 'Could not add the background'),
    });
  }

  startRename(entry: BackgroundEntry): void {
    this.renaming.set(entry.id);
    this.renameValue.set(entry.name);
  }

  cancelRename(): void {
    this.renaming.set(undefined);
  }

  saveRename(entry: BackgroundEntry): void {
    const name = String(this.renameValue() ?? '').trim();
    if (!name || name === entry.name) {
      this.cancelRename();
      return;
    }
    this.busy.set(entry.id);
    this._api.updateBackground(entry.id, name).subscribe({
      next: () => {
        this.busy.set(undefined);
        this.renaming.set(undefined);
        // The files are named after the background, so they need renaming too.
        this._notify.showSuccess(`Renamed to ${name}. Rename the image files to match on the Files page.`);
        this.load();
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.showError(error?.error?.error ?? 'Could not rename the background');
      },
    });
  }

  confirmDelete(entry: BackgroundEntry): void {
    this.deleteConfirm.set(entry.id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(undefined);
  }

  delete(entry: BackgroundEntry): void {
    this.busy.set(entry.id);
    this._api.deleteBackground(entry.id).subscribe({
      next: () => {
        this.busy.set(undefined);
        this.deleteConfirm.set(undefined);
        this._notify.showSuccess(`${entry.name} removed. Its image files are untouched.`);
        this.load();
      },
      error: (error) => {
        this.busy.set(undefined);
        this.deleteConfirm.set(undefined);
        this._notify.showError(error?.error?.error ?? 'Could not remove the background');
      },
    });
  }

  // ── Images ─────────────────────────────────────────────────────────────────────

  /** Both files are named after the background; the thumbnail says so. */
  imageName(entry: BackgroundEntry, field: 'image' | 'preview'): string {
    const base = toAssetLiteralName(entry.name);
    return field === 'preview' ? assetSuffix(base, 'preview') : base;
  }

  pendingFor(entry: BackgroundEntry, field: 'image' | 'preview'): PickedImage | undefined {
    return this.picked()[`${entry.id}:${field}`];
  }

  /** `image` is the full wallpaper, `preview` the thumbnail beside it. */
  onPicked(entry: BackgroundEntry, field: 'image' | 'preview', picked: PickedImage): void {
    const key = `${entry.id}:${field}`;
    revokePicked(this.picked()[key]);
    this.picked.update((current) => ({ ...current, [key]: picked }));

    this.busy.set(entry.id);
    this._api.uploadEntityFile('background', entry.id, field, picked.file, this.imageName(entry, field)).subscribe({
      next: (result) => {
        this.busy.set(undefined);
        entry[field] = result.path;
        entry[`${field}_name`] = result.name;
        this._notify.showSuccess(`${entry.name} ${field} updated`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this._clearPicked(key);
        this._notify.showError(error?.error?.error ?? `Could not upload the ${field}`);
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
