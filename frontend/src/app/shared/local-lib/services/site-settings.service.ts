import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnotokiAuth } from '@anotoki/lib/auth';
import { PublicSiteRoute, PublicSiteSettings, SettingApiService } from '../../../api';
import { SecurityService } from './security.service';

/** Visibility levels, most open first. Mirrors ROUTE_VISIBILITY in the API. */
export type RouteVisibility = 'PUBLIC' | 'USER' | 'EDITOR' | 'ADMIN';

/** Why a page is not the ordinary public page, for the bar an admin sees on it. */
export type RouteNotice = { kind: 'blocked' } | { kind: 'restricted'; visibility: RouteVisibility } | null;

/**
 * The state of the site itself, as an admin last left it.
 *
 * Read once at start-up, before anything is drawn. It has to be first: the
 * first decision the page makes is whether to draw itself or a closed sign,
 * and that cannot be taken after it has drawn itself.
 *
 * Every getter has a default that means "carry on". A settings read that fails
 * - the API down, a network that dropped, a deployment where the table has not
 * been migrated yet - leaves the site open and every page present. The
 * alternative is a site that closes itself because it could not ask whether it
 * was open, which is the worse failure of the two: the switches exist to be
 * thrown deliberately. (It also leaves the site without a sign-in button, since
 * where the IAM is arrives in the same answer - see `auth`.) A site that is not
 * set up, or not answering, is not this service's to tell: the API says so to
 * every request, and the root component's gate draws the page saying it
 * (@anotoki/lib/migrations). While a database update waits these settings are
 * still read - the API keeps them open, so a sign-in can still start.
 *
 * None of this is a security boundary. The API enforces the same switches for
 * itself - see meddleware/maintenance.php, sign_in.php and route_gate.php -
 * because a closed sign drawn in a browser stops the people who were going to
 * read the page and nobody else.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly _api = inject(SettingApiService);
  private readonly _security = inject(SecurityService);
  private readonly _auth = inject(AnotokiAuth);

  private readonly _settings = signal<PublicSiteSettings | null>(null);

  /**
   * The role of whoever is reading, or '' for nobody.
   *
   * Followed rather than read once: a sign-out in another tab has to take the
   * pages an account could see back out of the menu without a reload.
   */
  private readonly _role = this._security.role;

  /** Whether the site is closed to everybody but its admins. */
  readonly maintenance = computed(() => this._settings()?.maintenance ?? false);

  /** The closed sign, one message per language. */
  readonly maintenanceMessage = computed(() => this._settings()?.maintenance_message ?? {});

  /**
   * Where this site signs people in: the anotoki IAM's address and this site's
   * client id there, plus its account page and admin console. Null only when
   * the settings could not be read.
   */
  readonly auth = computed(() => this._settings()?.auth ?? null);

  /**
   * Whether the IAM wants everybody signed in before they use this site - its
   * switch, per site, which the API reads and relays in `auth` so the page
   * never asks the IAM itself.
   *
   * The sign-in's own answer (@anotoki/lib/auth, from `auth` at boot), which
   * fails closed, unlike every other getter here: true unless the server said
   * false - so true when the settings could not be read - and true from the
   * moment a visitor's request is refused `sign_in_required` (the switch turned
   * on since the page loaded: the shell then draws the sign-in card, and a
   * visitor's key stops being sent - it is kept, not forgotten).
   */
  readonly loginRequired = this._auth.loginRequired;

  /**
   * Whether the server keeps a visitor's games - somebody playing without
   * signing in - under a visitor of its own (api/visitors.php): false until
   * the database update that makes visitors (users/045) is applied, and when
   * the settings could not be read. The browser then keeps their games, as it
   * always did. Whether visitors are welcome at all is `loginRequired`.
   */
  readonly visitorsAvailable = computed(() => this._settings()?.visitors?.available ?? false);

  /** Days the server keeps a visitor's games after their last visit - its number, so the notice never disagrees with the sweep. */
  readonly visitorKeepDays = computed(() => this._settings()?.visitors?.keep_days ?? 30);

  /** The bar across the top of the page, or null when there is nothing to say. */
  readonly announcement = computed(() => this._settings()?.announcement ?? null);

  /** Every governed page. A page with no row here is ungoverned, so public. */
  readonly routes = computed<PublicSiteRoute[]>(() => this._settings()?.routes ?? []);

  /** Whether the reader is exempt from all of it. */
  readonly isAdmin = computed(() => this._role() === 'ADMIN');

  /**
   * Asked for once, from the app initializer, and never allowed to reject.
   *
   * A site that will not start because its settings could not be read is a
   * site that has made its own configuration a single point of failure.
   */
  async init(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this._settings.set(await firstValueFrom(this._api.getPublicSettings()));
    } catch {
      // Left as it was - null on the first read, which every getter above
      // reads as "nothing is switched off".
    }
  }

  /**
   * The row governing a URL, or null when nothing governs it.
   *
   * Nothing under /auth/ is ever governed, whatever a row says - the API
   * refuses to store the callback's path, and a pattern row such as
   * '/auth/:step' must not get round that. It is where the IAM hands somebody
   * back after signing in, and a switched-off callback would leave them signed
   * in at the IAM and unable to arrive here.
   */
  routeFor(path: string): PublicSiteRoute | null {
    if (/^\/auth(\/|$)/.test(path)) {
      return null;
    }

    return this.routes().find((route) => routeMatchesPath(route.path, path)) ?? null;
  }

  /**
   * Whether this reader may have the page at the given URL.
   *
   * An admin may have everything, which is what makes the switches usable:
   * whoever switched a page off has to be able to look at it, and whoever
   * restricted one has to be able to check what they did.
   */
  mayNavigate(path: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    const route = this.routeFor(path);

    if (!route) {
      return true;
    }

    return !route.blocked && this.maySee(route.visibility as RouteVisibility);
  }

  /** Whether the reader is one of the kinds a visibility level admits. */
  maySee(visibility: RouteVisibility): boolean {
    switch (visibility) {
      case 'PUBLIC':
        return true;
      case 'USER':
        return this._role() !== '';
      case 'EDITOR':
        return this._role() === 'EDITOR' || this._role() === 'ADMIN';
      case 'ADMIN':
        return this._role() === 'ADMIN';
      default:
        // A level nothing understands is treated as the strictest rather than
        // the most open, the same way the API treats it.
        return this._role() === 'ADMIN';
    }
  }

  /**
   * What to tell an admin about the page they are on, or null for nothing.
   *
   * Only ever for an admin. Everybody else is not on the page: they got a page
   * that is not there, or the link was never in their menu. An admin sees the
   * site as it is, which means a page that is off looks exactly like a page
   * that is on unless something says otherwise - and this is that something.
   */
  noticeFor(path: string): RouteNotice {
    if (!this.isAdmin()) {
      return null;
    }

    const route = this.routeFor(path);

    if (!route) {
      return null;
    }

    if (route.blocked) {
      return { kind: 'blocked' };
    }

    return route.visibility === 'PUBLIC' ? null : { kind: 'restricted', visibility: route.visibility as RouteVisibility };
  }
}

/**
 * Whether a stored path matches a URL.
 *
 * A ':id' segment stands for any one segment, which is how the router writes
 * it and the only pattern this needs. Segment counts have to match, so
 * '/database/characters' does not match '/database/characters/5': those are
 * two rows and two decisions. Kept in step with routeMatchesPath() in
 * api/site_routes.php, which decides the same thing for the API.
 */
export function routeMatchesPath(pattern: string, path: string): boolean {
  const left = pattern.replace(/^\/+|\/+$/g, '').split('/');
  const right = path.replace(/^\/+|\/+$/g, '').split('/');

  if (left.length !== right.length) {
    return false;
  }

  return left.every((segment, index) => segment.startsWith(':') || segment === right[index]);
}

/**
 * One message out of a per-language map.
 *
 * English is the fallback for the same reason it is everywhere else here: it
 * is the language every other one falls back to, and a message that only got
 * written in one of them should still be readable rather than absent. An empty
 * string counts as unwritten - a language somebody cleared out is a language
 * they did not translate it into, not one they translated it into as nothing.
 */
export function messageInLanguage(message: Record<string, string> | null | undefined, language: string): string {
  if (!message) {
    return '';
  }

  return (message[language] || message['en'] || '').trim();
}
