export class DynamicDateTimeConverter {
  /**
   * Stands in when a format carries no year, e.g. the `dd.MM.` a birthday is
   * shown as. A leap year, so the 29th of February stays a valid date.
   */
  static readonly DEFAULT_YEAR = 2000;

  static readonly MONTH_NAMES = {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  static readonly TOKEN_DEFINITIONS: Record<string, any> = {
    // Date tokens
    yyyy: { type: 'year', length: 4, regex: '(\\d{4})' },
    yy: { type: 'year', length: 2, regex: '(\\d{2})' },
    MMMM: { type: 'month', length: 'long', regex: '(\\w+)' },
    MMM: { type: 'month', length: 'short', regex: '(\\w{3})' },
    MM: { type: 'month', length: 2, regex: '(\\d{1,2})' },
    M: { type: 'month', length: 1, regex: '(\\d{1,2})' },
    dd: { type: 'day', length: 2, regex: '(\\d{1,2})' },
    d: { type: 'day', length: 1, regex: '(\\d{1,2})' },

    // Time tokens
    HH: { type: 'hour24', length: 2, regex: '(\\d{1,2})' },
    H: { type: 'hour24', length: 1, regex: '(\\d{1,2})' },
    hh: { type: 'hour12', length: 2, regex: '(\\d{1,2})' },
    h: { type: 'hour12', length: 1, regex: '(\\d{1,2})' },
    mm: { type: 'minute', length: 2, regex: '(\\d{1,2})' },
    m: { type: 'minute', length: 1, regex: '(\\d{1,2})' },
    ss: { type: 'second', length: 2, regex: '(\\d{1,2})' },
    s: { type: 'second', length: 1, regex: '(\\d{1,2})' },
    SSS: { type: 'millisecond', length: 3, regex: '(\\d{1,3})' },
    SS: { type: 'millisecond', length: 2, regex: '(\\d{1,2})' },
    S: { type: 'millisecond', length: 1, regex: '(\\d{1})' },
    A: { type: 'ampm', length: 'upper', regex: '(AM|PM)' },
    a: { type: 'ampm', length: 'lower', regex: '(am|pm|AM|PM)' },
  };

  /**
   * Convert date/time from one format to another
   * @param dateTimeString - Input date/time string
   * @param fromFormat - Source format (e.g., 'dd.MM.yyyy HH:mm:ss', 'MM/dd/yy h:mm a')
   * @param toFormat - Target format (e.g., 'yyyy-MM-dd HH:mm', 'dd MMM yyyy hh:mm A')
   * @returns Formatted date/time string or null if parsing fails
   */
  static convertDateTime(dateTimeString: string | null | undefined, fromFormat: string, toFormat: string): string | null {
    if (!dateTimeString || !fromFormat || !toFormat) {
      return null;
    }

    const parsedDateTime = this.parseDateTime(dateTimeString.trim(), fromFormat);
    if (!parsedDateTime) {
      console.log('convertDateTime failed');
      return null;
    }

    const result = this.formatDateTime(parsedDateTime, toFormat);
    return result;
  }

  /**
   * Parse date/time string according to the given format
   */
  static parseDateTime(dateTimeString: string, format: string): Date | null {
    try {
      const formatTokens = this.extractTokens(format);
      const regex = this.buildRegexFromFormat(format, formatTokens);

      const match = dateTimeString.match(`^${regex}`);
      if (!match) {
        return null;
      }

      const components = this.extractDateTimeComponents(match, formatTokens);
      if (!components) {
        return null;
      }

      const { year, month, day, hour, minute, second, millisecond } = components;
      const date = new Date(year, month - 1, day, hour, minute, second, millisecond);

      // Validate the date
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) {
        return null;
      }

      return date;
    } catch (error) {
      console.error('Error parsing date/time:', error);
      return null;
    }
  }

  /**
   * Extract tokens from format string
   */
  private static extractTokens(format: string): Array<{ token: string; position: number; definition: any }> {
    const tokens: Array<{ token: string; position: number; definition: any }> = [];

    // Sort tokens by length (longest first) to match correctly
    const sortedTokens = Object.keys(this.TOKEN_DEFINITIONS).sort((a, b) => b.length - a.length);

    let remainingFormat = format;
    let currentPosition = 0;

    while (remainingFormat.length > 0) {
      let foundToken = false;

      for (const token of sortedTokens) {
        if (remainingFormat.startsWith(token)) {
          tokens.push({
            token,
            position: currentPosition,
            definition: this.TOKEN_DEFINITIONS[token],
          });
          remainingFormat = remainingFormat.slice(token.length);
          currentPosition += token.length;
          foundToken = true;
          break;
        }
      }

      if (!foundToken) {
        // Skip non-token character
        remainingFormat = remainingFormat.slice(1);
        currentPosition += 1;
      }
    }

    return tokens;
  }

