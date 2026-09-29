import { Component, model, ViewContainerRef, Injector, ComponentRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarGranularity, CalendarPickerComponent, TimeValue } from './picker/picker.component';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DynamicDateTimeConverter } from '../../datetime-helper.class';

type Type = string;

@Component({
  selector: 'app-calendar',
  imports: [FormsModule],
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
  minDate = model<Date | null>(null);
  maxDate = model<Date | null>(null);
  showSeconds = model<boolean>(false);
  showActions = model<boolean | undefined>(undefined);
  minuteStep = model<number>(1);
  secondStep = model<number>(1);
  minTime = model<TimeValue | null>(null);
  maxTime = model<TimeValue | null>(null);
  granularity = model<CalendarGranularity>('date');

  /**
   * Day and month only, for dates where the year means nothing - a character's
   * birthday. The column stays a DATE, so the value still carries a year:
   * `yearlessYear`, which is what the stored birthdays already use.
   */
  hideYear = model<boolean>(false);
  yearlessYear = model<number>(4);
  defaultPlaceHolder = computed(() => {
    if (this.granularity() === 'date') {
      return this.displayValueDateFormat;
    } else if (this.granularity() === 'datetime') {
      return this.showSeconds() ? `${this.displayValueDateFormat} HH:mm:ss` : `${this.displayValueDateFormat} HH:mm`;
    }
    return this.showSeconds() ? 'HH:mm:ss' : 'HH:mm';
  });

  selectedDate: Date | null = null;
  selectedTime: TimeValue | null = null;
  showCalendar = false;
  valueDateFormat: string = 'yyyy-MM-dd';

  /** `02.04.` while the year is hidden, `02.04.2024` otherwise. */
  get displayValueDateFormat(): string {
    return this.hideYear() ? 'dd.MM.' : 'dd.MM.yyyy';
  }
  displayValue: string | null = null;

  private _calendarRef: ComponentRef<CalendarPickerComponent> | null = null;

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private _injector: Injector,
  ) {
    super();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.closeCalendar();
  }

  override onBlur(event?: Event): void {
    if (!this.showCalendar) {
      super.onBlur(event);
    }
    if (this.isValueValid(this.displayValue, this.displayValueFormat)) {
      const dateValue = this.getFormatValueDate(this.displayValue, this.displayValueFormat, this.valueFormat);
      const dateDisplayValue = this.getFormatValueDate(this.displayValue, this.displayValueFormat, this.displayValueFormat);
      const timeValue = this.getFormatValueTime(this.displayValue, true);
      const granularity = this.granularity();
      if (granularity === 'date') {
        this.value.set(this._withStoredYear(dateValue));
        this.displayValue = dateDisplayValue;
      } else if (granularity === 'datetime') {
        this.value.set(`${dateValue}T${timeValue}`);
        this.displayValue = `${dateDisplayValue} ${timeValue}`;
      } else if (granularity === 'time') {
        this.value.set(timeValue);
        this.displayValue = timeValue;
      }
    } else {
      this.value.set(undefined);
      this.displayValue = null;
    }
  }

  override afterValueChange(value?: string): void {
    this.updateDisplayValue(value);
  }

  updateDisplayValue(value?: string | null): void {
    if (!value) {
      this.displayValue = '';
      return;
    }
    if (this.granularity() === 'time') {
      this.displayValue = value;
      return;
    }
    this.displayValue = DynamicDateTimeConverter.formatDateTime(new Date(value), this.displayValueFormat);
  }

  toggleCalendar(event: Event): void {
    // event.stopPropagation();
    if (this.showCalendar) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  private closeCalendar(): void {
    if (!this.showCalendar) {
      return;
    }
    this._calendarRef?.destroy();
    this._calendarRef = null;
    this.showCalendar = false;
    this.markAsTouched();
  }

  get valueFormat(): string {
    const granularity = this.granularity();
    if (granularity === 'date') {
      return this.valueDateFormat;
    } else if (granularity === 'datetime') {
      if (this.showSeconds()) {
        return `${this.valueDateFormat}THH:mm:ss`;
      }
      return `${this.valueDateFormat}THH:mm`;
    }
    return '';
  }

  get displayValueFormat(): string {
    const granularity = this.granularity();
    if (granularity === 'date') {
      return this.displayValueDateFormat;
    } else if (granularity === 'datetime') {
      if (this.showSeconds()) {
        return `${this.displayValueDateFormat} HH:mm:ss`;
      }
      return `${this.displayValueDateFormat} HH:mm`;
    }
    return '';
  }

  checkValue(): void {
    const isDisplayValueValid = this.isValueValid(this.displayValue, this.displayValueFormat);
    if (isDisplayValueValid) {
      this.selectedDate = new Date(this.getFormatValueDate(this.displayValue, this.displayValueFormat, this.valueFormat));
      this.selectedDate.setHours(0, 0, 0, 0);
      const granularity = this.granularity();
      if (granularity === 'datetime' || granularity === 'time') {
        const splittedValue = this.getFormatValueTime(this.displayValue)?.split(':');
        this.selectedTime = { hours: Number(splittedValue[0] ?? 0), minutes: Number(splittedValue[1] ?? 0), seconds: Number(splittedValue[2] ?? 0) };
      }
      this.updateCalendar();
    }
  }

  updateCalendar(): void {
    if (this._calendarRef) {
      let showActions = this.showActions();
      const granularity = this.granularity();
      if (showActions === undefined || showActions === null) {
        showActions = granularity !== 'date';
      }

      this._calendarRef.instance.anchorElement = this.elementRef;
      this._calendarRef.instance.selectedDate = this.selectedDate;
      this._calendarRef.instance.selectedTime = this.selectedTime;
      this._calendarRef.instance.minDate = this.minDate();
      this._calendarRef.instance.maxDate = this.maxDate();

      this._calendarRef.instance.showSeconds = this.showSeconds();
      this._calendarRef.instance.showActions = showActions;
      this._calendarRef.instance.minuteStep = this.minuteStep();
      this._calendarRef.instance.secondStep = this.secondStep();
      this._calendarRef.instance.minTime = this.minTime();
      this._calendarRef.instance.maxTime = this.maxTime();
      this._calendarRef.instance.disabled = this.disabled();
      this._calendarRef.instance.granularity = granularity;
      this._calendarRef.instance.hideYear = this.hideYear();

      this._calendarRef.instance.init();
    }
  }

  private openCalendar(): void {
    if (this._calendarRef) {
      return; // Already open
    }

    // Create the calendar component
    this._calendarRef = this._viewContainerRef.createComponent(CalendarPickerComponent, {
      injector: this._injector,
    });

    // Open on the date already in the field rather than on today.
    this.checkValue();
    this.updateCalendar();

    // Subscribe to events
    this._calendarRef.instance.dateChange.subscribe((date: Date) => {
      this.selectedDate = date;
    });

    this._calendarRef.instance.timeChange.subscribe((time: TimeValue) => {
      this.selectedTime = time;
    });

    this._calendarRef.instance.valueChange.subscribe(() => {
      const granularity = this.granularity();
      const showSeconds = this.showSeconds();
      if (granularity === 'date') {
        const date = DynamicDateTimeConverter.formatDateTime(this.selectedDate ?? new Date(), this.valueFormat);
        this.value.set(this._withStoredYear(date));
        this.updateDisplayValue(this.value());
      } else if (granularity === 'datetime') {
        const selectedDatetime = new Date(this.selectedDate ?? new Date());
        selectedDatetime.setHours(this.selectedTime?.hours ?? 0, this.selectedTime?.minutes ?? 0, this.selectedTime?.seconds ?? 0, 0);
        this.value.set(DynamicDateTimeConverter.formatDateTime(selectedDatetime, this.valueFormat));
        this.updateDisplayValue(this.value());
      } else if (granularity === 'time') {
        const t = this.selectedTime ?? { hours: 0, minutes: 0, seconds: 0 };
        const hh = (t.hours ?? 0).toString().padStart(2, '0');
        const mm = (t.minutes ?? 0).toString().padStart(2, '0');
        const ss = (t.seconds ?? 0).toString().padStart(2, '0');
        this.value.set(showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`);
        this.updateDisplayValue(this.value());
      }
      if (granularity === 'date') {
        this.closeCalendar();
      }
      this.checkValue();
    });

    this._calendarRef.instance.confirm.subscribe(() => {
      this.closeCalendar();
    });

    this._calendarRef.instance.cancel.subscribe(() => {
      this.closeCalendar();
    });

    // Append to body
    document.body.appendChild(this._calendarRef.location.nativeElement);

    this.showCalendar = true;
  }

  /**
   * The picker works in a year it can handle; the value keeps the one the data
   * uses. Years below 100 are the reason: `new Date(4, ...)` means 1904.
   */
  private _withStoredYear(isoDate: string): string {
    if (!this.hideYear() || isoDate.length < 4) {
      return isoDate;
    }
    return String(this.yearlessYear()).padStart(4, '0') + isoDate.slice(4);
  }

  private isDateValueValid(value: string | null | undefined, format: string): boolean {
    const dateValue = value?.split(' ').first()?.split('T').first() ?? '';
    format = format.split(' ').first()?.split('T').first() ?? '';
    const date = DynamicDateTimeConverter.parseDateTime(dateValue, format);
    return !!date;
  }

  private getFormatValueDate(value: string | null | undefined, fromFormat: string, toFormat: string): string {
    if (!this.isDateValueValid(value ?? '', fromFormat)) {
      return '';
    }
    const dateValue = value?.split(' ').first()?.split('T').first() ?? '';
    fromFormat = fromFormat.split(' ').first()?.split('T').first() ?? '';
    toFormat = toFormat.split(' ').first()?.split('T').first() ?? '';
    const date = DynamicDateTimeConverter.convertDateTime(dateValue, fromFormat, toFormat);
    return date ?? '';
  }

  private isTimeValueValid(value: string, optional: boolean = false): boolean {
    if (!value.includes(' ') && !value.includes('T')) {
      return optional;
    }
    const timeValue = value?.split(' ').last()?.split('T').last() ?? '';
    const splittedValue = timeValue.split(':') ?? [];
    for (let i = 0; i < splittedValue.length; i++) {
      const number = parseInt(splittedValue[i]);
      if (Number.isNaN(number) || number < 0 || number > 59) {
        return false;
      }
    }
    const showSeconds = this.showSeconds();
    if (splittedValue.length === 2 && !showSeconds) {
      return true;
    } else if (splittedValue.length === 3 && showSeconds) {
      return true;
    }
    return false;
  }

  private getFormatValueTime(value: string | null | undefined, fillValue: boolean = false): string {
    if (!this.isTimeValueValid(value ?? '')) {
      const showSeconds = this.showSeconds();
      return fillValue ? (showSeconds ? '00:00:00' : '00:00') : '';
    }
    const timeValue = value?.split(' ').last()?.split('T').last() ?? '';
    return timeValue
      .split(':')
      .map((x) => x.padStart(2, '0'))
      .join(':');
  }

  private isValueValid(value: string | null | undefined, format?: string): boolean {
    const granularity = this.granularity();
    if (granularity === 'time') {
      return this.isTimeValueValid(value ?? '');
    } else if (granularity === 'date') {
      if (!format) {
        throw new Error('Format is required.');
      }
      return this.isDateValueValid(value ?? '', format);
    } else if (granularity === 'datetime') {
      if (!format) {
        throw new Error('Format is required.');
      }
      return this.isDateValueValid(value ?? '', format) && this.isTimeValueValid(value ?? '', true);
    }
    return false;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.isValueValid(value, this.displayValueFormat)) {
      this.checkValue();
    }
  }
}
