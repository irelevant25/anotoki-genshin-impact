import { Injector, inject } from '@angular/core';
import { AnotokiMigrationsConfig } from '@anotoki/lib/migrations';
import { SiteSettings } from '@anotoki/lib/site-settings';
import { siteStatusWords, StatusWords, TranslationService } from '@anotoki/lib/translations';
import { SecurityService } from './local-lib/services/security.service';
import { PublicSettingsService } from './local-lib/services/public-settings.service';
import { AnotokiDates } from '@anotoki/lib/ui/dates';
import { STAFF_PATH } from './routing-definition';

/**
 * What the site tells @anotoki/lib/migrations - the anotoki sites' one way of
 * behaving while a site is not set up, waits for a database update or is
 * closed for maintenance (the owner's request of 2026-10-07, and the site
 * settings' Getting in since anotoki-lib 0.11.0; backend/api/site_state.php is
 * the API's half).
 *
 * The API says where the site stands at GET /api/site-status, and while an
 * update waits answers 503 `update_pending` to everything but what the boot
 * and the Migrations page need. The root component's gate then draws, instead
 * of the site, "The site is being updated" in the reader's language - and for
 * this site's ADMIN, the way to the admin panel's Migrations page, which works
 * when nothing else does. Signing in still works meanwhile: the boot never
 * stops on an update.
 *
 * While its administrators have closed it (the admin Site settings page), the
 * API answers 503 `maintenance` to everybody but this site's ADMIN, and the
 * gate draws the library's closed sign - "Back shortly" and what they wrote -
 * for everybody else, but on the sign-in's way back, the legal pages, About
 * and Support (the library's own paths, which are genshin's). At /staff, for
 * somebody not signed in, the sign offers Sign in, back to the home page,
 * where an administrator sees the site as it is.
 *
 * Built when the module first asks, which is the app's first request (the
 * interceptor's), long before the session and the strings are known - so the
 * services the boot builds later are only looked up when a page asks.
 */
export function siteStatusConfig(): AnotokiMigrationsConfig {
  const injector = inject(Injector);
  const security = inject(SecurityService);

  return {
    statusUrl: '/api/site-status',
    apiBase: '/api/admin/migrations',
    migrationsRoute: '/admin/migrations',
    // ADMIN of this site, as the token says - which the API's own check judges by too.
    isAdmin: () => security.role() === 'ADMIN',
    isSignedIn: () => security.isLoggedIn(),
    // Back to the page the reader is on, or where the closed sign's Sign in says (home). A browser that will not
    // start it leaves them where they are.
    signIn: (returnTo?: string) => security.login(returnTo ? { returnTo } : {}).catch(() => undefined),
    // Where an administrator signs in while the site is closed: the closed sign's one door.
    staffRoute: `/${STAFF_PATH}`,
    // The page's language: the reader's on the site, English in the admin panel.
    language: () => injector.get(TranslationService).effectiveLanguage(),
    // The page's words: the database's (anotoki.siteStatus.*, where the owner
    // may reword them on the Translations page), the library's own beneath.
    // Read whenever the page draws, so it follows the language and the strings.
    get words(): Record<string, StatusWords> {
      return siteStatusWords(injector.get(TranslationService));
    },
    // The Migrations page's dates, written the way this reader writes dates (the account's order and clock).
    formatDate: (iso) => injector.get(AnotokiDates).format(iso, 'datetime'),
    // An Apply has left nothing to run: the boot's settings, the site settings and the strings a migration may have
    // brought.
    onUpToDate: (): void => {
      void injector.get(PublicSettingsService).refresh();
      void injector.get(SiteSettings).refresh();
      void injector.get(TranslationService).reload();
    },
  };
}
