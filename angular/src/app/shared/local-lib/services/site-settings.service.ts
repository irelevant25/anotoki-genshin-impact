import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PublicSiteSettings, SettingApiService } from '../../../api';

/**
 * The state of the site itself, as an admin last left it.
 *
 * Read once at start-up, before anything is drawn. It has to be first: the
 * first decision the page makes is whether to draw itself or a closed sign,
 * and that cannot be taken after it has drawn itself.
 *
 * Every getter has a default that means "carry on". A settings read that fails
 * - the API down, a network that dropped, a deployment where the table has not
 * been migrated yet - leaves the site open, signing in on, Google offered and
 * every section present. The alternative is a site that closes itself because
 * it could not ask whether it was open, which is the worst failure of the two:
 * the switches exist to be thrown deliberately.
 *
 * None of this is a security boundary. The API enforces the same switches for
 * itself - see meddleware/maintenance.php and refuseSignIn() - because a
 * closed sign drawn in a browser stops the people who were going to read the
 * page and nobody else.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly _api = inject(SettingApiService);

  private readonly _settings = signal<PublicSiteSettings | null>(null);

  /** Whether the site is closed to everybody but its admins. */
  readonly maintenance = computed(() => this._settings()?.maintenance ?? false);

  /** The closed sign, one message per language. */
  readonly maintenanceMessage = computed(() => this._settings()?.maintenance_message ?? {});

  /** Whether anybody who is not an admin may start a session. */
  readonly loginEnabled = computed(() => this._settings()?.login_enabled ?? true);

  /** Whether the Google button is offered at all. */
  readonly googleLoginEnabled = computed(() => this._settings()?.google_login_enabled ?? true);

  /** The bar across the top of the page, or null when there is nothing to say. */
  readonly announcement = computed(() => this._settings()?.announcement ?? null);

  private readonly _disabledRoutes = computed(() => this._settings()?.disabled_routes ?? []);

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

  /** Whether a top-level section of the site has been switched off. */
  routeDisabled(section: string): boolean {
    return this._disabledRoutes().includes(section);
  }
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
