import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeToggleService {
  private readonly _platformId = inject(PLATFORM_ID);
  THEME_STORAGE_KEY = 'preferred-theme';

  // Signal to track current theme
  currentTheme = signal<Theme>('light');

  // Computed signal for the effective theme
  effectiveTheme = signal<Theme>('light');

  constructor() {
    // Initialize theme on service creation
    if (isPlatformBrowser(this._platformId)) {
      this.initializeTheme();
      // this.setupMediaQueryListener();
    }

    // Effect to apply theme changes to DOM
    effect(() => {
      if (isPlatformBrowser(this._platformId)) {
        this.applyThemeToDOM(this.effectiveTheme());
      }
    });
  }

  /**
   * Set the theme preference
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);

    if (isPlatformBrowser(this._platformId)) {
      // Save to localStorage
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);

      // Update effective theme
      this.updateEffectiveTheme();
    }
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const current = this.currentTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
    // if (current === 'auto') {
    //   // If auto, switch to opposite of current system preference
    //   const systemDark = this.getSystemPreference();
    //   this.setTheme(systemDark ? 'light' : 'dark');
    // } else {
    //   this.setTheme(current === 'light' ? 'dark' : 'light');
    // }
  }

  /**
   * Get the current system color scheme preference
   */
  // private getSystemPreference(): boolean {
  //   if (!isPlatformBrowser(this._platformId)) {
  //     return false;
  //   }
  //   return window.matchMedia('(prefers-color-scheme: dark)').matches;
  // }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;

    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    }

    this.updateEffectiveTheme();
  }

  /**
   * Update the effective theme based on current theme setting
   */
  private updateEffectiveTheme(): void {
    const current = this.currentTheme();
    this.effectiveTheme.set(current);
    // if (current === 'auto') {
    //   this.effectiveTheme.set(this.getSystemPreference() ? 'dark' : 'light');
    // } else {
    //   this.effectiveTheme.set(current);
    // }
  }

  /**
   * Apply theme to DOM by setting data-theme attribute
   */
  private applyThemeToDOM(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);

    // Optional: Also add a CSS class for additional styling hooks
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
  }

  /**
   * Setup listener for system theme changes
   */
  // private setupMediaQueryListener(): void {
  //   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  //   mediaQuery.addEventListener('change', (e) => {
  //     // Only update if current theme is 'auto'
  //     if (this.currentTheme() === 'auto') {
  //       this.effectiveTheme.set(e.matches ? 'dark' : 'light');
  //     }
  //   });
  // }

  /**
   * Check if dark mode is currently active
   */
  isDarkMode(): boolean {
    return this.effectiveTheme() === 'dark';
  }

  /**
   * Check if light mode is currently active
   */
  isLightMode(): boolean {
    return this.effectiveTheme() === 'light';
  }
}
