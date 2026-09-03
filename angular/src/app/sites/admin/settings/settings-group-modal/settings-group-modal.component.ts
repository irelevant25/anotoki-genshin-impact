import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSiteSetting, Language, SettingApiService, SiteSettingChange } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { optionLabel, settingWords } from '../settings-words';

/**
 * One card's worth of switches, opened from the settings page.
 *
 * The whole form used to be one page, which meant scrolling past the
 * announcement to reach maintenance mode - four switches and two text boxes
 * are not a lot, but they are more than a screen, and a page you have to
 * scroll to see all of is a page where you cannot tell at a glance what the
 * site is currently doing. The page is a row of cards now, and this is what a
 * card opens.
 *
 * It saves its own group and nothing else. The API takes a list, so it could
 * save everything at once, but sending switches nobody has looked at is how
 * `updated_at` stops meaning "when this was last changed".
 */
@Component({
  selector: 'app-settings-group-modal',
  templateUrl: './settings-group-modal.component.html',
  styleUrls: ['./settings-group-modal.component.scss'],
  imports: [FormsModule, ModalComponent, ButtonComponent, AppDatePipe],
})
export class SettingsGroupModalComponent extends AbstractModalComponent {
  private readonly _api = inject(SettingApiService);

  readonly title = signal('');
  readonly note = signal('');
  readonly settings = signal<AdminSiteSetting[]>([]);
  readonly languages = signal<Language[]>([]);
  readonly saving = signal(false);

  /** The form, as the values that would be sent. Text, like the column. */
  readonly draft = signal<Record<string, string>>({});

  readonly changed = computed(() => this.settings().filter((setting) => this.draft()[setting.name] !== (setting.value ?? '')));

  readonly words = settingWords;
  readonly optionLabel = optionLabel;

  /** Called by the page once it has handed over the group. */
  start(): void {
    this.draft.set(Object.fromEntries(this.settings().map((setting) => [setting.name, setting.value ?? ''])));
  }

  isChanged(setting: AdminSiteSetting): boolean {
    return this.draft()[setting.name] !== (setting.value ?? '');
  }

  save(): void {
    const changes: SiteSettingChange[] = this.changed().map((setting) => ({
      name: setting.name,
      value: this.draft()[setting.name] ?? '',
    }));

    if (!changes.length) {
      this.closeModal();
      return;
    }

    this.saving.set(true);

    this._api.saveSettings({ settings: changes }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess('Saved.');
        this.closeModal(true);
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.showError(error?.error?.error ?? 'Those could not be saved.');
      },
    });
  }

  // ── The controls ───────────────────────────────────────────────────────────

  boolean(setting: AdminSiteSetting): boolean {
    return this.draft()[setting.name] === 'true';
  }

  setBoolean(setting: AdminSiteSetting, value: boolean): void {
    this._write(setting.name, value ? 'true' : 'false');
  }

  text(setting: AdminSiteSetting): string {
    return this.draft()[setting.name] ?? '';
  }

  setText(setting: AdminSiteSetting, value: string): void {
    this._write(setting.name, value);
  }

  message(setting: AdminSiteSetting, language: string): string {
    const map = this._json<Record<string, string>>(setting, {});

    return typeof map[language] === 'string' ? map[language] : '';
  }

  setMessage(setting: AdminSiteSetting, language: string, value: string): void {
    const map = this._json<Record<string, string>>(setting, {});

    // An emptied field drops the language rather than storing "", so the
    // fallback to English is a missing translation rather than a blank one.
    if (value.trim() === '') {
      delete map[language];
    } else {
      map[language] = value;
    }

    this._write(setting.name, JSON.stringify(map));
  }

  private _write(name: string, value: string): void {
    this.draft.update((draft) => ({ ...draft, [name]: value }));
  }

  /**
   * The draft value of a JSON setting, or the fallback.
   *
   * Never throws. A value that will not parse is one somebody has edited by
   * hand into something the form cannot draw, and an empty control they can
   * fill in is a better answer than a page that will not render.
   */
  private _json<T>(setting: AdminSiteSetting, fallback: T): T {
    try {
      const parsed = JSON.parse(this.draft()[setting.name] || 'null');

      return parsed === null || typeof parsed !== 'object' ? fallback : (parsed as T);
    } catch {
      return fallback;
    }
  }
}
