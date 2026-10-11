import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteLanguage } from '@anotoki/lib/translations';
import { AdminSiteSetting, SettingApiService, SiteSettingChange } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { SelectComponent, SelectOption, SwitchComponent, TextFieldComponent, TextareaComponent } from '@anotoki/lib/ui/forms';
import { ButtonComponent } from '@anotoki/lib/ui/button';
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
/** What the Settings page hands over when it opens a card. */
export interface SettingsGroupData {
  title: string;
  note: string;
  settings: AdminSiteSetting[];
  languages: readonly SiteLanguage[];
}

@Component({
  selector: 'app-settings-group-modal',
  templateUrl: './settings-group-modal.component.html',
  styleUrls: ['./settings-group-modal.component.scss'],
  imports: [SwitchComponent, TextareaComponent, TextFieldComponent, SelectComponent, FormsModule, DialogFooterDirective, ButtonComponent, AppDatePipe],
})
export class SettingsGroupModalComponent extends AbstractModalComponent {
  private readonly _api = inject(SettingApiService);

  private readonly _data = inject<SettingsGroupData | null>(ANOTOKI_DIALOG_DATA, { optional: true });

  // What the Settings page hands over: the card's title, its note, its settings and the languages.
  readonly title = signal(this._data?.title ?? '');
  readonly note = signal(this._data?.note ?? '');
  readonly settings = signal<AdminSiteSetting[]>(this._data?.settings ?? []);
  readonly languages = signal<readonly SiteLanguage[]>(this._data?.languages ?? []);
  readonly saving = signal(false);

  /** The form, as the values that would be sent. Text, like the column. */
  readonly draft = signal<Record<string, string>>({});

  readonly changed = computed(() => this.settings().filter((setting) => this.draft()[setting.name] !== (setting.value ?? '')));

  readonly words = settingWords;
  readonly optionLabel = optionLabel;

  constructor() {
    super();
    this.dialogHeading(() => this.title());
    this.start();
  }

  /** The form, as the settings stand. */
  start(): void {
    this.draft.set(Object.fromEntries(this.settings().map((setting) => [setting.name, setting.value ?? ''])));
  }

  /** A choice's options, as the kit's select takes them, each in its words. */
  choices(setting: AdminSiteSetting): SelectOption[] {
    return (setting.options ?? []).map((option) => ({ value: option, label: this.optionLabel(option) }));
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
        this.notificationService.success('Saved.');
        this.closeModal(true);
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(error?.error?.error ?? 'Those could not be saved.');
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
