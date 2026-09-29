import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AbstractInputComponent } from '../abstract-input.class';

export function minLengthValidator(component: AbstractInputComponent, minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!component) {
      return null;
    }

    const value = component.value?.toString().length ?? 0;

    if (!value) {
      return null;
    }

    if (value < minLength) {
      component.setErrorMessage({ minlength: minLength });
      return { minlength: minLength };
    }

    component.setErrorMessage(null);

    return null;
  };
}

export function maxLengthValidator(component: AbstractInputComponent, maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!component) {
      return null;
    }

    const value = component.value?.toString().length ?? 0;

    if (!value) {
      return null;
    }

    if (value > maxLength) {
      component.setErrorMessage({ maxlength: maxLength });
      return { maxlength: maxLength };
    }

    component.setErrorMessage(null);

    return null;
  };
}

export function minMaxLengthValidator(component: AbstractInputComponent<any>, minLength: number, maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!component) {
      return null;
    }

    const value = component.value?.toString().length ?? 0;

    if (!value) {
      return null;
    }

    if (value < minLength || value > maxLength) {
      const message = {
        lengthRange: {
          minlength: minLength,
          maxlength: maxLength,
        },
      };
      component.setErrorMessage(message);
      return message;
    }

    component.setErrorMessage(null);

    return null;
  };
}
