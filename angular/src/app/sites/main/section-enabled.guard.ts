import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';

/**
 * Whether a switched-off section of the site is allowed to match.
 *
 * A `canMatch` rather than a `canActivate` on purpose. A refused canActivate
 * has to send the visitor somewhere, which changes the address bar and tells
 * them that where they were going exists and was taken away. A refused
 * canMatch lets the router carry on down the list, which ends at the catch-all
 * and draws the not-found page at the address they typed - the same thing that
 * would happen if the section had never been written.
 *
 * That is presentation, not enforcement, and it is not pretending otherwise:
 * the API behind these pages is unchanged and still answers. Switching a
 * section off takes it off the menu and out of the router, which is what the
 * switch is for - a half-finished page that should not be found this week.
 * Maintenance mode is the one that actually closes things, and it is enforced
 * on the server.
 */
export const sectionEnabledGuard: CanMatchFn = (route: Route) => {
  const section = route.data?.['section'];

  if (typeof section !== 'string') {
    return true;
  }

  return !inject(SiteSettingsService).routeDisabled(section);
};
