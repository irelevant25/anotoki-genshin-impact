import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnotokiAuth } from '@anotoki/lib/auth';
import { PublicSiteSettings, SettingApiService } from '../../../api';

/**
 * What the site is told before anybody has signed in (GET /api/settings/public):
 * where its sign-in lives - the anotoki IAM's address and this site's client id
 * there, its account page and admin console - and whether the server keeps a
 * visitor's games, for how long.
 *
 * Read once at start-up, before the session: where the IAM is comes from here.
 * Every getter has a default that means "carry on": a read that fails - the API
 * down, a network that dropped - leaves the site without a sign-in button and
 * keeps a visitor's games in the browser, as it always did. A site that is not
 * set up, or not answering, is not this service's to tell: the API says so to
 * every request, and the root component's gate draws the page saying it
 * (@anotoki/lib/migrations). While a database update waits this is still
 * read - the API keeps it open, so a sign-in can still start.
 *
 * The switches an admin throws without a deploy - the site closed for
 * maintenance, the announcement, who sees each page - were read here too until
 * anotoki-lib 0.11.0 made genshin's own the family's: they are the library's
 * site settings now (@anotoki/lib/site-settings's SiteSettings, from
 * GET /api/site-settings, app.config.ts).
 */
@Injectable({ providedIn: 'root' })
export class PublicSettingsService {
  private readonly _api = inject(SettingApiService);
  private readonly _auth = inject(AnotokiAuth);

  private readonly _settings = signal<PublicSiteSettings | null>(null);

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

  /**
   * Asked for once, from the app initializer, and never allowed to reject:
   * a site that will not start because its settings could not be read is a
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
      // reads as "carry on".
    }
  }
}
