import { Component, ElementRef, HostListener, ViewChild, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '../../../click-outside.directive';
import { DynamicDateTimeConverter } from '../../../datetime-helper.class';

interface CalendarDay {
  date: number;
  fullDate: Date;
  selected: boolean;
  otherMonth: boolean;
  today: boolean;
  disabled: boolean;
}

export interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

export type CalendarGranularity = 'date' | 'datetime' | 'time';

@Component({
  selector: 'app-calendar-picker',
  imports: [FormsModule, ClickOutsideDirective],
  templateUrl: './picker.component.html',
  styleUrls: ['./picker.component.scss'],
})
export class CalendarPickerComponent {
  @ViewChild('popup') popup?: ElementRef;

  // inputs
  selectedDate: Date | null = null;
  selectedTime: TimeValue | null = null;
  position = signal<{ left: number; top: number }>({ left: 0, top: 0 });
  minDate: Date | null = null;
  maxDate: Date | null = null;
  showSeconds: boolean = false;
  showActions: boolean = false;
  minuteStep: number = 1;
  secondStep: number = 1;
  minTime: TimeValue | null = null;
  maxTime: TimeValue | null = null;
  disabled: boolean = false;
  granularity: CalendarGranularity = 'date';
  /** Day and month only: no year in the header, and no year to pick. */
  hideYear: boolean = false;
  anchorElement?: ElementRef<any>;

  confirm = output();
  valueChange = output();
  timeChange = output<TimeValue>();
  dateChange = output<Date>();
  cancel = output();

  currentMonth = 0;
  currentYear = 0;

  hours = 0;
  minutes = 0;
  seconds = 0;

  selectingYear = false;
  selectableYears: number[] = [];
  selectableYearsRange = 12;
  selectingMonth = false;

  dayHeaders = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  monthNames = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];

  calendarDays: CalendarDay[] = [];

  private _scrollableParents: HTMLElement[] = [];

  ngOnInit(): void {
    this.attachScrollListeners();
  }

  ngAfterViewInit(): void {
    this.calculatePosition();
  }

  ngOnDestroy(): void {
    this._scrollableParents.forEach((parent) => {
      parent.removeEventListener('scroll', this.onParentScroll);
    });
  }

  init(): void {
    this.initializeCalendar();
    this.initializeTime();
    this.generateSelectableYears(this.currentYear);
  }

  // DATE

  initializeCalendar(): void {
    if (!this.selectedDate) {
      const today = new Date();
      // Without a year to show, open in one the whole grid can rely on - a
      // leap year, so the 29th of February is reachable.
      this.selectedDate = this.hideYear ? new Date(DynamicDateTimeConverter.DEFAULT_YEAR, today.getMonth(), today.getDate()) : today;
    }
    this.currentYear = this.selectedDate.getFullYear();
    this.currentMonth = this.selectedDate.getMonth();
    this.generateCalendarDays();
    this.emitDateChange();
  }

  generateSelectableYears(fromYear?: number): void {
    this.selectableYears = Array.from({ length: this.selectableYearsRange * 2 + 1 }, (_, i) => (fromYear ?? this.currentYear) + i - this.selectableYearsRange);
  }

  gridToggle(): void {
    if (this.hideYear) {
      // Only two views to cycle: the days and the months.
      this.selectingMonth = !this.selectingMonth;
      return;
    }
    if (this.selectingYear) {
      this.selectingYear = false;
      this.selectingMonth = true;
    } else if (this.selectingMonth) {
      this.selectingYear = false;
      this.selectingMonth = false;
    } else {
      this.selectingYear = true;
      this.selectingMonth = false;
    }
  }

  selectYear(year: number): void {
    this.currentYear = year;
    this.generateCalendarDays();
    this.gridToggle();
  }

  selectMonth(month: string): void {
    this.currentMonth = this.monthNames.indexOf(month);
    this.generateCalendarDays();
    this.gridToggle();
  }

  previous(): void {
    if (this.selectingYear) {
      this.generateSelectableYears(this.selectableYears.first());
    } else if (this.selectingMonth) {
      // NOTHING
    } else {
      this.previousMonth();
    }
  }

  next(): void {
    if (this.selectingYear) {
      this.generateSelectableYears(this.selectableYears.last());
    } else if (this.selectingMonth) {
      // NOTHING
    } else {
      this.nextMonth();
    }
  }

  previousMonth(): void {
    this.currentMonth = this.currentMonth === 0 ? 11 : (this.currentMonth - 1) % 12;
    if (this.currentMonth === 11 && !this.hideYear) {
      this.currentYear--;
    }
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentMonth = (this.currentMonth + 1) % 12;
    if (this.currentMonth === 0 && !this.hideYear) {
      this.currentYear++;
    }
    this.generateCalendarDays();
  }

  selectDate(day: CalendarDay, emitEvent: boolean = true): void {
    if (day.otherMonth || day.disabled) {
      return;
    }

    this.selectedDate = new Date(day.fullDate);
    this.calendarDays.forEach((d) => (d.selected = false));
    day.selected = true;

    if (emitEvent) {
      this.dateChange.emit(this.selectedDate);
      this.valueChange.emit();
    }
  }

  canNavigateToPrevious(): boolean {
    if (!this.minDate) {
      return true;
    }

    const previousMonth = this.selectedDate ? new Date(this.selectedDate) : new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // Check if the last day of the previous month is before minDate
    const lastDayOfPrevMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);
    return lastDayOfPrevMonth >= this.minDate;
  }

  canNavigateToNext(): boolean {
    if (!this.maxDate) {
      return true;
    }

    const nextMonth = this.selectedDate ? new Date(this.selectedDate) : new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Check if the first day of the next month is after maxDate
    const firstDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    return firstDayOfNextMonth <= this.maxDate;
  }

  private generateCalendarDays(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = (startDate.getDay() + 6) % 7; // monday = 0 (not sunday = 0)
    startDate.setDate(1 - (dayOfWeek || 7));

    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);

      const isOtherMonth = currentDay.getMonth() !== this.currentMonth;
      const isToday = this.isSameDay(currentDay, new Date());
      const selectedMonth = this.selectedDate ? this.selectedDate.getMonth() : new Date().getMonth();
      const selectedYear = this.selectedDate ? this.selectedDate.getFullYear() : new Date().getFullYear();
      const selectedDay = this.selectedDate ? this.selectedDate.getDate() : new Date().getDate();
      const isSelected = currentDay.getMonth() === selectedMonth && currentDay.getFullYear() === selectedYear && currentDay.getDate() === selectedDay;
      const isDisabled = this.isDateDisabled(currentDay);

      this.calendarDays.push({
        date: currentDay.getDate(),
        fullDate: new Date(currentDay),
        selected: isSelected,
        otherMonth: isOtherMonth,
        today: isToday,
        disabled: isDisabled,
      });
    }
  }

  private isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) {
      return true;
    }
    if (this.maxDate && date > this.maxDate) {
      return true;
    }
    return false;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  }

  // TIME

  private initializeTime(): void {
    if (this.selectedTime) {
      this.hours = this.selectedTime.hours;
      this.minutes = this.selectedTime.minutes;
      this.seconds = this.selectedTime.seconds || 0;
    } else {
      const now = new Date();
      this.hours = now.getHours();
      this.minutes = now.getMinutes();
      this.seconds = now.getSeconds();
    }
    this.emitTimeChange();
  }

  get displayHours(): string {
    return this.hours.toString().padStart(2, '0');
  }

  get displayMinutes(): string {
    return this.minutes.toString().padStart(2, '0');
  }

  get displaySeconds(): string {
    return this.seconds.toString().padStart(2, '0');
  }

  incrementHours(): void {
    const maxHours = 23;
    this.hours = this.hours >= maxHours ? 0 : this.hours + 1;
    this.emitTimeChange();
    this.valueChange.emit();
  }

  decrementHours(): void {
    const minHours = 0;
    const maxHours = 23;
    this.hours = this.hours <= minHours ? maxHours : this.hours - 1;
    this.emitTimeChange();
    this.valueChange.emit();
  }

  incrementMinutes(): void {
    this.minutes = this.minutes >= 59 ? 0 : this.minutes + this.minuteStep;
    if (this.minutes > 59) {
      this.minutes = 59;
    }
    this.emitTimeChange();
    this.valueChange.emit();
  }

  decrementMinutes(): void {
    this.minutes = this.minutes <= 0 ? 59 : this.minutes - this.minuteStep;
    if (this.minutes < 0) {
      this.minutes = 0;
    }
    this.emitTimeChange();
    this.valueChange.emit();
  }

  incrementSeconds(): void {
    this.seconds = this.seconds >= 59 ? 0 : this.seconds + this.secondStep;
    if (this.seconds > 59) {
      this.seconds = 59;
    }
    this.emitTimeChange();
    this.valueChange.emit();
  }

  decrementSeconds(): void {
    this.seconds = this.seconds <= 0 ? 59 : this.seconds - this.secondStep;
    if (this.seconds < 0) {
      this.seconds = 0;
    }
    this.emitTimeChange();
    this.valueChange.emit();
  }

  onHoursInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      this.hours = numValue;
      this.emitTimeChange();
    }
  }

  onMinutesInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      this.minutes = numValue;
      this.emitTimeChange();
    }
  }

  onSecondsInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      this.seconds = numValue;
      this.emitTimeChange();
    }
  }

  validateHours(): void {
    const maxHours = 23;
    const minHours = 0;

    if (this.hours > maxHours) {
      this.hours = maxHours;
    }
    if (this.hours < minHours) {
      this.hours = minHours;
    }
    this.emitTimeChange();
  }

  validateMinutes(): void {
    if (this.minutes > 59) {
      this.minutes = 59;
    }
    if (this.minutes < 0) {
      this.minutes = 0;
    }
    this.emitTimeChange();
  }

  validateSeconds(): void {
    if (this.seconds > 59) {
      this.seconds = 59;
    }
    if (this.seconds < 0) {
      this.seconds = 0;
    }
    this.emitTimeChange();
  }

  private emitTimeChange(): void {
    const timeValue = this.getTimeValue();
    this.timeChange.emit(timeValue);
  }

  private emitDateChange(): void {
    this.dateChange.emit(this.selectedDate ?? new Date());
  }

  private getTimeValue(): TimeValue {
    const hours = this.hours;

    const timeValue: TimeValue = {
      hours,
      minutes: this.minutes,
    };

    if (this.showSeconds) {
      timeValue.seconds = this.seconds;
    }

    return timeValue;
  }

  onConfirm(): void {
    const selectedDay = this.calendarDays.find((d) => d.selected);
    if (!selectedDay) {
      return;
    }
    this.selectDate(selectedDay, false);
    this.emitTimeChange();
    this.valueChange.emit();
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  calculatePosition(): void {
    const inputElement: HTMLInputElement | undefined = this.anchorElement?.nativeElement.querySelector('input');
    if (!inputElement) {
      return;
    }

    const rect = inputElement.getBoundingClientRect();
    const calendarWidth = 280;
    const calendarHeight = this.popup?.nativeElement.offsetHeight ?? 320;
    const gap = 2; // Gap between input and calendar

    let left = rect.left;
    let top: number;

    // Determine if there's enough space below the input
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= calendarHeight + gap) {
      // Position below the input
      top = rect.bottom + gap;
    } else if (spaceAbove >= calendarHeight + gap) {
      // Position above the input
      top = rect.top - calendarHeight - gap;
    } else if (spaceAbove > spaceBelow) {
      // Not enough space either way, prefer the side with more room
      top = Math.max(gap, rect.top - calendarHeight - gap);
    } else {
      top = rect.bottom + gap;
    }

    // Check right edge
    if (left + calendarWidth > window.innerWidth) {
      left = Math.max(10, window.innerWidth - calendarWidth - 10);
    }

    // Ensure it doesn't go off the left edge
    if (left < 10) {
      left = 10;
    }

    this.position.set({ left, top });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowEvent(): void {
    this.calculatePosition();
  }

  // Find and attach scroll listeners to all scrollable parents
  private attachScrollListeners(): void {
    const inputElement = this.anchorElement?.nativeElement.querySelector('input');
    if (!inputElement) {
      return;
    }

    // Find all scrollable parent elements
    this._scrollableParents = this.getScrollableParents(inputElement);

    // Attach scroll listeners
    this._scrollableParents.forEach((parent) => {
      parent.addEventListener('scroll', this.onParentScroll);
    });
  }

  private onParentScroll = (): void => {
    this.calculatePosition();
  };

  private getScrollableParents(element: HTMLElement): HTMLElement[] {
    const parents: HTMLElement[] = [];
    let parent = element.parentElement;

    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      // Check if the element is scrollable
      if (
        (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
        (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth)
      ) {
        parents.push(parent);
      }

      parent = parent.parentElement;
    }

    return parents;
  }
}
