import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';

/**
 * Whether a page an admin has switched off or restricted is allowed to match.
 *
 * A `canMatch` rather than a `canActivate` on purpose. A refused canActivate
 * has to send the visitor somewhere, which changes the address bar and tells
 * them that where they were going exists and was taken away. A refused
 * canMatch lets the router carry on down the list, which ends at the catch-all
 * and draws the not-found page at the address they typed - the same thing that
 * would happen if the page had never been written.
 *
 * It reads the whole remaining URL rather than the route's own path, so it
 * only has to sit on the handful of top-level entries and still decides for
 * every page underneath them: refusing /quizzes/music at the `quizzes` entry
 * takes that one page away and leaves the rest of the section alone, because
 * the rows are matched by full path.
 *
 * This is the front end's half. The API behind a page is unchanged unless its
 * row names the endpoints that belong to it - see meddleware/route_gate.php.
 */
export const routeAccessGuard: CanMatchFn = (_route: Route, segments: UrlSegment[]) => {
  const path = '/' + segments.map((segment) => segment.path).join('/');

  return inject(SiteSettingsService).mayNavigate(path);
};
