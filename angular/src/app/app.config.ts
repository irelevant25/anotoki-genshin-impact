import { ApplicationConfig, inject, InjectionToken, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from "@angular/core";
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      const siteSettings = inject(SiteSettingsService);
      const securityService = inject(SecurityService);
      // Nothing else asks for the theme until a page happens to need it, and a
      // root service is only built when something injects it - so ask here, or
      // the document loads with no theme at all and falls back to the system.
      inject(ThemeToggleService);
      const translationService = inject(TranslationService);

      return (async (): Promise<void> => {
        await configService.init();
        // Before the session and before the strings: whether the site is open
        // at all is the first thing anything needs to know, and it is the one
        // answer that decides whether the rest is worth having.
        await siteSettings.init();
        await securityService.init();
        // Last, because it needs to know where the API is and who is signed
        // in. It never rejects, so a language server that is down delays the
        // start rather than stopping it.
        await translationService.init();
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