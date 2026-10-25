import { inject } from '@angular/core';
import { AnotokiSiteSettingsConfig } from '@anotoki/lib/site-settings';
import { LOCAL_STORAGE_PREFIX } from './local-lib/services/local-storage.service';
import { SecurityService } from './local-lib/services/security.service';

/**
 * Where this browser keeps the announcement its reader hid: a mark of it - its
 * kind and its words in every language, as a fingerprint - never the words,
 * until they change (the library's bar). Under the site's own prefix; the
 * Privacy page names it (sites/main/legal/legal-facts.ts).
 */
export const ANNOUNCEMENT_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}announcement`;

/**
 * What the site tells @anotoki/lib/site-settings - the switches its
 * administrators throw without a deploy, genshin's own made every anotoki
 * site's (anotoki-lib 0.11.0; its README, "Site settings"): what every page is
 * told, from GET /api/site-settings, read once at boot (app.config.ts) and
 * again after the admin Site settings page saves - the announcement bar
 * (<anotoki-announcement>, above the public site's header), Page access's
 * guard (pageAccessGuard, on the public routes: a page switched off, or kept
 * for some readers, falls through to the not-found page) and what this site's
 * ADMIN reads above a page (<anotoki-page-notice>). The site closed for
 * maintenance is the site status's (@anotoki/lib/migrations, shared/site-status.ts):
 * the gate draws the library's closed sign, with Sign in at /staff.
 *
 * Who the reader is, as this site knows them: the roles of its own record of
 * the person (/api/me - the token's roles here), and whether anybody is signed
 * in. Followed: a sign-out in another tab takes the pages an account could see
 * back out of the menu and the router without a reload. Nothing in the browser
 * is a security boundary - the server refuses a hidden page's API paths itself
 * (the library's PageAccessGate).
 */
export function siteSettingsConfig(): AnotokiSiteSettingsConfig {
  const security = inject(SecurityService);

  return {
    roles: () => security.currentUser()?.roles ?? [],
    signedIn: () => security.isLoggedIn(),
    storageKey: ANNOUNCEMENT_STORAGE_KEY,
  };
}
