import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AbstractInputComponent } from '../abstract-input.class';

export function requiredValidator(inputComponent: AbstractInputComponent<any>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!inputComponent) {
      return null;
    }

    const value = inputComponent.value();

    if (value === undefined || value === null || value === '' || Number.isNaN(value) || (typeof value === 'string' && value.trim() === '')) {
      inputComponent.setErrorMessage({ required: true });
      return { required: true };
    }

    inputComponent.setErrorMessage(null);

    return null;
  };
}
