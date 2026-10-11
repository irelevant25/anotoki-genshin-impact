import { ApplicationConfig, inject, InjectionToken, Injector, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import localeEn from "@angular/common/locales/en";
import localeSk from "@angular/common/locales/sk";
import { provideAnotokiAdmin } from "@anotoki/lib/admin";
import { ANOTOKI_AUTH_CLIENT_FACTORY, AnotokiAuth, anotokiAuthInterceptor, provideAnotokiAuth } from "@anotoki/lib/auth";
import { provideAnotokiFeedback } from "@anotoki/lib/feedback";
import { provideAnotokiMigrations, SiteStatus, siteStatusInterceptor } from "@anotoki/lib/migrations";
import { provideAnotokiTranslations, TranslationService } from "@anotoki/lib/translations";
import { provideAnotokiUi } from "@anotoki/lib/ui/config";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ConfigService } from "./shared/local-lib/services/config.service";
import { SecurityService } from "./shared/local-lib/services/security.service";
import { SiteSettingsService } from "./shared/local-lib/services/site-settings.service";
import { httpInterceptor } from "./shared/local-lib/services/http.interceptor";
import { ThemeToggleService } from "./shared/local-lib/theme-toggle/theme-toggle.service";
import { AUTH_CALLBACK_PATH } from "./shared/routing-definition";
import { siteAdminToolsConfig } from "./shared/site-admin-tools";
import { siteAuthConfig } from "./shared/site-auth";
import { siteFeedbackConfig } from "./shared/site-feedback";
import { siteStatusConfig } from "./shared/site-status";
import { siteTranslationsConfig } from "./shared/site-translations";
import { clientNotingSilentSignIns } from "./shared/silent-sign-in";

// export const appConfig: ApplicationConfig = {
// providers: [provideRouter(routes, withHashLocation()), provideHttpClient()],
// providers: [provideRouter(routes), provideHttpClient()],
// };

// LOCALE_ID below is sk-SK, and Angular throws NG0701 the moment anything
// formats a date in a locale whose data was never registered - which is every
// `| date` in the app, not just the Slovak ones. English is registered too so
// the fallback is real rather than assumed.
registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeSk, 'sk-SK');

export const BASE_PATH = new InjectionToken<string>('basePath');

/**
 * Whether this page load starts a sign-in by itself, before anything is drawn.
 *
 * Only when the IAM requires sign-in here and the reader is not signed in -
 * and never where that would go round in circles, the same rule the admin
 * panel's gate keeps: not while the library still holds a session this site's
 * API refuses (the IAM would hand the same tokens straight back), not after a
 * sign-in that has just come back without working (it is to be explained, not
 * repeated), not on the callback's own address, and not while maintenance mode
 * has the site closed (the closed sign says so; an admin signs in at /staff).
 * Nor while the site is not ready - a database update waiting, not set up, or
 * not answering: the page that says so is all there is to see, and it has its
 * own Sign in for an administrator. Without an IAM to go to there is nothing to
 * start. Whatever is not started here meets the sign-in card in the site's
 * shell, with the button on it.
 */
