import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';
import { SecurityService } from '../services/security.service';

/** A language the site can be read in, as the API describes it. */
export interface SiteLanguage {
  code: string;
  name: string;
  /** The language as its own speakers write it - what a chooser should show. */
  native_name: string;
  enabled: boolean;
  sort_order: number;
}

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
 * The choice is written to local storage so it survives a reload whether or
 * not anyone is signed in, and to the account when there is one, so it follows
 * the reader to another browser. With no choice on record the browser's own
 * preference decides, which is the closest thing to a right answer for someone
 * arriving for the first time.
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
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _security = inject(SecurityService);

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

  /** What the signed-in account holds, if anyone is signed in. */
  private readonly _accountLanguage = signal<string | null>(null);
  private _signedIn = false;

  /** Keys already complained about, so one missing string is not a torrent. */
  private readonly _warned = new Set<string>();

  private readonly _area = signal<'main' | 'admin'>('main');

  constructor() {
    if (this._browser) {
      this._watchRoute();
      this._watchAccount();
    }

    effect(() => {
      // The admin panel is English whatever the site is set to, and saying
      // otherwise would mislead a screen reader.
      const code = this._area() === 'admin' ? FALLBACK_LANGUAGE : this.language();
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

  async setLanguage(code: string): Promise<void> {
    if (code === this.language() && this.ready()) {
      return;
    }

    // Only remember a switch that actually happened. If the strings could not
    // be fetched the page is still in the old language, and recording the new
    // one would mean reopening into a language nothing is written in.
    const switched = await this._loadBundle(code);
    if (!switched || !this._browser) {
      return;
    }

    this._storage.write(LANGUAGE_KEY, code);
    this._save(code);
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

  private async _loadFromServer(): Promise<void> {
    try {
      const languages = await firstValueFrom(this._http.get<SiteLanguage[]>('/api/languages'));
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
      const bundle = await firstValueFrom(
        this._http.get<{ language: string; values: Record<string, string> }>(`/api/translations/${code}`),
      );
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

  /** Signing in adopts the account's language; signing out leaves it as it is. */
  private _watchAccount(): void {
    this._security.currentUserData$.subscribe((user) => {
      this._signedIn = !!user;
      const code = user?.language ?? null;
      this._accountLanguage.set(code);

      if (!code || code === this.language()) {
        return;
      }
      // Only once the language list has arrived, or there is no way to tell
      // whether the account is asking for something that still exists.
      if (this._languages().some((language) => language.code === code && language.enabled)) {
        this._storage.write(LANGUAGE_KEY, code);
        void this._loadBundle(code);
      }
    });
  }

  /** Persists to the account, when there is one. Local storage already has it. */
  private _save(code: string): void {
    if (!this._signedIn) {
      return;
    }
    this._http.put('/api/auth/language', { language: code }).subscribe({
      // A failed save is not worth interrupting anyone over: the choice still
      // applies here and is remembered on this device.
      error: () => undefined,
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
