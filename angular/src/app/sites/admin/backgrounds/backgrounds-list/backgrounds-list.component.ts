import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { AdminApiService, BackgroundEntry } from '../../services/admin-api.service';
import { IMAGE_EXTENSIONS } from '../../shared/admin-full-resource.model';
import { MaterialIconDirective } from '../../shared/material-icon.directive';

/**
 * Site backgrounds: a name plus two images resolved from it —
 * `assets/backgrounds/{name}.avif` and `{name} - preview.avif`.
 */
@Component({
  selector: 'app-backgrounds-list',
  templateUrl: './backgrounds-list.component.html',
  styleUrls: ['./backgrounds-list.component.scss'],
  imports: [ButtonComponent, LoaderComponent, TextComponent, FileComponent, MaterialIconDirective],
})
export class BackgroundsListComponent implements OnInit {
  backgrounds = signal<BackgroundEntry[]>([]);
  loading = signal(false);
  busy = signal<number | undefined>(undefined);

  newName = signal<string | number | null | undefined>('');
  renaming = signal<number | undefined>(undefined);
  renameValue = signal<string | number | null | undefined>('');
  deleteConfirm = signal<number | undefined>(undefined);

  readonly imageExtensions = IMAGE_EXTENSIONS;
  /** Kept out of the template - literal braces there read as an ICU message. */
  readonly imagePattern = 'assets/backgrounds/{name}.avif';
  readonly previewPattern = '{name} - preview.avif';
  /** Cache-buster so a replaced image is not served from the browser cache. */
  reloadToken = signal(Date.now());

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

  /** `image` is the full wallpaper, `preview` the thumbnail beside it. */
  upload(entry: BackgroundEntry, field: 'image' | 'preview', items: FileItemType[] | undefined | null): void {
    const file = items?.[0]?.file;
    if (!file) {
      return;
    }
    this.busy.set(entry.id);
    this._api.uploadEntityFile('background', entry.id, field, file).subscribe({
      next: () => {
        this.busy.set(undefined);
        this.reloadToken.set(Date.now());
        this._notify.showSuccess(`${entry.name} ${field} updated`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this._notify.showError(error?.error?.error ?? `Could not upload the ${field}`);
      },
    });
  }

  previewName(entry: BackgroundEntry): string {
    return `${entry.name} - preview`;
  }
}
