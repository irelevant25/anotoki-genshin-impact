import { Component, computed, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { FileComponent, FileItemType } from '../../../../shared/local-lib/components/file/file.component';
import { IMAGE_EXTENSIONS } from '../admin-full-resource.model';

/** What the modal hands back: nothing has been sent to the server yet. */
export interface PickedImage {
  file: File;
  name: string;
  /** Object URL for the form to show until the next load. */
  preview: string;
}

/**
 * Picks one image and the name to store it under.
 *
 * Nothing is uploaded here - the form keeps the file and sends it when it is
 * saved, so creating an entity stays a single step and child rows (which are
 * re-inserted on every save) can have images too.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  imports: [ModalComponent, ButtonComponent, TextComponent, FileComponent],
})
export class ImageUploadComponent extends AbstractModalComponent {
  /** Set by the opener before the modal renders. */
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
    const preview = this.preview();
    if (!file || !preview || !this.canSubmit()) {
      return;
    }
    // Hand the object URL over; the form owns revoking it from here.
    this.preview.set(undefined);
    this.modalRef?.close({ file, name: this.trimmedName(), preview } satisfies PickedImage);
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
