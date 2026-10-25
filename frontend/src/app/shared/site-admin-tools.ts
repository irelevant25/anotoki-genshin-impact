import { Injector, inject } from '@angular/core';
import { AnotokiAdminConfig } from '@anotoki/lib/admin';
import { TranslationService } from '@anotoki/lib/translations';
import { ConfigService } from './local-lib/services/config.service';
import { SecurityService } from './local-lib/services/security.service';
import { AnotokiDates } from '@anotoki/lib/ui/dates';
import { FEEDBACK_FIELD_NAMES } from './site-feedback';

/** The Migrations page (@anotoki/lib/migrations/page), offered while a table a page needs waits for an update. */
export const MIGRATIONS_ROUTE = '/admin/migrations';

/**
 * A moment as the admin panel writes it (@anotoki/lib/ui/dates): the account's date order and clock where it chose
 * them, else the page language's way - English in the panel - as on the Migrations page.
 */
export function accountDates(injector: Injector): (iso: string) => string {
  return (iso) => injector.get(AnotokiDates).format(iso, 'datetime');
}

/**
 * What the site tells the anotoki library's admin tools (@anotoki/lib/admin;
 * anotoki-lib 0.4.0, "Admin tools"): the error log, the audit log, feedback,
 * backups, the file explorer and - since 0.11.0 - the site settings, each the
 * library's page on a lazy route of the admin panel (sites/admin/admin.routes.ts),
 * each replacing this site's own.
 *
 *  - for this site's ADMIN alone, as the token says (the owner's decision:
 *    EDITORs see none of them - the server refuses them too); anybody else
 *    is told whose a page is, and nothing is asked;
 *  - the proof a backup asks for before it is made, downloaded, deleted or
 *    restored is a sign-in of the last ten minutes: "Sign in again" goes
 *    through the IAM's sign-in, asked for the password again, and back;
 *  - feedback's extra fields named as the site names them (the old columns,
 *    shared/site-feedback.ts);
 *  - the languages the Site settings page gives the maintenance page's and the
 *    announcement's words a field each: the site's, as the pages' words came
 *    with them - a message in a language nobody can read the site in is one
 *    nobody sees;
 *  - a download's or a preview's link through the site's API address, and
 *    the dates in the account's order and clock.
 *
 * A person the logs name is not a link: the People page has no page per
 * person.
 *
 * Provided at the app's root (app.config.ts), not on the admin panel's route:
 * the library's pages read it through a root service of theirs, and so does
 * FeedbackUnread, the count beside the navigation's Feedback. It is small -
 * the pages themselves load with their routes. Built when a page or the badge
 * first asks, with the services it reads made by then.
 */
export function siteAdminToolsConfig(): AnotokiAdminConfig {
  const security = inject(SecurityService);
  const config = inject(ConfigService);
  const injector = inject(Injector);

  return {
    isAdmin: () => security.role() === 'ADMIN',
    signInAgain: () => security.login({ prompt: 'login' }).catch(() => undefined),
    migrationsRoute: MIGRATIONS_ROUTE,
    resolveUrl: (path) => `${config.backendUrl}${path}`,
    formatDate: accountDates(injector),
    feedbackFields: FEEDBACK_FIELD_NAMES,
    // Looked up when the page asks: the translation service is built after this configuration is.
    languages: () =>
      injector
        .get(TranslationService)
        .languages()
        .map((language) => ({ code: language.code, name: language.native_name })),
  };
}
