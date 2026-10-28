import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { AssetFile, FileApiService } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { toStoredAssetName } from '../../shared/asset-name';

/**
 * A file's new name, in a dialog of its own: the card's field was as narrow as
 * the card, and a banner's long name never in sight at once.
 *
 * The extension is not part of it - it says what the file is - so it stands
 * beside the field. Under the field: what the server will store, while a dot
 * in the name would become a dash (_assetUploadStem()), and a refusal, for the
 * name to be mended where it was typed.
 */
@Component({
  selector: 'app-rename-modal',
  templateUrl: './rename-modal.component.html',
  styleUrls: ['./rename-modal.component.scss'],
  imports: [TextFieldComponent, ButtonComponent, DialogFooterDirective],
})
export class RenameModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  readonly file = inject<AssetFile>(ANOTOKI_DIALOG_DATA);
  /** The name without its extension, as the catalogue keeps it. */
  readonly current = this.file.name.replace(/\.[^.]+$/, '');
  readonly extension = this.file.extension ? `.${this.file.extension}` : '';

  readonly draft = signal(this.current);
  readonly saving = signal(false);
  readonly refused = signal<string | null>(null);

  readonly typed = computed(() => this.draft().trim());
  /** What the server would store: the dots dashed, but for the name the file has (toStoredAssetName()). */
  private readonly _stored = computed(() => toStoredAssetName(this.typed(), this.current));
  /** Nothing to send: no name, or the file's own once its dots are dashes - "7.1 - X" for "7-1 - X". */
  readonly unchanged = computed(() => !this.typed() || this._stored() === this.current);
  /** Said under the field while what would be stored is not what was typed. */
  readonly stored = computed(() => {
    const stored = this._stored();
    if (stored === this.typed()) {
      return null;
    }
    const rule = "a file's name keeps only the dot before its extension, every other dot becomes a dash.";
    return stored === this.current ? `That is its name already: ${rule}` : `Stored as "${stored}": ${rule}`;
  });

  edit(value: string): void {
    this.draft.set(value);
    this.refused.set(null);
  }

  save(): void {
    if (this.unchanged() || this.saving() || !this.file.file_id) {
      return;
    }
    this.saving.set(true);
    this._fileApi.updateFileName(this.file.file_id, { name: this.typed() }).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.notificationService.success(`Renamed to ${result.name}.`);
        this.closeModal(true);
      },
      error: (error) => {
        this.saving.set(false);
        this.refused.set(error?.error?.error ?? 'That could not be renamed.');
      },
    });
  }
}
