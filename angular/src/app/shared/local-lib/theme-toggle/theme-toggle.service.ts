import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** `auto` follows the operating system; the other two override it. */
export type Theme = 'light' | 'dark' | 'auto';

/** What actually gets put on the document. */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'preferred-theme';
const THEMES: Theme[] = ['light', 'dark', 'auto'];

/**
 * Owns the light/dark choice for both sites.
 *
 * The preference is one of three values; what lands on `<html data-theme>` is
 * always resolved to light or dark, so the stylesheet only ever deals with two.
 * Nothing is chosen by default: a first-time visitor gets whatever their system
 * asks for, and the choice is remembered once they make one.
 */
@Injectable({ providedIn: 'root' })
export class ThemeToggleService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _browser = isPlatformBrowser(this._platformId);

  /** What the user picked, `auto` until they pick something. */
  readonly currentTheme = signal<Theme>('auto');
  /** Tracks the OS setting so `auto` can follow it while the page is open. */
  private readonly _systemPrefersDark = signal(false);

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
    }

    effect(() => {
      const theme = this.effectiveTheme();
      if (this._browser) {
        this._apply(theme);
      }
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    if (!this._browser) {
      return;
    }
    try {
      if (theme === 'auto') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch {
      // Private browsing and blocked storage: the choice just will not persist.
    }
  }

  /** Flips to the opposite of what is on screen, which also leaves `auto`. */
  toggleTheme(): void {
    this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  private _restore(): void {
    this._systemPrefersDark.set(this._query()?.matches ?? false);
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved && (THEMES as string[]).includes(saved)) {
      this.currentTheme.set(saved as Theme);
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
