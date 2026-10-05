import { ApplicationConfig, inject, InjectionToken, Injector, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import localeEn from "@angular/common/locales/en";
import localeSk from "@angular/common/locales/sk";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ConfigService } from "./shared/local-lib/services/config.service";
import { SecurityService } from "./shared/local-lib/services/security.service";
import { SiteSettingsService } from "./shared/local-lib/services/site-settings.service";
import { httpInterceptor } from "./shared/local-lib/services/http.interceptor";
import { ThemeToggleService } from "./shared/local-lib/theme-toggle/theme-toggle.service";
import { TranslationService } from "./shared/local-lib/i18n/translation.service";

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
 * panel's gate keeps: not while the SDK still holds a session this site's API
 * refuses (the IAM would hand the same tokens straight back), not after a
 * sign-in that has just come back without working (it is to be explained, not
 * repeated), not on the callback's own address, and not while maintenance mode
 * has the site closed (the closed sign says so; an admin signs in at /staff).
 * Without an IAM to go to there is nothing to start. Whatever is not started
 * here meets the sign-in card in the site's shell, with the button on it.
 */
function mustSignInFirst(siteSettings: SiteSettingsService, security: SecurityService): boolean {
  return (
    siteSettings.loginRequired() &&
    !siteSettings.maintenance() &&
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
      const securityService = inject(SecurityService);

      return (async (): Promise<void> => {
        await configService.init();
        // Before the session and before the strings: whether the site is open
        // at all is the first thing anything needs to know, and it is the one
        // answer that decides whether the rest is worth having. It is also
        // where the IAM's address comes from.
        await siteSettings.init();
        // Before the router's first navigation: a sign-in coming back from the
        // IAM is finished here, and the address it started from put back.
        await securityService.init(siteSettings.auth());
        // Built only now, because both read the address bar once to tell the
        // site from the admin panel, and a sign-in that has just come back has
        // only now put the real address there. Nothing else asks for the theme
        // until a page happens to need it, and a root service is only built
        // when something injects it - so ask here, or the document loads with
        // no theme at all and falls back to the system.
        injector.get(ThemeToggleService);
        // Last, because it needs to know where the API is and who is signed
        // in. It never rejects, so a language server that is down delays the
        // start rather than stopping it.
        const i18n = injector.get(TranslationService);
        await i18n.init();
        // After the strings, so the IAM can be asked for its pages in the
        // language this reader would have read the site in: when the IAM wants
        // everybody signed in here, somebody who is not goes there before
        // anything is drawn, and comes back to the address they opened.
        if (mustSignInFirst(siteSettings, securityService)) {
          await securityService
            .login({ returnTo: location.pathname + location.search + location.hash, language: i18n.language() })
            // The browser would not start it. The site's sign-in card is
            // drawn instead, and its button says why when pressed.
            .catch(() => undefined);
        }
      })();
    }),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor])),
    {
      provide: BASE_PATH,
      useFactory: () => inject(ConfigService).backendUrl,
    },
    { provide: LOCALE_ID, useValue: "sk-SK" },
  ],
};