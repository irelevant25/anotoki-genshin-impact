import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AbstractInputComponent } from '../abstract-input.class';

// Telefonne cislo: supports formats like +421 or 0, with 9 digits
const PHONE_REGEX = /^(\+421|0)[0-9]{9}$/;

export function phoneNumberValidator(inputComponent: AbstractInputComponent): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!inputComponent) {
      return null;
    }

    const value = inputComponent.value()?.toString().replace(/\s/g, '') || '';

    if (!value) {
      return null;
    }

    if (!PHONE_REGEX.test(value)) {
      inputComponent.setErrorMessage({ phoneNumber: true });
      return { phoneNumber: true };
    }

    inputComponent.setErrorMessage(null);

    return null;
  };
}
