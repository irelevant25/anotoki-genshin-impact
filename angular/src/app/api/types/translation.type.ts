/**
 * Translation keys and the strings behind them.
 *
 * Hand-written: a bundle is a flat key/value map assembled per language, not a
 * table, and the admin grid is three tables joined into one view.
 */

import { Language, TranslationKey } from '../models';

/**
 * One language's strings, keyed by translation key.
 *
 * English is merged underneath every bundle by the server, so a key with no
 * string in this language still answers with something readable.
 */
export type TranslationBundle = Record<string, string>;

/** A blank value clears the row, which reads as untranslated rather than empty. */
export interface TranslationSaveRequest {
  values: Record<string, Record<string, string>>;
}

export interface TranslationImportRequest {
  values: TranslationBundle;
  /** Off by default: an import should not invent keys nobody declared. */
  create_missing_keys?: boolean;
}

/** `?all=1` includes the languages that are switched off, for the admin list. */
export interface LanguageQuery {
  all?: 1;
}

