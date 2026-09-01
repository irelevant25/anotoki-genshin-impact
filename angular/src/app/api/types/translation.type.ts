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

/**
 * `GET /api/translations/{code}` - the bundle, and which language it turned out
 * to be. An unknown or retired code answers in the fallback rather than failing,
 * so `language` is worth reading: it is not always the code that was asked for.
 */
export interface TranslationBundleResponse {
  language: string;
  values: TranslationBundle;
}

export interface TranslationSite {
  code: string;
  name: string;
}

/** Everything the translation editor draws in one request. */
export interface TranslationAdminView {
  languages: Language[];
  keys: (TranslationKey & { values: Record<string, string> })[];
  sites: TranslationSite[];
  /** Which site this deployment serves; `common` keys belong to all of them. */
  currentSite: string;
}

/** A blank value clears the row, which reads as untranslated rather than empty. */
export interface TranslationSaveRequest {
  values: Record<string, Record<string, string>>;
}

export interface TranslationSaveResult {
  written: number;
  cleared: number;
}

export interface TranslationImportRequest {
  values: TranslationBundle;
  /** Off by default: an import should not invent keys nobody declared. */
  create_missing_keys?: boolean;
}

export interface TranslationImportResult {
  written: number;
  cleared: number;
  keys_created: number;
}

/** `?all=1` includes the languages that are switched off, for the admin list. */
export interface LanguageQuery {
  all?: 1;
}

/**
 * Deleting a language: the translations that went with it, and the accounts
 * that were reading in it and have been moved to the fallback.
 */
export interface LanguageDeleted {
  message: string;
  translations_deleted: number;
  users_moved: number;
}

/** Deleting a key takes its translations with it, by cascade. */
export interface TranslationKeyDeleted {
  message: string;
  translations_deleted: number;
}
