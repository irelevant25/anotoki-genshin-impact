import { Injector, inject, runInInjectionContext } from '@angular/core';
import { AnotokiAdminConfig } from '@anotoki/lib/admin';
import { ConfigService } from './local-lib/services/config.service';
import { SecurityService } from './local-lib/services/security.service';
import { AppDatePipe } from './local-lib/pipes/date.pipe';
import { FEEDBACK_FIELD_NAMES } from './site-feedback';

/** The Migrations page (@anotoki/lib/migrations/page), offered while a table a page needs waits for an update. */
export const MIGRATIONS_ROUTE = '/admin/migrations';

/** A moment as the admin panel writes it: the account's date order and clock (AppDatePipe), as on the Migrations page. */
export function accountDates(injector: Injector): (iso: string) => string {
  let dates: AppDatePipe | null = null;
  return (iso) => (dates ??= runInInjectionContext(injector, () => new AppDatePipe())).transform(iso, 'datetime');
}

/**
 * What the site tells the anotoki library's admin tools (@anotoki/lib/admin;
 * anotoki-lib 0.4.0, "Admin tools"): the error log, the audit log, feedback,
 * backups and the file explorer - each the library's page on a lazy route of
 * the admin panel (sites/admin/admin.routes.ts), each replacing this site's own.
 *
 *  - for this site's ADMIN alone, as the token says (the owner's decision:
 *    EDITORs see none of them - the server refuses them too); anybody else
 *    is told whose a page is, and nothing is asked;
 *  - the proof a backup asks for before it is made, downloaded, deleted or
 *    restored is a sign-in of the last ten minutes: "Sign in again" goes
 *    through the IAM's sign-in, asked for the password again, and back;
 *  - feedback's extra fields named as the site names them (the old columns,
 *    shared/site-feedback.ts);
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

  return {
    isAdmin: () => security.role() === 'ADMIN',
    signInAgain: () => security.login({ prompt: 'login' }).catch(() => undefined),
    migrationsRoute: MIGRATIONS_ROUTE,
    resolveUrl: (path) => `${config.backendUrl}${path}`,
    formatDate: accountDates(inject(Injector)),
    feedbackFields: FEEDBACK_FIELD_NAMES,
  };
}
