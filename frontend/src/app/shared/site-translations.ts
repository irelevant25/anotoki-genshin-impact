import { inject } from '@angular/core';
import { SiteStatus } from '@anotoki/lib/migrations';
import { AdminLanguage, AnotokiTranslationsConfig, isAdminArea, LanguageDeleted } from '@anotoki/lib/translations';
import { AccountPreferences } from './local-lib/services/account-preferences.service';
import { SecurityService } from './local-lib/services/security.service';

/** How many guides a language has (the server's `guides`, backend api/translations.php). */
function guideCount(language: AdminLanguage | LanguageDeleted): number {
  const guides = language['guides'];
  return typeof guides === 'number' ? guides : 0;
}

function guidesWord(count: number): string {
  return count === 1 ? '1 guide' : `${count} guides`;
}

/**
 * What the site tells @anotoki/lib/translations - the anotoki sites' one
 * implementation of their words (anotoki-lib 0.3.0): which language the pages
 * are read in and the strings for it, from GET /api/translations/{code}
 * (backend api/translations.php), the `translate` pipe every template uses,
 * the kit's words (forKit(), app.config.ts), and the admin panel's
 * Translations and Languages pages.
 *
 * What is this site's:
 *
 *  - the names this device has always kept the reader's choice and the cached
 *    words under (LocalStorageService's `anotoki-genshin-impact-` prefix), so
 *    both survive the upgrade;
 *  - the account: the reading language is the anotoki account's whenever the
 *    account's choices apply (AccountPreferences: signed in, with an IAM that
 *    keeps them), and a language chosen here is saved to it through the same
 *    one-at-a-time queue as the theme and the dates. A language the IAM does
 *    not offer (`invalid_request`) stays this site's for the visit, without a
 *    word; any other refusal is said by the public shell (sites/main);
 *  - the admin panel is English for its staff - and only for them: the page
 *    that tells a player the panel is not theirs (/admin/**, no-access) is in
 *    their own language, as it always was;
 *  - who may use the admin pages: ADMIN or EDITOR, both pages - the server
 *    checks the same (backend routes/users/endpoints/translations.php);
 *  - the guides a language has, beside it on the Languages page and named
 *    before it is deleted: they go with it (guide_contents, users/050);
 *  - nothing is asked while the site is not set up: the API answers nothing
 *    but that (the cache, if any, is used as it is).
 *
 * Built the first time the module needs it - never while the service is being
 * made - so the services it reads are made by then.
 */
export function siteTranslationsConfig(): AnotokiTranslationsConfig {
  const security = inject(SecurityService);
  const account = inject(AccountPreferences);
  const siteStatus = inject(SiteStatus);

  return {
    storageKeys: {
      language: 'anotoki-genshin-impact-language',
      cache: 'anotoki-genshin-impact-language-cache',
      drafts: 'anotoki-genshin-impact-localization-drafts',
    },
    account: {
      // Null while the account's choices do not apply - a visitor, or an IAM
      // that keeps none: then this device's choice is the reader's, and the
      // account's language is not adopted behind it.
      language: () => account.language(),
      decides: () => account.kept(),
      // AccountPreferences never rejects - it says what became of a choice;
      // the library waits for a refusal to be thrown, with the IAM's code on it.
      save: async (code): Promise<void> => {
        const result = await account.save('language', code);
        if (result.outcome === 'refused') {
          throw { code: result.code ?? 'unknown' };
        }
      },
      userKey: (): string | null => {
        const user = security.currentUser();
        return user ? String(user.id) : null;
      },
    },
    canAsk: () => siteStatus.state() !== 'not-set-up',
    englishOnly: (url) => isAdminArea(url) && security.isStaff(),
    admin: {
      allows: { strings: () => security.isStaff(), languages: () => security.isStaff() },
      routes: { translations: '/admin/translations', languages: '/admin/languages', migrations: '/admin/migrations' },
      leads: {
        translations:
          'What the site says, in every language - but the guides behind the question marks, which are pages of their own (Guides). New keys come with the migrations that need them. This page stays English.',
      },
      languageNotes: {
        row: (language): string | null => (guideCount(language) > 0 ? guidesWord(guideCount(language)) : null),
        beforeDelete: (language): string | null => {
          const guides = guideCount(language);
          return guides > 0 ? `Its ${guidesWord(guides)} ${guides === 1 ? 'goes' : 'go'} with it too.` : null;
        },
        afterDelete: (_language, answer): string | null => {
          const guides = guideCount(answer);
          return guides > 0 ? `So ${guides === 1 ? 'is' : 'are'} its ${guidesWord(guides)}.` : null;
        },
      },
    },
  };
}
