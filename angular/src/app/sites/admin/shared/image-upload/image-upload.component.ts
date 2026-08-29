import { Component, computed, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { IMAGE_EXTENSIONS } from '../admin-full-resource.model';

/** What the modal hands back: nothing has been sent to the server yet. */
export interface PickedImage {
  file: File;
  /** Object URL for the form to show until the next load. */
  preview: string;
}

/**
 * Picks one image.
 *
 * The name is not asked for - it is derived from the entity that owns the
 * picture and shown here read-only, so the asset tree keeps its naming and a
 * rename before saving still lands the file correctly.
 *
 * Nothing is uploaded here either: the form keeps the file and sends it when it
 * is saved, so creating an entity stays a single step and child rows (which are
 * re-inserted on every save) can have images too.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  imports: [ModalComponent, ButtonComponent, FileComponent],
})
export class ImageUploadComponent extends AbstractModalComponent {
  /** Shown in the title, e.g. "Card Icon". */
  label = signal<string>('Image');
  /** The name the file will be stored under, derived by the form. */
  name = signal<string>('');

  file = signal<File | undefined>(undefined);
  preview = signal<string | undefined>(undefined);

  readonly imageExtensions = IMAGE_EXTENSIONS;

  title = computed(() => `Upload ${this.label()}`);
  /** Without a name there is nowhere to put the file - the entity needs one first. */
  canSubmit = computed(() => !!this.file() && this.name().length > 0);

  onFileSelect(items: FileItemType[] | undefined | null): void {
    const picked = items?.[0]?.file;
    this._revoke();
    this.file.set(picked);
    this.preview.set(picked ? URL.createObjectURL(picked) : undefined);
  }

  submit(): void {
    const file = this.file();
    const preview = this.preview();
    if (!file || !preview || !this.canSubmit()) {
      return;
    }
    // Hand the object URL over; the form owns revoking it from here.
    this.preview.set(undefined);
    this.modalRef?.close({ file, preview } satisfies PickedImage);
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
