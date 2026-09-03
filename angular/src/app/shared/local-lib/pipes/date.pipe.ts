import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateFormatService, formatTime, formatWith } from '../i18n/date-format.service';

/** What is wanted, rather than how to write it - the how belongs to the reader. */
export type AppDateFormat = 'date' | 'datetime' | 'datetimeWithSeconds' | 'time';

/**
 * A date, written the way whoever is reading writes dates.
 *
 * This was SlovakDatePipe, with `d.M.yyyy` and a 24-hour clock baked in. That
 * is right in Slovakia and wrong nearly everywhere else the site can be read
 * from - and 03/01/2026 is not a slightly different rendering of 1.3.2026, it
 * is a different day to anyone who reads it wrong.
 *
 * So the order and the clock come from DateFormatService: the device's own
 * settings by default, overridden by the account's if it has an opinion.
 * Callers still say what they want - a date, a date and a time - and never how
 * it should look.
 *
 * Impure, for the same reason the translate pipe is: the argument is a
 * constant, so a pure pipe would cache the first answer and keep handing it
 * back after the reader changed the setting. Reading the pattern through a
 * signal is what marks the host for re-render.
 */
@Pipe({ name: 'appDate', pure: false })
export class AppDatePipe implements PipeTransform {
  private readonly _formats = inject(DateFormatService);

  transform(value: string | null | undefined | number | Date, format: AppDateFormat = 'date'): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      console.warn(`AppDatePipe: invalid date "${String(value)}"`);
      return String(value);
    }

    const { date: pattern, hour12 } = this._formats.pattern();

    if (format === 'time') {
      return formatTime(date, hour12, false);
    }

    if (format === 'date') {
      return formatWith(date, pattern, hour12);
    }

    const withSeconds = format === 'datetimeWithSeconds';
    return `${formatWith(date, pattern, hour12)} ${formatTime(date, hour12, withSeconds)}`;
  }
}

// EXAMPLES, for a reader whose device is set to Slovak:

// 1.3.2026
// {{ '2026-03-01T08:15:30' | appDate }}

// 1.3.2026 08:15
// {{ '2026-03-01T08:15:30' | appDate: 'datetime' }}

// 1.3.2026 08:15:30
// {{ '2026-03-01T08:15:30' | appDate: 'datetimeWithSeconds' }}

// The same three, for a reader on a machine set to US English:
// 3/1/2026 · 3/1/2026 8:15 AM · 3/1/2026 8:15:30 AM
