import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { AdminApiService, EntityUploadResult } from '../../services/admin-api.service';
import { IMAGE_EXTENSIONS } from '../admin-full-resource.model';

/**
 * Uploads one image for one entity field. The user picks a file and a name; the
 * server knows the folder from the entity and field, so nothing here decides
 * where the file goes.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  imports: [ModalComponent, ButtonComponent, TextComponent, FileComponent],
})
export class ImageUploadComponent extends AbstractModalComponent {
  /** Set by the opener before the modal renders. */
  entity = signal<string>('');
  entityId = signal<number>(0);
  field = signal<string>('');
  /** Shown in the title, e.g. "Card Icon". */
  label = signal<string>('Image');
  /** The name already stored, pre-filled so a replace keeps it. */
  currentName = signal<string>('');

  name = signal<string | number | null | undefined>('');
  file = signal<File | undefined>(undefined);
  preview = signal<string | undefined>(undefined);
  error = signal<string | undefined>(undefined);

  readonly imageExtensions = IMAGE_EXTENSIONS;

  title = computed(() => `Upload ${this.label()}`);
  trimmedName = computed(() => String(this.name() ?? '').trim());
  canSubmit = computed(() => !!this.file() && this.trimmedName().length > 0);

  private readonly _api = inject(AdminApiService);

  /** Called by the opener once the inputs are set. */
  init(): void {
    this.name.set(this.currentName());
  }

  onFileSelect(items: FileItemType[] | undefined | null): void {
    const picked = items?.[0]?.file;
    this._revoke();
    this.file.set(picked);
    this.preview.set(picked ? URL.createObjectURL(picked) : undefined);
    this.error.set(undefined);

    // Offer the file's own name when there is nothing to keep.
    if (picked && !this.trimmedName()) {
      this.name.set(picked.name.replace(/\.[^.]+$/, ''));
    }
  }

  submit(): void {
    const file = this.file();
    if (!file || !this.canSubmit()) {
      return;
    }
    this.loading.set(true);
    this.error.set(undefined);

    this._api.uploadEntityFile(this.entity(), this.entityId(), this.field(), file, this.trimmedName()).subscribe({
      next: (result) => {
        this.loading.set(false);
        this._revoke();
        this.modalRef?.close(result satisfies EntityUploadResult);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.error?.error ?? `Upload failed (HTTP ${error?.status ?? '?'})`);
        this.cd.markForCheck();
      },
    });
  }

  cancel(): void {
    this._revoke();
    this.modalRef?.close(undefined);
  }

  private _revoke(): void {
    const url = this.preview();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.preview.set(undefined);
  }
}
