import { inject } from '@angular/core';
import { AnotokiAuthConfig } from '@anotoki/lib/auth';
import { TranslationService } from '@anotoki/lib/translations';
import { PublicSettingsService } from './local-lib/services/public-settings.service';
import { VisitorKey } from './local-lib/services/visitor-key.service';

/**
 * The API's routes for a player's own data (backend
 * api/routes/genshin_impact/endpoints/quiz_progress.php, the owner check), by
 * prefix: /api/quiz/progress (and its /carry and /{quiz}), /api/quiz/result
 * and /results, /api/quiz/stats (and /difficulty), /api/quiz/activity. The
 * only routes a visitor's key is ever sent to.
 */
export const OWNER_PATHS: readonly string[] = ['/api/quiz/progress', '/api/quiz/result', '/api/quiz/results', '/api/quiz/stats', '/api/quiz/activity'];

/**
 * What the site tells @anotoki/lib/auth - the anotoki sites' one way of
 * signing in through the IAM (anotoki-lib 0.4.0; its README, "Auth"): the
 * code flow with PKCE, the tokens, the callback (/auth/callback), the
 * interceptor that decides who a request is when it is issued, and the IAM's
 * sign-in hint - genshin lets visitors in, so a visitor signed in at the IAM
 * is signed in here with one silent hop (the hint is on by default; its
 * cookie is the IAM's `anotoki_signed_in`).
 *
 * What is this site's:
 *
 *  - where the IAM is: the public settings' `auth` (GET /api/settings/public,
 *    read first at boot - PublicSettingsService), never asked of the IAM by the
 *    page; it carries whether the IAM requires signing in here, and whether
 *    it knows the site at all (`sign_in_available`);
 *  - the boot's settings read goes bare - no token, no key - like the
 *    library's own boot route, and so does the site settings' (what every
 *    page is told, @anotoki/lib/site-settings): each must answer whoever is
 *    asking, the same answer to everybody;
 *  - the visitor's key (VisitorKey, localStorage `genshin-visitor`) goes only
 *    on a player's own routes (OWNER_PATHS), and only while the server keeps
 *    visitors (users/045 applied - `visitors.available`): otherwise a
 *    visitor's request carries nothing;
 *  - the IAM's pages, and the sign-in screens' words, in the language the
 *    site is read in; an owner's rewording of the library's `anotoki.signIn.*`
 *    words comes from the site's database, like the kit's.
 *
 * Built as the app starts, before the services it names exist - so each is
 * injected only when one of these functions runs: the translations module,
 * for one, reads the sign-in itself (the account's language).
 */
export function siteAuthConfig(): AnotokiAuthConfig {
  return {
    config: () => inject(PublicSettingsService).auth(),
    api: {
      skip: ['/api/site-status', '/api/auth/config', '/api/translations/', '/api/settings/public', '/api/site-settings'],
      visitorPrefixes: [...OWNER_PATHS],
    },
    visitors: () => (inject(PublicSettingsService).visitorsAvailable() ? inject(VisitorKey) : null),
    language: () => inject(TranslationService).language(),
    translate: (key) => inject(TranslationService).libraryWord(key),
  };
}
