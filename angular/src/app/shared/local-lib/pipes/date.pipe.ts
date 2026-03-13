import { Pipe, PipeTransform } from '@angular/core';

export type SlovakDateFormat = 'date' | 'datetime' | 'datetimeWithSeconds';

const FORMAT_MAP: Record<SlovakDateFormat, string> = {
  date: 'd.M.yyyy',
  datetime: 'd.M.yyyy HH:mm',
  datetimeWithSeconds: 'd.M.yyyy HH:mm:ss',
};

@Pipe({
  name: 'slovakDate',
  standalone: true,
})
export class SlovakDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format: SlovakDateFormat = 'date'): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      console.warn(`SlovakDatePipe: invalid date "${value}"`);
      return value;
    }

    const tokens: Record<string, string> = {
      dd: String(date.getDate()).padStart(2, '0'),
      d: String(date.getDate()),
      MM: String(date.getMonth() + 1).padStart(2, '0'),
      M: String(date.getMonth() + 1),
      yyyy: String(date.getFullYear()),
      yy: String(date.getFullYear()).slice(-2),
      HH: String(date.getHours()).padStart(2, '0'),
      H: String(date.getHours()),
      mm: String(date.getMinutes()).padStart(2, '0'),
      m: String(date.getMinutes()),
      ss: String(date.getSeconds()).padStart(2, '0'),
      s: String(date.getSeconds()),
      SSS: String(date.getMilliseconds()).padStart(3, '0'),
    };

    const tokenRegex = /dd|d|MM|M|yyyy|yy|HH|H|mm|m|ss|s|SSS/g;

    return FORMAT_MAP[format].replace(tokenRegex, (match) => tokens[match] ?? match);
  }
}

// EXAMPLES:

// 1.3.2024
// {{ '2024-03-01T08:15:30' | slovakDate }}

// 1.3.2024 08:15
// {{ '2024-03-01T08:15:30' | slovakDate : 'datetime' }}

// 1.3.2024 08:15:30
// {{ '2024-03-01T08:15:30' | slovakDate : 'datetimeWithSeconds' }}
