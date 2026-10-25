import { Injectable } from '@angular/core';
import { AnotokiDates, type AgoPipeOptions, type DatePipeOptions, type DatePipeStyle, type DateValue } from '@anotoki/lib/ui/dates';

/** A moment without a zone, as this site's API writes its TIMESTAMP columns: '2026-10-25 14:05:00.474197'. */
const ZONELESS = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;

/**
 * A moment without a zone as the time it names on this device's clock - how the site has always read one - or the
 * value as it came.
 */
function onThisClock(value: DateValue): DateValue {
  const moment = typeof value === 'string' ? ZONELESS.exec(value.trim()) : null;
  if (!moment) {
    return value;
  }
  const [year, month, day, hour, minute] = [1, 2, 3, 4, 5].map((index) => Number(moment[index]));
  const date = new Date(2000, 0, 1);
  // setFullYear(): the constructor would take a year under 100 for one of the 1900s.
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, Number(moment[6] ?? 0), Number((moment[7] ?? '0').padEnd(3, '0').slice(0, 3)));
  return Number.isNaN(date.getTime()) ? value : date;
}

/**
 * The anotoki family's dates (@anotoki/lib/ui/dates, anotoki-lib 0.11.0) - the account's date order and clock, else
 * the page language's way - with one difference this site keeps: its API writes the TIMESTAMP columns as the database
 * keeps them, its own wall time without a zone ('2026-10-25 14:05:00'), which the family reads as UTC. Here such a
 * moment is the time it names where the reader is, as this site's own date pipe always read it, so no time on its
 * pages moves by the reader's distance from Greenwich. Everything with a zone - the library's tables, `/api/me` - and
 * a day alone ('2026-10-25') go to the family's code as they came.
 *
 * Provided in AnotokiDates' place at the app's root (app.config.ts), so the `anotokiDate` and `anotokiAgo` pipes, the
 * library's own pages and this site's code all read a moment the same way.
 */
@Injectable()
export class SiteDates extends AnotokiDates {
  override format(value: DateValue, style?: DatePipeStyle, options?: DatePipeOptions): string {
    return super.format(onThisClock(value), style, options);
  }

  override relative(value: DateValue, options?: AgoPipeOptions): string {
    return super.relative(onThisClock(value), options);
  }
}
