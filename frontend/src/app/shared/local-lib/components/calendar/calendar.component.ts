import { Component, computed, inject, model } from '@angular/core';
import { DateFieldComponent, DateFieldFormat } from '@anotoki/lib/ui/date-field';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DateFormatService } from '../../i18n/date-format.service';
import { BIRTHDAY_YEAR, fieldDateToStored, fieldDayMonthToStored, storedToFieldDate, storedToFieldDayMonth } from '../../stored-dates';

type Type = string;

/**
 * The order a date pattern of DateFormatService writes in, as one of the
 * field's: the account's four come back as themselves ('d.M.yyyy' is
 * dmy_dot), a device's own by which number comes first and what stands
 * between them ('dd/MM/yyyy' in Britain is dmy_slash, 'dd. MM. yyyy' in
 * Slovakia dmy_dot). The field reads any separator typed; this is how it
 * writes the date.
 */
export function fieldFormatOf(pattern: string): DateFieldFormat {
  const first = pattern.trimStart().charAt(0);
  if (first === 'y') {
    return 'ymd_dash';
  }
  if (first === 'M') {
    return 'mdy_slash';
  }
  return pattern.includes('.') ? 'dmy_dot' : 'dmy_slash';
}

/**
 * A date in the site's forms - a release date, a banner's days, a character's
 * birthday: the kit's date field (@anotoki/lib/ui/date-field: typed in the
 * reader's date order or chosen in its calendar, a modal grid the keyboard
 * walks, every day named whole), holding this form's value as the API keeps
 * it and saying its rules' errors (AbstractInputComponent).
 *
 * The date order is the one the site writes every date in for this reader
 * (DateFormatService): the signed-in account's `date_format` (the anotoki
 * account's choice, every site's), else this device's own - so a date is
 * typed as the lists beside the form show it. The value is mapped at the boundary
 * (stored-dates.ts): a stored date or timestamp shows its day; a birthday -
 * kept as a DATE in year 4 (`hideYear`), '0004-02-29' - is the field's day and
 * month without a year, '--02-29', and is written back in year 4, so neither
 * the API nor anything that reads a birthday changes.
 */
@Component({
  selector: 'app-calendar',
  imports: [DateFieldComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: CalendarComponent,
    },
  ],
})
export class CalendarComponent extends AbstractInputComponent<Type> {
  /** Day and month only, for dates where the year means nothing - a character's birthday, kept in `yearlessYear`. */
  hideYear = model<boolean>(false);
  yearlessYear = model<number>(BIRTHDAY_YEAR);

  private readonly _dates = inject(DateFormatService);

  /** The date order in force: the account's, else the device's (DateFormatService.pattern()). */
  readonly format = computed<DateFieldFormat>(() => fieldFormatOf(this._dates.pattern().date));

  /** The value as the field reads it. */
  readonly fieldValue = computed(() => (this.hideYear() ? storedToFieldDayMonth(this.value()) : storedToFieldDate(this.value())));

  /** What the field holds now, as the API keeps it: null while it holds no date (sent as null, so a cleared date clears). */
  onKitValue(field: string): void {
    const stored = this.hideYear() ? fieldDayMonthToStored(field, this.yearlessYear()) : fieldDateToStored(field);
    this.value.set(stored);
    this.inputChange.emit(this.value());
  }
}
