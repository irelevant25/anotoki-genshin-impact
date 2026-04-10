import { Component, model } from '@angular/core';
import { FormsModule, ValidationErrors, AbstractControl } from '@angular/forms';

import { ButtonComponent, ButtonVariant } from '../button/button.component';
import { AbstractInputComponent } from '../../abstract-input.class';

export interface FileItemType {
  id?: number;
  nazov?: string;
  file?: File;
}

type Type<T extends FileItemType = FileItemType> = T[];

@Component({
  selector: 'app-file',
  imports: [FormsModule, ButtonComponent],
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
  maxFiles = model<number | undefined>(undefined);
  minFiles = model<number | undefined>(undefined);
  acceptedExtensions = model<string[] | undefined>(undefined);
  minSizeBytes = model<number | undefined>(undefined);
  maxSizeBytes = model<number | undefined>(undefined);
  buttonText = model<string>('Vybrať súbory');
  buttonOutline = model<boolean>(false);
  buttonVariant = model<ButtonVariant>('primary');
  showFileNames = model<boolean>(true);
  fileNamePosition = model<'bottom' | 'right'>('bottom');
  valueName = model<keyof T>('value' as keyof T);
  buttonClass = model<string>('');

  onButtonClick(event: Event): void {
    if (!this.disabled()) {
      this.inputElement?.nativeElement.click();
    }
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((x) => ({ file: x })) as T[];
      if (this.multiple()) {
        this.value.set([...(this.value() ?? []), ...newFiles]);
      } else {
        this.value.set([...newFiles]);
      }
    } else {
      this.value.set([]);
    }

    this.isTouched.set(true);
    this.touchChange.emit(this.isTouched());
    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  // Validator implementation
  override validate(control: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};

    // Required validation
    if (this.required() && (this.value() === undefined || this.value() === null || (this.value() ?? '').length === 0)) {
      errors['required'] = true;
    }

    if ((this.value() ?? '').length > 0) {
      // File count validation
      const maxFiles = this.maxFiles();
      if (maxFiles && (this.value() ?? '').length > maxFiles) {
        errors['maxFiles'] = { max: maxFiles, actual: (this.value() ?? '').length };
      }

      const minFiles = this.minFiles();
      if (minFiles && (this.value() ?? '').length < minFiles) {
        errors['minFiles'] = { min: minFiles, actual: this.value()?.length };
      }

      // File validation for each file
      this.value()?.forEach((item, index) => {
        // Size validation
        const maxSizeBytes = this.maxSizeBytes();
        if (maxSizeBytes && item.file && item.file.size > maxSizeBytes) {
          errors[`maxSize_${index}`] = {
            fileName: item.file.name,
            maxSize: maxSizeBytes,
            actualSize: item.file.size,
          };
        }

        const minSizeBytes = this.minSizeBytes();
        if (minSizeBytes && item.file && item.file.size < minSizeBytes) {
          errors[`minSize_${index}`] = {
            fileName: item.file?.name,
            minSize: minSizeBytes,
            actualSize: item.file?.size,
          };
        }

        // Extension validation
        const acceptedExtensions = this.acceptedExtensions();
        if (acceptedExtensions && acceptedExtensions.length > 0) {
          const fileExtension = this.getFileExtension(item.file?.name ?? item.nazov);
          if (!acceptedExtensions.includes(fileExtension)) {
            errors[`invalidExtension`] = acceptedExtensions;
          }
        }
      });
    }

    // Run custom validators
    if (this.validators && this.validators.length > 0) {
      this.validators().forEach((validator) => {
        const validationResult = validator(control);
        if (validationResult) {
          Object.assign(errors, validationResult);
        }
      });
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private getFileExtension(fileName?: string): string {
    if (!fileName) {
      return '';
    }
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  removeFile(index: number): void {
    if (this.disabled()) {
      return;
    }

    const array = this.value() ?? [];
    array.splice(index, 1);
    this.value.set([...array]);

    // Clear the hidden input
    if (this.inputElement) {
      this.inputElement.nativeElement.value = '';
    }

    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  clearFiles(): void {
    if (this.disabled()) {
      return;
    }

    this.value.set([]);
    if (this.inputElement) {
      this.inputElement.nativeElement.value = '';
    }

    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  get acceptAttribute(): string {
    const acceptedExtensions = this.acceptedExtensions();
    return acceptedExtensions ? acceptedExtensions.join(',') : '';
  }
}
