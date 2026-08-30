import { ApplicationConfig, inject, InjectionToken, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ConfigService } from "./shared/local-lib/services/config.service";
import { SecurityService } from "./shared/local-lib/services/security.service";
import { httpInterceptor } from "./shared/local-lib/services/http.interceptor";
import { ThemeToggleService } from "./shared/local-lib/theme-toggle/theme-toggle.service";

// export const appConfig: ApplicationConfig = {
// providers: [provideRouter(routes, withHashLocation()), provideHttpClient()],
// providers: [provideRouter(routes), provideHttpClient()],
// };

export const BASE_PATH = new InjectionToken<string>('basePath');

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      const securityService = inject(SecurityService);
      // Nothing else asks for the theme until a page happens to need it, and a
      // root service is only built when something injects it - so ask here, or
      // the document loads with no theme at all and falls back to the system.
      inject(ThemeToggleService);

      return (async (): Promise<void> => {
        await configService.init();
        await securityService.init();
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