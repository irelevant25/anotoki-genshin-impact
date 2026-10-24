import { Injectable, inject, signal } from '@angular/core';
import type { ThemeService } from '@anotoki/lib/shell';
import { Theme, ThemeToggleService } from './theme-toggle.service';

/**
 * The shell's ThemeService (@anotoki/lib/shell) as genshin gives it: what the family's three-way switch,
 * `<anotoki-theme-toggle>`, reads and sets - light, dark, or as the device is set - is genshin's one theme,
 * ThemeToggleService: the anotoki account's while somebody is signed in, this device's otherwise, the very theme the
 * Account window chooses. The admin panel's frame (anotoki-lib 0.10.0) carries the switch, and the panel provides this
 * in ThemeService's place (sites/admin/app.component.ts).
 *
 * Not provideAnotokiShell()'s theme, which runs the shell's own ThemeService: genshin's would then have to go - two
 * theme services never run in one site - and the public site would change in two ways nobody asked for. A device that
 * never chose would be shown as the device is set, where genshin shows it light (users/003); and "as the device is set"
 * would be kept by taking the stored theme away, where genshin keeps it as `auto`. So the switch talks to genshin's
 * service through the shell's API - `mode`, `resolved`, `refused`, `set`, `dismissRefusal` - and one theme service runs.
 */
@Injectable({ providedIn: 'root' })
export class SiteShellTheme implements Pick<ThemeService, 'mode' | 'resolved' | 'refused' | 'set' | 'dismissRefusal'> {
  private readonly _theme = inject(ThemeToggleService);
  private readonly _refused = signal(false);

  /** The theme chosen: light, dark or auto. */
  readonly mode = this._theme.currentTheme.asReadonly();

  /** The theme the page is drawn in. */
  readonly resolved = this._theme.effectiveTheme;

  /** The account did not take the last choice made here, and its theme is shown again: the switch says so under itself. */
  readonly refused = this._refused.asReadonly();

  /** A choice: shown at once and saved to the account (ThemeToggleService.setTheme - one save at a time, the latest last). */
  set(mode: Theme): void {
    this._refused.set(false);
    void this._theme.setTheme(mode).then((result) => this._refused.set(result.outcome === 'refused'));
  }

  dismissRefusal(): void {
    this._refused.set(false);
  }
}
