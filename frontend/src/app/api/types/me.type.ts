/**
 * The signed-in reader's preferences for this site.
 *
 * Hand-written: /api/me checks these bodies itself rather than through a model.
 * Everything else about the account - its password, two-factor, Google,
 * sessions - is the anotoki IAM's, and is changed on the IAM's own account page.
 */

/** Which area's theme is being set: the site, or the admin panel. */
export type ThemeArea = 'main' | 'admin';

export interface ThemeRequest {
  area: ThemeArea;
  theme: 'light' | 'dark' | 'auto';
}

export interface LanguageRequest {
  language: string;
}

/**
 * How this reader wants dates and times written.
 *
 * Either field absent leaves that setting alone; null clears it back to
 * whatever the device says, which is what a reader starts with.
 */
export interface DateFormatsRequest {
  date_format?: string | null;
  time_format?: string | null;
}