  /**
   * Build regex pattern from format and tokens
   */
  private static buildRegexFromFormat(format: string, tokens: Array<{ token: string; position: number; definition: any }>): string {
    let regex = format;

    // Replace tokens with their regex patterns (longest first)
    // const sortedTokens = tokens.sort((a, b) => b.token.length - a.token.length);

    for (const tokenInfo of tokens) {
      // regex = regex.replace(new RegExp(this.escapeRegex(tokenInfo.token), 'g'), tokenInfo.definition.regex);
      regex = regex.replace(tokenInfo.token, tokenInfo.definition.regex);
    }

    // Escape remaining special regex characters
    // regex = regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Restore the capture groups
    // for (const tokenInfo of sortedTokens) {
    //   regex = regex.replace(new RegExp(`\\\\\\(${this.escapeRegex(tokenInfo.definition.regex.slice(1, -1))}\\\\\\)`, 'g'), tokenInfo.definition.regex);
    // }

    return regex;
  }

  /**
   * Escape special regex characters
   */
  // private static escapeRegex(string: string): string {
  //   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // }

  /**
   * Extract date/time components from regex match
   */
  private static extractDateTimeComponents(
    match: RegExpMatchArray,
    tokens: Array<{ token: string; position: number; definition: any }>,
  ): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
  } | null {
    let year: number | null = null;
    let month: number | null = null;
    let day: number | null = null;
    let hour: number = 0;
    let minute: number = 0;
    let second: number = 0;
    let millisecond: number = 0;
    let isAM: boolean | null = null;
    let is12HourFormat = false;

    let matchIndex = 1; // Start from 1 since 0 is the full match

    for (const tokenInfo of tokens) {
      const value = match[matchIndex++];
      if (!value) {
        continue;
      }

      switch (tokenInfo.definition.type) {
        case 'year':
          if (tokenInfo.definition.length === 2) {
            year = this.expandTwoDigitYear(parseInt(value, 10));
          } else {
            year = parseInt(value, 10);
          }
          break;

        case 'month':
          if (tokenInfo.definition.length === 'short') {
            month = this.parseMonthName(value, 'short');
          } else if (tokenInfo.definition.length === 'long') {
            month = this.parseMonthName(value, 'long');
          } else {
            month = parseInt(value, 10);
          }
          break;

        case 'day':
          day = parseInt(value, 10);
          break;

        case 'hour24':
          hour = parseInt(value, 10);
          break;

        case 'hour12':
          hour = parseInt(value, 10);
          is12HourFormat = true;
          break;

        case 'minute':
          minute = parseInt(value, 10);
          break;

        case 'second':
          second = parseInt(value, 10);
          break;

        case 'millisecond':
          let ms = parseInt(value, 10);
          // Normalize milliseconds based on length
          if (tokenInfo.definition.length === 1) {
            ms = ms * 100; // 1 digit -> multiply by 100
          } else if (tokenInfo.definition.length === 2) {
            ms = ms * 10; // 2 digits -> multiply by 10
          }
          millisecond = ms;
          break;

        case 'ampm':
          isAM = value.toLowerCase() === 'am';
          break;
      }
    }

    // Handle 12-hour format conversion
    if (is12HourFormat && isAM !== null) {
      if (isAM && hour === 12) {
        hour = 0; // 12 AM is 0 in 24-hour format
      } else if (!isAM && hour !== 12) {
        hour += 12; // PM hours except 12 PM
      }
    }

    // A format may leave the year out - a birthday is day and month only.
    // Month and day still have to be there for this to be a date.
    if (month === null || day === null) {
      return null;
    }
    if (year === null) {
      year = this.DEFAULT_YEAR;
    }

    return { year, month, day, hour, minute, second, millisecond };
  }

  /**
   * Format date/time according to the given format
   */
  static formatDateTime(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Convert from 0-indexed
    const day = date.getDate();
    const hour24 = date.getHours();
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const millisecond = date.getMilliseconds();
    const isAM = hour24 < 12;

    let result = format;

    // Replace tokens with actual values (longest first to avoid conflicts)
    const replacements = [
      // Date tokens
      { token: 'yyyy', value: year.toString() },
      { token: 'yy', value: (year % 100).toString().padStart(2, '0') },
      { token: 'MMMM', value: this.MONTH_NAMES.long[date.getMonth()] },
      { token: 'MMM', value: this.MONTH_NAMES.short[date.getMonth()] },
      { token: 'MM', value: month.toString().padStart(2, '0') },
      { token: 'M', value: month.toString() },
      { token: 'dd', value: day.toString().padStart(2, '0') },
      { token: 'd', value: day.toString() },

      // Time tokens
      { token: 'HH', value: hour24.toString().padStart(2, '0') },
      { token: 'H', value: hour24.toString() },
      { token: 'hh', value: hour12.toString().padStart(2, '0') },
      { token: 'h', value: hour12.toString() },
      { token: 'mm', value: minute.toString().padStart(2, '0') },
      { token: 'm', value: minute.toString() },
      { token: 'ss', value: second.toString().padStart(2, '0') },
      { token: 's', value: second.toString() },
      { token: 'SSS', value: millisecond.toString().padStart(3, '0') },
      {
        token: 'SS',
        value: Math.floor(millisecond / 10)
          .toString()
          .padStart(2, '0'),
      },
      { token: 'S', value: Math.floor(millisecond / 100).toString() },
      { token: 'A', value: isAM ? 'AM' : 'PM' },
      { token: 'a', value: isAM ? 'am' : 'pm' },
    ];

    // Sort by token length (longest first) to avoid partial replacements
    replacements.sort((a, b) => b.token.length - a.token.length);

    for (const replacement of replacements) {
      result = result.replace(new RegExp(replacement.token, 'g'), replacement.value);
    }

    return result;
  }

  /**
   * Parse month name to month number
   */
  private static parseMonthName(monthName: string, type: 'short' | 'long' = 'short'): number {
    const months = type === 'short' ? this.MONTH_NAMES.short : this.MONTH_NAMES.long;
    const index = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
    return index !== -1 ? index + 1 : 1; // Return 1 if not found (January as fallback)
  }

  /**
   * Expand 2-digit year to 4-digit year
   */
  private static expandTwoDigitYear(year: number): number {
    // Assume years 00-30 are 2000-2030, and 31-99 are 1931-1999
    return year <= 30 ? 2000 + year : 1900 + year;
  }

  /**
   * Auto-detect common date/time formats and convert
   */
  static smartConvert(dateTimeString: string, toFormat: string): string | null {
    const commonFormats = [
      // Date only
      'dd.MM.yyyy',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'yyyy-MM-dd',
      'dd-MM-yyyy',
      'MM-dd-yyyy',
      'yyyy/MM/dd',
      'dd.MM.yy',
      'dd/MM/yy',
      'MM/dd/yy',
      'dd MMM yyyy',
      'MMM dd, yyyy',

      // Date with time
      'dd.MM.yyyy HH:mm',
      'dd.MM.yyyy HH:mm:ss',
      'dd.MM.yyyy h:mm a',
      'dd/MM/yyyy HH:mm',
      'dd/MM/yyyy HH:mm:ss',
      'dd/MM/yyyy h:mm a',
      'MM/dd/yyyy HH:mm',
      'MM/dd/yyyy HH:mm:ss',
      'MM/dd/yyyy h:mm a',
      'yyyy-MM-dd HH:mm',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd h:mm a',
      'dd-MM-yyyy HH:mm',
      'dd-MM-yyyy HH:mm:ss',
      'dd-MM-yyyy h:mm a',
      'MMM dd, yyyy HH:mm',
      'MMM dd, yyyy h:mm a',
      'dd MMM yyyy HH:mm',

      // Time only
      'HH:mm',
      'HH:mm:ss',
      'h:mm a',
      'h:mm:ss a',
      'HH:mm:ss.SSS',
    ];

    for (const format of commonFormats) {
      const result = this.convertDateTime(dateTimeString, format, toFormat);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  /**
   * Get current date/time in specified format
   */
  static now(format: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return this.formatDateTime(new Date(), format);
  }
}

// Usage examples:
/*
// Date with time conversions
console.log(DynamicDateTimeConverter.convertDateTime('15.03.2023 14:30:45', 'dd.MM.yyyy HH:mm:ss', 'yyyy-MM-dd h:mm:ss a'));
// Output: '2023-03-15 2:30:45 pm'

console.log(DynamicDateTimeConverter.convertDateTime('03/15/23 2:30 PM', 'MM/dd/yy h:mm A', 'dd.MM.yyyy HH:mm'));
// Output: '15.03.2023 14:30'

console.log(DynamicDateTimeConverter.convertDateTime('2023-12-25 23:59:59.999', 'yyyy-MM-dd HH:mm:ss.SSS', 'dd MMM yyyy hh:mm:ss A'));
// Output: '25 Dec 2023 11:59:59 PM'

// Time only conversions
console.log(DynamicDateTimeConverter.convertDateTime('14:30:45', 'HH:mm:ss', 'h:mm:ss a'));
// Output: '2:30:45 pm'

console.log(DynamicDateTimeConverter.convertDateTime('2:30 PM', 'h:mm A', 'HH:mm'));
// Output: '14:30'

// Smart conversion (auto-detect format)
console.log(DynamicDateTimeConverter.smartConvert('15.03.2023 14:30', 'yyyy-MM-dd HH:mm:ss'));
// Output: '2023-03-15 14:30:00'

// Current date/time
console.log(DynamicDateTimeConverter.now('dd/MM/yyyy hh:mm:ss a'));
// Output: current date/time in specified format

// Complex formats
console.log(DynamicDateTimeConverter.convertDateTime('March 15, 2023 at 2:30:45 PM', 'MMMM dd, yyyy at h:mm:ss A', 'dd.MM.yy HH:mm'));
// Output: '15.03.23 14:30'
*/
