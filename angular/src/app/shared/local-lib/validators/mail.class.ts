import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AbstractInputComponent } from '../abstract-input.class';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function mailValidator(inputComponent: AbstractInputComponent): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!inputComponent) {
      return null;
    }

    const value = inputComponent.value()?.toString() || '';

    if (!value) {
      return null;
    }

    if (!EMAIL_REGEX.test(value)) {
      inputComponent.setErrorMessage({ email: true });
      return { email: true };
    }

    inputComponent.setErrorMessage(null);

    return null;
  };
}
