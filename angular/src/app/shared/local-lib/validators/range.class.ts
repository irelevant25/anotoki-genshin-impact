import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CalendarComponent } from '../calendar/calendar.component';
import { NumberComponent } from '../number/number.component';

export function dateRangeValidator(from?: CalendarComponent, to?: CalendarComponent): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!from || !to) {
      return null;
    }

    const fromValue = from?.value();
    const toValue = to?.value();

    if (!fromValue || !toValue) {
      return null;
    }

    const fromDate = new Date(fromValue);
    const toDate = new Date(toValue);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return null;
    }

    if (fromDate > toDate) {
      from.setErrorMessage({ dateRangeInvalid: true });
      to.setErrorMessage({ dateRangeInvalid: true });
      return { dateRangeInvalid: true };
    }

    from.setErrorMessage(null);
    to.setErrorMessage(null);

    return null;
  };
}

export function rangeValidator(from?: NumberComponent, to?: NumberComponent): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!from || !to) {
      return null;
    }

    const fromValue = Number(from.value);
    const toValue = Number(to.value);

    if (!fromValue || !toValue) {
      return null;
    }

    const fromNumber = Number(from.value);
    const toNumber = Number(to.value);

    if (fromNumber > toNumber) {
      from.setErrorMessage({ rangeInvalid: true });
      to.setErrorMessage({ rangeInvalid: true });
      return { rangeInvalid: true };
    }

    from.setErrorMessage(null);
    to.setErrorMessage(null);

    return null;
  };
}
