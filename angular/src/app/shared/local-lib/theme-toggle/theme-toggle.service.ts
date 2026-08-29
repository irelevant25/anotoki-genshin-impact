import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LocalStorageService } from '../services/local-storage.service';
import { SecurityService } from '../services/security.service';

/** `auto` follows the operating system; the other two override it. */
export type Theme = 'light' | 'dark' | 'auto';

/** What actually gets put on the document. */
export type ResolvedTheme = 'light' | 'dark';

/** The site and the admin panel are remembered separately. */
export type ThemeArea = 'main' | 'admin';

const THEMES: Theme[] = ['light', 'dark', 'auto'];
const STORAGE_KEY: Record<ThemeArea, string> = {
  main: 'theme-main',
  admin: 'theme-admin',
};

/**
 * Owns the light/dark choice for both sites.
 *
 * The two areas look nothing alike, so they keep separate preferences: reading
 * the site in light while working in a dark admin is a reasonable thing to
 * want. Which one is in force follows the URL, so navigating into `/admin`
 * switches the theme with it.
 *
 * A choice is always written to local storage, so it survives a reload whether
 * or not anyone is signed in. When someone *is* signed in it also goes to
 * their account, so it follows them to another browser; signing in adopts what
 * the account already holds.
 *
 * Until a choice is made the answer is `auto`, which is whatever the operating
 * system asks for.
 */
@Injectable({ providedIn: 'root' })
export class ThemeToggleService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _browser = isPlatformBrowser(this._platformId);
  private readonly _storage = inject(LocalStorageService);
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _security = inject(SecurityService);

  /** Which area the current URL belongs to. */
  readonly area = signal<ThemeArea>('main');

  private readonly _preferences = signal<Record<ThemeArea, Theme>>({ main: 'auto', admin: 'auto' });
  /** Tracks the OS setting so `auto` can follow it while the page is open. */
  private readonly _systemPrefersDark = signal(false);
  /** Whether there is an account to save the choice to. */
  private _signedIn = false;

  /** What the user picked for the area they are in. */
  readonly currentTheme = computed<Theme>(() => this._preferences()[this.area()]);

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
      this._restore();
      this._watchSystem();
      this._watchRoute();
      this._watchAccount();
    }

    effect(() => {
      const theme = this.effectiveTheme();
      if (this._browser) {
        this._apply(theme);
      }
    });
  }

  /** Sets the theme for the area currently in view. */
  setTheme(theme: Theme): void {
    this.setThemeFor(this.area(), theme);
  }

  setThemeFor(area: ThemeArea, theme: Theme): void {
    this._preferences.update((current) => ({ ...current, [area]: theme }));
    if (!this._browser) {
      return;
    }
    this._storage.write(STORAGE_KEY[area], theme);
    this._save(area, theme);
  }

  /** Flips to the opposite of what is on screen, which also leaves `auto`. */
  toggleTheme(): void {
    this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  // ── Wiring ──────────────────────────────────────────────────────────────────

  private _restore(): void {
    this._systemPrefersDark.set(this._query()?.matches ?? false);
    this.area.set(this._areaFor(this._router.url));

    const stored: Record<ThemeArea, Theme> = { main: 'auto', admin: 'auto' };
    for (const area of ['main', 'admin'] as ThemeArea[]) {
      const saved = this._read(STORAGE_KEY[area]);
      if (saved) {
        stored[area] = saved;
      }
    }
    this._preferences.set(stored);
  }

  private _watchRoute(): void {
    this._router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.area.set(this._areaFor(event.urlAfterRedirects));
    });
  }

  /** Signing in adopts the account's choice; signing out falls back to storage. */
  private _watchAccount(): void {
    this._security.currentUserData$.subscribe((user) => {
      this._signedIn = !!user;
      if (!user) {
        this._restorePreferencesFromStorage();
        return;
      }
      const fromAccount: Partial<Record<ThemeArea, Theme>> = {};
      if (this._valid(user.theme_main)) {
        fromAccount.main = user.theme_main as Theme;
      }
      if (this._valid(user.theme_admin)) {
        fromAccount.admin = user.theme_admin as Theme;
      }
      if (Object.keys(fromAccount).length) {
        this._preferences.update((current) => ({ ...current, ...fromAccount }));
        // Mirror it locally so the next load is right before /me answers.
        for (const [area, theme] of Object.entries(fromAccount) as [ThemeArea, Theme][]) {
          this._storage.write(STORAGE_KEY[area], theme);
        }
      }
    });
  }

  private _restorePreferencesFromStorage(): void {
    this._preferences.set({
      main: this._read(STORAGE_KEY.main) ?? 'auto',
      admin: this._read(STORAGE_KEY.admin) ?? 'auto',
    });
  }

  /** Persists to the account, when there is one. Local storage already has it. */
  private _save(area: ThemeArea, theme: Theme): void {
    if (!this._signedIn) {
      return;
    }
    this._http.put('/api/auth/theme', { area, theme }).subscribe({
      // A failed save is not worth interrupting anyone: the choice still
      // applies here and is remembered locally.
      error: () => undefined,
    });
  }

  private _areaFor(url: string): ThemeArea {
    return url.startsWith('/admin') ? 'admin' : 'main';
  }

  private _valid(value: string | undefined | null): boolean {
    return !!value && (THEMES as string[]).includes(value);
  }

  private _read(key: string): Theme | null {
    try {
      const value = this._storage.read(key);
      return this._valid(value) ? (value as Theme) : null;
    } catch {
      // Private browsing and blocked storage.
      return null;
    }
  }

  private _watchSystem(): void {
    this._query()?.addEventListener('change', (event) => this._systemPrefersDark.set(event.matches));
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
