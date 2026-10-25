import { Component, computed, model } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonComponent, ButtonVariant } from '@anotoki/lib/ui/button';
import { AbstractInputComponent } from '../../abstract-input.class';

export interface FileItemType {
  id?: number;
  nazov?: string;
  file?: File;
}

type Type<T extends FileItemType = FileItemType> = T[];

/**
 * A button that opens the device's chooser - one file or several - and hands
 * what was chosen to the page at once: the Files page's Upload and Replace, a
 * voice-over line's sound. What the kit's file picker
 * (@anotoki/lib/ui/file-picker) does not do: a chooser with no list or drop
 * area of its own. Where a person chooses a file or a folder to look at before
 * anything happens with it (an entity's picture, the import's JSON and its
 * audio folder) the page draws the kit's picker instead. The kinds offered (`acceptedExtensions`) are a convenience: the
 * server checks every file again, by its bytes (backend api/upload_guard.php).
 */
@Component({
  selector: 'app-file',
  imports: [ButtonComponent],
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: FileComponent,
    },
  ],
})
export class FileComponent<T extends FileItemType = FileItemType> extends AbstractInputComponent<Type<T>> {
  multiple = model<boolean>(false);
  acceptedExtensions = model<string[] | undefined>(undefined);
  buttonText = model<string | undefined>(undefined);
  buttonOutline = model<boolean>(false);
  buttonVariant = model<ButtonVariant>('primary');
  /** The kit's button: an outlined one is its quiet (secondary) button. */
  readonly kitVariant = computed<ButtonVariant>(() => (this.buttonOutline() ? 'secondary' : this.buttonVariant()));
  /** The button's words: the page's, or what it chooses. */
  readonly buttonWords = computed(() => this.buttonText() ?? (this.multiple() ? 'Choose files' : 'Choose a file'));

  onButtonClick(): void {
    if (!this.disabled()) {
      this.inputElement?.nativeElement.click();
    }
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files ? Array.from(target.files) : [];
    this.value.set(files.map((file) => ({ file })) as T[]);
    // Emptied, so the same file chosen again is a change again.
    target.value = '';

    this.isTouched.set(true);
    this.touchChange.emit(this.isTouched());
    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  override validate(control: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};
    const items = this.value() ?? [];

    if (this.required() && items.length === 0) {
      errors['required'] = true;
    }

    const acceptedExtensions = this.acceptedExtensions();
    if (acceptedExtensions?.length && items.some((item) => !acceptedExtensions.includes(this.getFileExtension(item.file?.name ?? item.nazov)))) {
      errors['invalidExtension'] = acceptedExtensions;
    }

    for (const validator of this.validators()) {
      Object.assign(errors, validator(control) ?? {});
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private getFileExtension(fileName?: string): string {
    const lastDotIndex = fileName?.lastIndexOf('.') ?? -1;
    return fileName && lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
  }

  /** Forgets what was chosen (the Files page, once an upload is done). */
  clearFiles(): void {
    if (this.inputElement) {
      this.inputElement.nativeElement.value = '';
    }
    if ((this.value() ?? []).length === 0) {
      return;
    }
    this.value.set([]);
    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  get acceptAttribute(): string {
    return this.acceptedExtensions()?.join(',') ?? '';
  }
}
