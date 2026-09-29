import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { SecurityService } from '../../shared/local-lib/services/security.service';

/**
 * Who the admin panel is for: an ADMIN or an EDITOR of this site.
 *
 * Nobody signed in is sent to the IAM to sign in, and comes back to the address
 * they asked for. Somebody signed in with neither role is simply not matched,
 * and the router carries on to the route after this one, which tells them so
 * at the address they typed - rather than bouncing them somewhere that hides
 * what happened. The same page covers the moment before the IAM's sign-in page
 * loads.
 *
 * A `canMatch` rather than a `canActivate` for that fall-through, and because
 * a refused match never downloads the admin panel's code at all.
 *
 * This is the front end's half, and the smaller one: every admin endpoint
 * checks the role for itself. What this saves is a panel full of pages that
 * would all answer 403.
 */
export const adminAccessGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const security = inject(SecurityService);

  if (security.isStaff()) {
    return true;
  }

  // Only when the SDK holds no session either. With one, this site's API is
  // refusing the IAM's tokens, and a sign-in started from here would come
  // straight back to the same refusal and start another - a loop that mints a
  // code and tokens every round. The page this falls through to has the button.
  if (!security.isLoggedIn() && security.available() && !security.holdsSession()) {
    const router = inject(Router);
    const target = router.currentNavigation()?.extractedUrl;
    const returnTo = target ? router.serializeUrl(target) : `/${segments.map((segment) => segment.path).join('/')}`;

    // The page this falls through to offers the button again, should the
    // browser refuse to start the sign-in.
    security.login({ returnTo }).catch(() => undefined);
  }

  return false;
};