function mustSignInFirst(siteSettings: SiteSettingsService, security: SecurityService, siteStatus: SiteStatus): boolean {
  return (
    siteSettings.loginRequired() &&
    !siteSettings.maintenance() &&
    !siteStatus.blocked() &&
    !security.isLoggedIn() &&
    security.available() &&
    !security.holdsSession() &&
    !security.signInFailure() &&
    !/^\/auth(\/|$)/.test(location.pathname)
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const injector = inject(Injector);
      const configService = inject(ConfigService);
      const siteSettings = inject(SiteSettingsService);
      const auth = inject(AnotokiAuth);
      const securityService = inject(SecurityService);
      const siteStatus = inject(SiteStatus);

      return (async (): Promise<void> => {
        await configService.init();
        // Where the site stands - ready, or not set up, or a database update
        // waiting (@anotoki/lib/migrations) - asked beside the settings, so the
        // first page drawn is the right one: the gate in the root component
        // draws "The site is being updated" instead of the site, and an ADMIN
        // the way to the Migrations page. It never stops the boot: while an
        // update waits the API keeps the settings, the session and the strings
        // open, so everything below still runs and a sign-in still works.
        const status = siteStatus.check();
        // Before the session and before the strings: whether the site is open
        // at all is the first thing anything needs to know, and it is the one
        // answer that decides whether the rest is worth having. It is also
        // where the IAM's address comes from.
        await siteSettings.init();
        await status;
        // Before the router's first navigation (@anotoki/lib/auth,
        // shared/site-auth.ts): a sign-in coming back from the IAM is finished
        // here and the address it started from put back; a stored session is
        // restored, and follows the IAM - signed out there is signed out here,
        // at this page load. A visitor signed in at the IAM (its sign-in hint)
        // is signed in here with one silent hop: the page leaves for the IAM
        // and comes back, and this never resolves.
        await auth.init();
        // A sign-in that came back without one - refused at the IAM, cancelled
        // there, too slow - has been put back by the library where it started,
        // with nothing said. It is told at the callback's address instead,
        // before the router looks: the library's screen there says why, with
        // Try again and Back (to where it started). A silent hop that came
        // back without one is never a failure: the library says nothing of it.
        if (auth.signInFailure() && location.pathname !== AUTH_CALLBACK_PATH) {
          history.replaceState(null, '', AUTH_CALLBACK_PATH);
        }
        // This site's own record of whoever is signed in (/api/me), so the
        // first page is drawn for them.
        await securityService.init(siteSettings.auth());
        // Built only now, after the session: the theme is the signed-in
        // account's, which is known from here on, and the strings read the
        // address bar once to tell the site from the admin panel, which a
        // sign-in that has just come back has only now put right. Nothing else
        // asks for the theme until a page happens to need it, and a root
        // service is only built when something injects it - so ask here, or
        // the document loads with no theme at all and falls back to the system.
        injector.get(ThemeToggleService);
        // Last, because it needs to know where the API is and who is signed
        // in (@anotoki/lib/translations, shared/site-translations.ts). It
        // never rejects, and waits a second at most with words from the last
        // visit (three without), so a language server that is down delays the
        // start rather than stopping it.
        const i18n = injector.get(TranslationService);
        await i18n.init();
        // After the strings, so the IAM can be asked for its pages in the
        // language this reader would have read the site in: when the IAM wants
        // everybody signed in here, somebody who is not goes there before
        // anything is drawn, and comes back to the address they opened.
        if (mustSignInFirst(siteSettings, securityService, siteStatus)) {
          await securityService
            .login({ returnTo: location.pathname + location.search + location.hash })
            // The browser would not start it. The site's sign-in card is
            // drawn instead, and its button says why when pressed.
            .catch(() => undefined);
        }
      })();
    }),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // The site's status first: it hears an API answer saying the site is not
    // ready (503 update_pending or not_set_up) after the rest of the handling
    // of the request - its token, its one retry - is done. Then this site's
    // own (the base URL, the multipart override, the move's key), and last the
    // sign-in's (@anotoki/lib/auth): who each request of the API is, its token
    // or its visitor key.
    provideHttpClient(withInterceptors([siteStatusInterceptor, httpInterceptor, anotokiAuthInterceptor])),
    provideAnotokiMigrations(siteStatusConfig),
    // Signing in through the anotoki IAM (shared/site-auth.ts), and its
    // screens' words - the library's anotoki.signIn.*. Its IAM client notes
    // whether each sign-in was the hint's silent one (shared/silent-sign-in.ts):
    // the move of this browser's visitor into the account asks.
    provideAnotokiAuth(siteAuthConfig),
    { provide: ANOTOKI_AUTH_CLIENT_FACTORY, useValue: clientNotingSilentSignIns },
    // The site's words (shared/site-translations.ts), and the library kit's
    // own - its buttons and dialogs on the status and admin pages - in the
    // language on the page, from the same database (anotoki.*).
    provideAnotokiTranslations(siteTranslationsConfig),
    provideAnotokiUi(() => ({ ...inject(TranslationService).forKit() })),
    // The visitors' feedback form (shared/site-feedback.ts) and its words, the
    // library's anotoki.feedback.*; the form itself loads when it is opened.
    provideAnotokiFeedback(siteFeedbackConfig),
    // The admin tools' configuration (shared/site-admin-tools.ts) - here, where
    // the library's pages and the navigation's feedback count read it; the
    // pages themselves load with the admin panel's routes.
    provideAnotokiAdmin(siteAdminToolsConfig),
    {
      provide: BASE_PATH,
      useFactory: () => inject(ConfigService).backendUrl,
    },
    { provide: LOCALE_ID, useValue: "sk-SK" },
  ],
};
