import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminSiteRoute, AdminSiteSetting, Language, LanguageApiService, RouteApiService, SettingApiService } from '../../../api';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { SettingsGroupModalComponent } from './settings-group-modal/settings-group-modal.component';
import { SettingsRoutesModalComponent } from './settings-routes-modal/settings-routes-modal.component';
import { SETTING_GROUPS, optionLabel, settingWords } from './settings-words';

/** A card on the page: what it covers, and what it currently says. */
interface SettingCard {
  readonly key: string;
  readonly title: string;
  readonly note: string;
  readonly icon: string;
  /** A line per switch, so the card answers "what is it doing" without opening. */
  readonly summary: readonly { label: string; state: string; on: boolean }[];
  readonly settings: AdminSiteSetting[];
}

/**
 * The switches an admin can throw without a deploy.
 *
 * A row of cards rather than one long form. The form was not big - four
 * switches, two text boxes and a table - but it was taller than a screen, and
 * a page you have to scroll to see all of is a page where you cannot tell at a
 * glance what the site is currently doing. Each card says that much on its
 * face and opens the rest.
 *
 * Which switches exist comes from the API rather than from this file: each row
 * carries a declared type, and there is one control per type. Adding a setting
 * is a row in a migration and, if it deserves a sentence, an entry in
 * settings-words.ts.
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [ButtonComponent, LoaderComponent],
})
export class SettingsComponent extends AbstractModalComponent implements OnInit {
  private readonly _settingApi = inject(SettingApiService);
  private readonly _routeApi = inject(RouteApiService);
  private readonly _languageApi = inject(LanguageApiService);

  readonly settings = signal<AdminSiteSetting[]>([]);
  readonly routes = signal<AdminSiteRoute[]>([]);
  readonly levels = signal<string[]>([]);
  readonly languages = signal<Language[]>([]);
  readonly failed = signal(false);

  private readonly _loadingSettings = signal(false);
  private readonly _loadingRoutes = signal(false);

  readonly busy = computed(() => this._loadingSettings() || this._loadingRoutes());

  readonly cards = computed<SettingCard[]>(() => {
    const cards: SettingCard[] = [];

    for (const setting of this.settings()) {
      let card = cards.find((candidate) => candidate.key === setting.group_name);

      if (!card) {
        const words = SETTING_GROUPS[setting.group_name] ?? { title: setting.group_name, note: '', icon: 'icon-gear' };
        card = { key: setting.group_name, ...words, summary: [], settings: [] };
        cards.push(card);
      }

      card.settings.push(setting);
      (card.summary as { label: string; state: string; on: boolean }[]).push({
        label: settingWords(setting.name).label,
        state: this._state(setting),
        on: setting.type === 'boolean' && setting.value === 'true',
      });
    }

    return cards;
  });

  /** What the pages card says on its face. */
  readonly routesSummary = computed(() => {
    const off = this.routes().filter((route) => route.blocked).length;
    const restricted = this.routes().filter((route) => !route.blocked && route.visibility !== 'PUBLIC').length;
    const locked = this.routes().filter((route) => route.endpoints.length).length;

    return [
      { label: 'Pages', state: String(this.routes().length), on: false },
      { label: 'Switched off', state: off ? String(off) : 'none', on: off > 0 },
      { label: 'Limited', state: restricted ? String(restricted) : 'none', on: restricted > 0 },
      { label: 'Also locking their API', state: locked ? String(locked) : 'none', on: locked > 0 },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this._loadingSettings.set(true);
    this._loadingRoutes.set(true);
    this.failed.set(false);

    this._settingApi.getSettings().subscribe({
      next: (list) => {
        this.settings.set(list.settings);
        this._loadingSettings.set(false);
      },
      error: () => {
        this._loadingSettings.set(false);
        this.failed.set(true);
      },
    });

    this._routeApi.getRoutes().subscribe({
      next: (list) => {
        this.routes.set(list.routes);
        this.levels.set(list.levels);
        this._loadingRoutes.set(false);
      },
      error: () => {
        this._loadingRoutes.set(false);
        this.failed.set(true);
      },
    });

    // Only the enabled ones: a message written in a language nobody can read
    // the site in is a message nobody will see.
    this._languageApi.getLanguages().subscribe({
      next: (languages) => this.languages.set(languages),
      error: () => this.languages.set([]),
    });
  }

  openCard(card: SettingCard): void {
    const modal = this.openModal<SettingsGroupModalComponent>(SettingsGroupModalComponent, { size: '5' }, () => this.load());

    modal.componentInstance.title.set(card.title);
    modal.componentInstance.note.set(card.note);
    modal.componentInstance.settings.set(card.settings);
    modal.componentInstance.languages.set(this.languages());
    modal.componentInstance.start();
  }

  openRoutes(): void {
    const modal = this.openModal<SettingsRoutesModalComponent>(SettingsRoutesModalComponent, { size: '6' }, () => this.load());

    modal.componentInstance.routes.set(this.routes());
    modal.componentInstance.levels.set(this.levels());
    modal.componentInstance.start();
  }

  /** One switch, in the fewest words that say what it is doing. */
  private _state(setting: AdminSiteSetting): string {
    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true' ? 'On' : 'Off';

      case 'choice':
        return optionLabel(setting.value ?? '');

      case 'i18n': {
        const written = Object.values(this._map(setting)).filter((text) => text.trim()).length;

        return written ? `${written} ${written === 1 ? 'language' : 'languages'}` : 'not written';
      }

      default:
        return setting.value?.trim() ? setting.value : 'empty';
    }
  }

  private _map(setting: AdminSiteSetting): Record<string, string> {
    try {
      const parsed = JSON.parse(setting.value || 'null');

      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
}
