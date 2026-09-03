import { Injectable, computed, inject, signal } from '@angular/core';
import { SecurityService } from '../services/security.service';

/**
 * The orders a date can be written in.
 *
 * A short list rather than a format string. A free-typed pattern is a way to
 * produce a date nobody can read, and these four cover the orders actually in
 * use: `1.3.2026` across central Europe, `01/03/2026` in Britain and much of
 * the world, `03/01/2026` in the United States, and the ISO ordering for
 * anyone who wants dates that sort.
 */
export type DateFormatChoice = 'auto' | 'dmy_dot' | 'dmy_slash' | 'mdy_slash' | 'ymd_dash';

/** Twelve or twenty-four hours, or whatever the device does. */
export type TimeFormatChoice = 'auto' | '24' | '12';

interface DatePattern {
  readonly date: string;
  /** Whether the hour runs to 12 with am/pm. */
  readonly hour12: boolean;
}

const PATTERNS: Record<Exclude<DateFormatChoice, 'auto'>, string> = {
  dmy_dot: 'd.M.yyyy',
  dmy_slash: 'dd/MM/yyyy',
  mdy_slash: 'MM/dd/yyyy',
  ymd_dash: 'yyyy-MM-dd',
};

/**
 * How dates and times are written for whoever is reading.
 *
 * The site had one answer for everybody - a pipe with the Slovak order baked
 * into it - which is right here and wrong in most places it can be read from.
 *
 * So the default is the device's own setting, read out of `Intl` rather than
 * guessed from a country list: the browser already knows, and it knows about
 * the places nobody thinks to special-case. The account's setting overrides it
 * for the reader whose device disagrees with them, which is a real case -
 * someone in Slovakia on a laptop bought in the States, or anyone who simply
 * wants a 24-hour clock wherever they are.
 *
 * Everything here is a signal, so changing the setting repaints every date on
 * the page rather than only the ones that happen to be redrawn next.
 */
@Injectable({ providedIn: 'root' })
export class DateFormatService {
  private readonly _security = inject(SecurityService);

  /** What the account asks for, or 'auto' when it asks for nothing. */
  readonly dateChoice = signal<DateFormatChoice>('auto');
  readonly timeChoice = signal<TimeFormatChoice>('auto');

  constructor() {
    this._security.currentUserData$.subscribe((user) => {
      this.dateChoice.set((user?.date_format as DateFormatChoice) || 'auto');
      this.timeChoice.set((user?.time_format as TimeFormatChoice) || 'auto');
    });
  }

  /** The pattern in force, account setting first and the device behind it. */
  readonly pattern = computed<DatePattern>(() => {
    const device = devicePattern();
    const date = this.dateChoice();
    const time = this.timeChoice();

    return {
      date: date === 'auto' ? device.date : PATTERNS[date],
      hour12: time === 'auto' ? device.hour12 : time === '12',
    };
  });

  /** How a date in each choice reads today, so a chooser can show examples. */
  example(choice: DateFormatChoice, now = new Date()): string {
    const pattern = choice === 'auto' ? devicePattern().date : PATTERNS[choice];
    return formatWith(now, pattern);
  }

  exampleTime(choice: TimeFormatChoice, now = new Date()): string {
    const hour12 = choice === 'auto' ? devicePattern().hour12 : choice === '12';
    return formatTime(now, hour12, false);
  }
}

/**
 * What this device does, worked out by asking it to write a date we know.
 *
 * `formatToParts` is the only honest way to read the order out: the parts come
 * back in the order the locale puts them, with the separators between, so
 * there is nothing to infer from the language tag. 13 December 2222 is used
 * because every field is unambiguous in the result.
 */
function devicePattern(): DatePattern {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(Date.UTC(2222, 11, 13)));

    let pattern = '';
    for (const part of parts) {
      if (part.type === 'day') {
        pattern += 'dd';
      } else if (part.type === 'month') {
        pattern += 'MM';
      } else if (part.type === 'year') {
        pattern += 'yyyy';
      } else if (part.type === 'literal') {
        // Some locales write a trailing separator, and right-to-left ones add
        // marks that are invisible but real. Neither belongs in a pattern.
        pattern += part.value.replace(/[‎‏؜]/g, '');
      }
    }

    // A locale that wrote no recognisable date is not one to build on.
    const usable = /d/.test(pattern) && /M/.test(pattern) && /y/.test(pattern);

    return {
      date: usable ? pattern.replace(/[.\-/\s]+$/, '') : PATTERNS.dmy_dot,
      hour12: deviceUsesTwelveHour(),
    };
  } catch {
    // No Intl worth the name. The site's own home format is as good a guess as
    // any, and it is what everything here used to do unconditionally.
    return { date: PATTERNS.dmy_dot, hour12: false };
  }
}

function deviceUsesTwelveHour(): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    if (typeof resolved.hour12 === 'boolean') {
      return resolved.hour12;
    }
    // Older engines report the cycle instead of the flag.
    return resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12';
  } catch {
    return false;
  }
}

const TOKENS = /dd|d|MM|M|yyyy|yy|HH|H|hh|h|mm|m|ss|s|SSS|a/g;

/** Fills a pattern in from a date, in local time. */
export function formatWith(date: Date, pattern: string, hour12 = false): string {
  const hours = date.getHours();
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  const shown = hour12 ? twelve : hours;

  const values: Record<string, string> = {
    dd: String(date.getDate()).padStart(2, '0'),
    d: String(date.getDate()),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    M: String(date.getMonth() + 1),
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),
    HH: String(shown).padStart(2, '0'),
    H: String(shown),
    hh: String(shown).padStart(2, '0'),
    h: String(shown),
    mm: String(date.getMinutes()).padStart(2, '0'),
    m: String(date.getMinutes()),
    ss: String(date.getSeconds()).padStart(2, '0'),
    s: String(date.getSeconds()),
    SSS: String(date.getMilliseconds()).padStart(3, '0'),
    a: hours < 12 ? 'AM' : 'PM',
  };

  return pattern.replace(TOKENS, (token) => values[token] ?? token);
}

/** The clock alone, in whichever cycle is in force. */
export function formatTime(date: Date, hour12: boolean, seconds: boolean): string {
  const pattern = hour12
    ? `h:mm${seconds ? ':ss' : ''} a`
    : `HH:mm${seconds ? ':ss' : ''}`;

  return formatWith(date, pattern, hour12);
}
