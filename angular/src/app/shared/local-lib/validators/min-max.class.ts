import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NumberComponent } from '../components/number/number.component';

export function minValidator(numberComponent: NumberComponent, minValue: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!numberComponent) {
      return null;
    }

    const value = Number(numberComponent.value);

    if (!value) {
      return null;
    }

    if (value < minValue) {
      numberComponent.setErrorMessage({ min: minValue });
      return { min: true };
    }

    numberComponent.setErrorMessage(null);

    return null;
  };
}

export function maxValidator(numberComponent: NumberComponent, maxValue: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!numberComponent) {
      return null;
    }

    const value = Number(numberComponent.value);

    if (!value) {
      return null;
    }

    if (value > maxValue) {
      numberComponent.setErrorMessage({ max: maxValue });
      return { max: true };
    }

    numberComponent.setErrorMessage(null);

    return null;
  };
}

export function minMaxValidator(numberComponent: NumberComponent, minValue: number, maxValue: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!numberComponent) {
      return null;
    }

    const value = Number(numberComponent.value);

    if (!value) {
      return null;
    }

    if (value < minValue || value > maxValue) {
      const message = {
        numberRange: {
          min: minValue,
          max: maxValue,
        },
      };
      numberComponent.setErrorMessage(message);
      return message;
    }

    numberComponent.setErrorMessage(null);

    return null;
  };
}
