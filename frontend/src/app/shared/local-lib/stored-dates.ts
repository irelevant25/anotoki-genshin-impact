/**
 * Dates as the API keeps them, and as the kit's date field reads them
 * (@anotoki/lib/ui/date-field) - mapped here, at the boundary, so neither
 * side changes:
 *
 *   the API                          the field
 *   '2026-10-18' (a DATE)            '2026-10-18'
 *   '2026-10-18 10:00:00' (a TIMESTAMP, a banner's)
 *                                    '2026-10-18' - its day; a day chosen is
 *                                    written back as the day alone, as the
 *                                    site's own picker always wrote it
 *   '0004-02-29' (a birthday: a DATE in year 4, the year meaning nothing)
 *                                    '--02-29' (`dayMonth`: a day and a month)
 *   null                             ''
 *
 * Year 4 is a leap year, so the 29th of February is a birthday like any other
 * (Kirara's). Anything that is no date reads as no date (''), and the field
 * says so once it is left.
 *
 * The admin forms draw the kit's field and map its value through these: a
 * birthday `dayMonth`, its value `storedToFieldDayMonth(...)` and what the field
 * says back `fieldDayMonthToStored(...)`; any other date `storedToFieldDate(...)`
 * and `fieldDateToStored(...)` - null while the field holds no date, so a cleared
 * date is sent as null and clears. The field's `format` is the order the site
 * writes dates in for this reader (fieldFormatOf, DateFormatService), so a date
 * is typed as the lists beside the form show it.
 */

import type { DateFieldFormat } from '@anotoki/lib/ui/date-field';

/** The year the birthdays are kept in (characters.birthday, a DATE). */
export const BIRTHDAY_YEAR = 4;

/**
 * The order a date pattern of DateFormatService writes in, as one of the kit date field's: the account's four come
 * back as themselves ('d.M.yyyy' is dmy_dot), a device's own by which number comes first and what stands between
 * them ('dd/MM/yyyy' in Britain is dmy_slash, 'dd. MM. yyyy' in Slovakia dmy_dot). The field reads any separator
 * typed; this is how it writes the date.
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

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/** A stored date or timestamp as the field's 'YYYY-MM-DD' - its day - or '' for none. */
export function storedToFieldDate(stored: string | null | undefined): string {
  const match = ISO_DAY.exec(String(stored ?? '').trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

/** The field's 'YYYY-MM-DD' as the API takes it, or null for none. */
export function fieldDateToStored(field: string): string | null {
  return ISO_DAY.test(field) ? field.slice(0, 10) : null;
}

/** A stored birthday ('0004-02-29', whatever its year) as the field's '--MM-DD', or '' for none. */
export function storedToFieldDayMonth(stored: string | null | undefined): string {
  const match = ISO_DAY.exec(String(stored ?? '').trim());
  return match ? `--${match[2]}-${match[3]}` : '';
}

/** The field's '--MM-DD' as the API keeps a birthday ('0004-MM-DD'), or null for none. */
export function fieldDayMonthToStored(field: string, year: number = BIRTHDAY_YEAR): string | null {
  const match = /^--(\d{2})-(\d{2})$/.exec(field);
  return match ? `${String(year).padStart(4, '0')}-${match[1]}-${match[2]}` : null;
}
