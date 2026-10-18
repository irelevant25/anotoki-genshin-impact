import { Injectable, signal, computed, effect, PLATFORM_ID, inject, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AccountPreferences, type PreferenceSave } from '@anotoki/lib/auth';
import { LocalStorageService } from '../services/local-storage.service';

/** `auto` follows the operating system; the other two override it. */
export type Theme = 'light' | 'dark' | 'auto';

/** What actually gets put on the document. */
export type ResolvedTheme = 'light' | 'dark';

const THEMES: Theme[] = ['light', 'dark', 'auto'];

/** What a device that has never chosen shows: the site reads better light (users/003). */
const DEFAULT_THEME: Theme = 'light';

/** This device's theme: the last one shown, the account's or a visitor's own (under LocalStorageService's prefix - the Privacy page names it). */
export const THEME_STORAGE_KEY = 'theme';
const STORAGE_KEY = THEME_STORAGE_KEY;

/**
 * Where the theme was kept while the site and the admin panel had one each.
 * The site's is carried over once, as the device's one theme; the admin
 * panel's goes - the one theme is now the admin panel's too.
 */
const OLD_STORAGE_KEYS = { main: 'theme-main', admin: 'theme-admin' };

/**
 * Light, dark, or whatever the operating system says - one theme for the
 * whole site, the admin panel included.
 *
 * Signed in, it is the anotoki account's (AccountPreferences): one choice
 * every anotoki site follows, shown the moment it is known - at sign-in, and
 * whenever it changes, on another site or in another tab - and saved to the
 * account from the toggles here. Signed out, or from an IAM that keeps no
 * preferences, it is this device's, as it always was.
 *
 * A choice is shown at once, and saved after: one save at a time, the latest
 * choice last (AccountPreferences). A refused save puts the account's theme
 * back on the screen; the caller says why, in its own words. The theme shown
 * is always written to local storage, so the next load starts in it before
 * the account has been read.
 */
@Injectable({ providedIn: 'root' })
export class ThemeToggleService {
  private readonly _browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _storage = inject(LocalStorageService);
  private readonly _account = inject(AccountPreferences);

  /** Tracks the OS setting so `auto` can follow it while the page is open. */
  private readonly _systemPrefersDark = signal(false);

  /** What is chosen - the account's, or this device's - including `auto`. */
  readonly currentTheme = signal<Theme>(DEFAULT_THEME);

  /** What is actually showing. */
  readonly effectiveTheme = computed<ResolvedTheme>(() => {
    const chosen = this.currentTheme();
    if (chosen !== 'auto') {
      return chosen;
    }
    return this._systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDarkMode = computed(() => this.effectiveTheme() === 'dark');
  readonly isLightMode = computed(() => this.effectiveTheme() === 'light');

  constructor() {
    if (this._browser) {
      this._systemPrefersDark.set(this._query()?.matches ?? false);
      this._query()?.addEventListener('change', (event) => this._systemPrefersDark.set(event.matches));
      this.currentTheme.set(this._restore());

      // The account's theme, the moment it is known and whenever it changes.
      // Not while a choice made here is on its way: an answer to an earlier
      // save, or a token refreshed meanwhile, still says the theme the
      // account held before it, and the page would flick back.
      effect(() => {
        const theme = this._account.preferences()?.theme;
        if (theme && !this._account.saving('theme')) {
          untracked(() => this._show(theme));
        }
      });
    }

    effect(() => {
      const theme = this.effectiveTheme();
      if (this._browser) {
        this._apply(theme);
      }
    });
  }

  /**
   * The reader's choice: shown at once, and saved to their anotoki account
   * while they are signed in - every anotoki site follows it then. Resolves
   * with what became of the save; on a refusal the account's theme is back on
   * the screen, and the caller tells the reader.
   */
  setTheme(theme: Theme): Promise<PreferenceSave> {
    this._show(theme);
    return this._account.save('theme', theme).then((result) => {
      const kept = this._account.preferences()?.theme;
      if (result.outcome === 'refused' && kept) {
        this._show(kept);
      }
      return result;
    });
  }

  /** Flips to the opposite of what is on screen, which also leaves `auto`. */
  toggleTheme(): Promise<PreferenceSave> {
    return this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  // ── Wiring ──────────────────────────────────────────────────────────────────

  private _show(theme: Theme): void {
    this.currentTheme.set(theme);
    if (this._browser) {
      this._write(STORAGE_KEY, theme);
    }
  }

  /**
   * This device's theme. The first load after the site and the admin panel
   * stopped keeping one each carries the site's over, and forgets both.
   */
  private _restore(): Theme {
    const stored = this._read(STORAGE_KEY);
    if (stored) {
      return stored;
    }

    const carried = this._read(OLD_STORAGE_KEYS.main);
    try {
      this._storage.remove(OLD_STORAGE_KEYS.main);
      this._storage.remove(OLD_STORAGE_KEYS.admin);
    } catch {
      // Blocked storage: nothing was there to forget.
    }
    if (carried) {
      this._write(STORAGE_KEY, carried);
      return carried;
    }
    return DEFAULT_THEME;
  }

  private _read(key: string): Theme | null {
    try {
      const value = this._storage.read(key);
      return value && (THEMES as string[]).includes(value) ? (value as Theme) : null;
    } catch {
      // Private browsing and blocked storage.
      return null;
    }
  }

  private _write(key: string, theme: Theme): void {
    try {
      this._storage.write(key, theme);
    } catch {
      // Blocked storage: the theme still shows, it just will not survive a reload.
    }
  }

  private _query(): MediaQueryList | null {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  }

  private _apply(theme: ResolvedTheme): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
  }
}
