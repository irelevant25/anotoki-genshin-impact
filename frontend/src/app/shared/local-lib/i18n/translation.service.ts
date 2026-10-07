import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';
import { AccountPreferences, PreferenceSave } from '../services/account-preferences.service';
import { Language, LanguageApiService, TranslationApiService } from '../../../api';

/**
 * A language the site can be read in.
 *
 * The `languages` row itself, under the name this service has always used
 * for it. `native_name` is the language as its own speakers write it, which
 * is what a chooser should show.
 */
export type SiteLanguage = Language;

/**
 * What everything falls back to. The server merges English underneath every
 * bundle, so a half-translated language still renders a complete page.
 */
export const FALLBACK_LANGUAGE = 'en';

const LANGUAGE_KEY = 'language';
const CACHE_KEY = 'language-cache';

interface CachedBundle {
  language: string;
  values: Record<string, string>;
  languages: SiteLanguage[];
}

/**
 * Owns which language the site is read in, and holds the strings for it.
 *
 * The site only. The admin panel is English, so nothing there asks for a
 * translation and no preference is kept for it.
 *
 * Signed in, the language is the anotoki account's - the IAM's `locale`, one
 * language every anotoki site follows - whenever this site has it; and the
 * chooser saves the reader's choice to the account (AccountPreferences). A
 * language the IAM does not offer stays this site's own choice, for the
 * visit. Signed out, or from an IAM that keeps no preferences, the choice is
 * this device's. Either way it is written to local storage, and with no choice
 * on record the browser's own preference decides, which is the closest thing
 * to a right answer for someone arriving for the first time.
 *
 * Strings are cached from the last visit and painted immediately, then
 * refreshed behind the page. Only a genuine first visit waits on the network,
 * because that is the only time there is nothing to show.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _browser = isPlatformBrowser(this._platformId);
  private readonly _storage = inject(LocalStorageService);
  private readonly _languageApi = inject(LanguageApiService);
  private readonly _translationApi = inject(TranslationApiService);
  private readonly _router = inject(Router);
  private readonly _account = inject(AccountPreferences);

  /** The language in force. */
  readonly language = signal<string>(FALLBACK_LANGUAGE);

  private readonly _languages = signal<SiteLanguage[]>([]);
  /** Everything on offer in the chooser, in the order the admin panel set. */
  readonly languages = computed(() =>
    [...this._languages()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
  );

  private readonly _values = signal<Record<string, string>>({});
  /** True once there are strings to show, from the cache or from the server. */
  readonly ready = computed(() => Object.keys(this._values()).length > 0);

  /** The account's language, while the account's choices apply - see AccountPreferences. */
  private readonly _accountLanguage = this._account.language;

  /** Keys already complained about, so one missing string is not a torrent. */
  private readonly _warned = new Set<string>();

  private readonly _area = signal<'main' | 'admin'>('main');

  /**
   * The language the page in view is written in: the site's, but English in
   * the admin panel whatever the site is set to. What a clock's "am" and "pm"
   * are written in (DateFormatService).
   */
  readonly pageLanguage = computed(() => (this._area() === 'admin' ? FALLBACK_LANGUAGE : this.language()));

  constructor() {
    if (this._browser) {
      this._watchRoute();
      this._watchAccount();
    }

    effect(() => {
      // Saying otherwise than the page does would mislead a screen reader.
      const code = this.pageLanguage();
      if (this._browser) {
        document.documentElement.lang = code;
      }
    });
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  /**
   * The string for a key, with `{placeholders}` filled in.
   *
   * An unknown key comes back as itself. That is deliberately visible: it
   * reads as a mistake in the page rather than disappearing into a blank.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = this._values()[key];

    if (value === undefined) {
      if (!this._warned.has(key)) {
        this._warned.add(key);
        console.warn(`[i18n] no string for '${key}'`);
      }
      return key;
    }

    if (!params) {
      return value;
    }
    return value.replace(/\{(\w+)\}/g, (whole, name: string) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole,
    );
  }

  /** Whether a key has a string, for callers that want to fall back themselves. */
  has(key: string): boolean {
    return this._values()[key] !== undefined;
  }

  // ── Choosing ───────────────────────────────────────────────────────────────

  /**
   * The reader's choice: in force once its strings are here, then saved to
   * their anotoki account while they are signed in (AccountPreferences) - or
   * this device's alone. Resolves with what became of the save, null when
   * nothing switched. A refusal leaves the page in the chosen language for
   * the visit; `invalid_request` means the IAM does not offer it, and then it
   * simply stays this site's own choice.
   */
  async setLanguage(code: string): Promise<PreferenceSave | null> {
    if (code === this.language() && this.ready()) {
      return null;
    }

    // Only remember a switch that actually happened. If the strings could not
    // be fetched the page is still in the old language, and recording the new
    // one would mean reopening into a language nothing is written in.
    const switched = await this._loadBundle(code);
    if (!switched || !this._browser) {
      return null;
    }

    this._storage.write(LANGUAGE_KEY, code);
    return this._account.save('language', code);
  }

  // ── Startup ────────────────────────────────────────────────────────────────

  /**
   * Called from the app initializer, after the config knows where the API is.
   * It never rejects: a site that cannot reach the API still has to render.
   */
  async init(): Promise<void> {
    if (!this._browser) {
      return;
    }

    const cached = this._readCache();
    if (cached) {
      this.language.set(cached.language);
      this._values.set(cached.values);
      this._languages.set(cached.languages);
    }

    const refresh = this._loadFromServer();

    // With nothing cached there is nothing to paint, so a first visit waits.
    // Afterwards the cache carries the page while this finishes behind it.
    if (!cached) {
      await refresh;
    }
  }

  /**
   * The languages and the strings again, from the server - once a database
   * update has brought new ones (the admin Migrations page's Apply). The page
   * keeps showing what it has meanwhile; it never rejects.
   */
  async reload(): Promise<void> {
    if (this._browser) {
      await this._loadFromServer();
    }
  }

  private async _loadFromServer(): Promise<void> {
    try {
      const languages = await firstValueFrom(this._languageApi.getLanguages());
      this._languages.set(languages);
      await this._loadBundle(this._resolve(languages));
    } catch {
      // Offline, or the API is down. The cache - or failing that the keys
      // themselves - is better than a blank page, so this is not fatal.
    }
  }

  /** True when the strings for `code` are now in force. */
  private async _loadBundle(code: string): Promise<boolean> {
    try {
      const bundle = await firstValueFrom(this._translationApi.getTranslations(code));
      // The server has the last word on which language answered: asking for
      // one that has been retired gets the fallback back instead.
      this.language.set(bundle.language);
      this._values.set(bundle.values);
      this._writeCache();
      return true;
    } catch {
      // Keep whatever is already showing rather than emptying the page.
      return false;
    }
  }

  /**
   * Which language to open in: what the account holds, else what was chosen on
   * this device, else what the browser asks for, else English.
   */
  private _resolve(languages: SiteLanguage[]): string {
    const available = languages.filter((language) => language.enabled).map((language) => language.code);
    const known = (code: string | null | undefined): code is string => !!code && available.includes(code);

    if (known(this._accountLanguage())) {
      return this._accountLanguage()!;
    }

    const stored = this._read(LANGUAGE_KEY);
    if (known(stored)) {
      return stored;
    }

    for (const preference of this._browserPreferences()) {
      if (known(preference)) {
        return preference;
      }
    }

    return known(FALLBACK_LANGUAGE) ? FALLBACK_LANGUAGE : (available[0] ?? FALLBACK_LANGUAGE);
  }

  /**
   * The browser's languages, most wanted first, each followed by its base:
   * `sk-SK` also counts as a request for `sk`.
   */
  private _browserPreferences(): string[] {
    const raw = navigator.languages?.length ? navigator.languages : [navigator.language];
    const codes: string[] = [];

    for (const entry of raw) {
      if (!entry) {
        continue;
      }
      const lower = entry.toLowerCase();
      codes.push(lower);
      const base = lower.split('-')[0];
      if (base && base !== lower) {
        codes.push(base);
      }
    }
    return codes;
  }

  // ── Wiring ─────────────────────────────────────────────────────────────────

  private _watchRoute(): void {
    this._area.set(this._areaFor(typeof location !== 'undefined' ? location.pathname : this._router.url));
    this._router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this._area.set(this._areaFor(event.urlAfterRedirects)));
  }

  private _areaFor(url: string): 'main' | 'admin' {
    return url.startsWith('/admin') ? 'admin' : 'main';
  }

  /**
   * The account's language, whenever it changes while the page is open: a
   * sign-in, here or in another tab, or a language chosen on another anotoki
   * site or in another tab. Signing out leaves the language as it is.
   *
   * At start-up _resolve() has already read the account's language, so the
   * first run only notes it. Only the account's language is followed - never
   * re-read because something else moved - so a language the IAM refused
   * stays the page's for the visit. And not while a choice made here is on its
   * way: an answer to an earlier save still names the language before it.
   */
  private _watchAccount(): void {
    let started = false;

    effect(() => {
      const code = this._accountLanguage();

      if (!started) {
        started = true;
        return;
      }

      untracked(() => {
        if (!code || code === this.language() || this._account.saving('language')) {
          return;
        }
        // Only once the language list has arrived, or there is no way to tell
        // whether the account is asking for something this site has.
        if (this._languages().some((language) => language.code === code && language.enabled)) {
          this._storage.write(LANGUAGE_KEY, code);
          void this._loadBundle(code);
        }
      });
    });
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  private _readCache(): CachedBundle | null {
    try {
      const raw = this._storage.read(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as CachedBundle;
      if (!parsed?.language || !parsed.values || !Array.isArray(parsed.languages)) {
        return null;
      }
      return parsed;
    } catch {
      // Private browsing, blocked storage, or a cache written by an older
      // shape of this code. Either way, load from the server instead.
      return null;
    }
  }

  private _writeCache(): void {
    try {
      this._storage.write(
        CACHE_KEY,
        JSON.stringify({ language: this.language(), values: this._values(), languages: this._languages() }),
      );
    } catch {
      // A full or unavailable quota costs a slower next start, nothing more.
    }
  }

  private _read(key: string): string | null {
    try {
      return this._storage.read(key);
    } catch {
      return null;
    }
  }
}
