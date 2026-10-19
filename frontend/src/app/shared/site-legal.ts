import { inject } from '@angular/core';
import { AnotokiLegalConfig, DEFAULT_LEGAL_PATHS } from '@anotoki/lib/legal';
import { TranslationService } from '@anotoki/lib/translations';

/**
 * The addresses of the anotoki family's pages the footers link - About and Support (anotoki-lib 0.8.0), then the
 * legal pages: the library's own paths (sites/main/main.routes.ts puts each page there, the footers' links go there).
 */
export const LEGAL_PAGE_PATHS: readonly string[] = [DEFAULT_LEGAL_PATHS.about, DEFAULT_LEGAL_PATHS.support, DEFAULT_LEGAL_PATHS.terms, DEFAULT_LEGAL_PATHS.privacy, DEFAULT_LEGAL_PATHS.contact];

/** Whether an address (its path, a query or a fragment after it aside) is one of them - anybody's, signed in or not. */
export function isLegalPage(path: string): boolean {
  return LEGAL_PAGE_PATHS.includes(path.split(/[?#]/)[0] || '/');
}

/**
 * How genshin plugs into the anotoki family's legal pages (@anotoki/lib/legal,
 * anotoki-lib 0.6: Terms, Privacy and Contact on the lazy routes /terms,
 * /privacy and /contact - sites/main/main.routes.ts - and the footer's links
 * to them, sites/main/common/footer) and, since 0.8.0, its About and Support
 * pages on /about and /support, which both footers link first.
 * provideAnotokiLegal() runs it in an injection context (app.config.ts).
 *
 * - The language: the one on the page (`effectiveLanguage()`: the public site
 *   is read in the reader's, as the pages are).
 * - The words: the library's (`anotoki.legal.*`, `anotoki.legalLinks.*`,
 *   `anotoki.about.*`, `anotoki.support.*`) - the
 *   database's string of a library key, an owner's rewording on the
 *   Translations page, before the library's built-in English and Slovak. That
 *   Slovak addresses nobody ("ty" or "Vy"); genshin's own facts are in its
 *   informal Slovak (users/055).
 * - The paths: the library's own; the operator: the family's (Code Hero
 *   s.r.o., its address kept in two parts in the library).
 * - The facts - what genshin keeps and for how long, its cookie and browser
 *   storage, who else handles data, the anotoki account's pages, the fan
 *   clause - are read by the pages alone, and their frame gives them
 *   (sites/main/legal/): none of it is in the first load, which the footer's
 *   links share with every page.
 */
export function siteLegalConfig(): AnotokiLegalConfig {
  const i18n = inject(TranslationService);
  return {
    language: () => i18n.effectiveLanguage(),
    translate: (key) => i18n.libraryWord(key),
    facts: (): never => {
      throw new Error("The legal pages' facts come with their frame (sites/main/legal/legal-frame.component.ts, legal-facts.ts).");
    },
  };
}
