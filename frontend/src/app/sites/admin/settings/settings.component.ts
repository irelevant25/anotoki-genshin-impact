import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { ErrorStateComponent } from '@anotoki/lib/ui/error-state';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { TranslationService } from '@anotoki/lib/translations';
import { AdminSiteRoute, AdminSiteSetting, RouteApiService, SettingApiService } from '../../../api';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SettingsGroupData, SettingsGroupModalComponent } from './settings-group-modal/settings-group-modal.component';
import { SettingsRoutesData, SettingsRoutesModalComponent } from './settings-routes-modal/settings-routes-modal.component';
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
  imports: [PageHeaderComponent, ErrorStateComponent, SpinnerComponent, ButtonComponent],
})
export class SettingsComponent extends AbstractModalComponent implements OnInit {
  private readonly _settingApi = inject(SettingApiService);
  private readonly _routeApi = inject(RouteApiService);

  readonly settings = signal<AdminSiteSetting[]>([]);
  readonly routes = signal<AdminSiteRoute[]>([]);
  readonly levels = signal<string[]>([]);
  /**
   * The languages on offer, as the pages' words came with them - only those:
   * a message written in a language nobody can read the site in is a message
   * nobody will see.
   */
  readonly languages = inject(TranslationService).languages;
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
  }

  openCard(card: SettingCard): void {
    this.openModal<boolean, SettingsGroupData>(
      SettingsGroupModalComponent,
      { size: 'lg', description: card.note || null, data: { title: card.title, note: card.note, settings: card.settings, languages: this.languages() } },
      () => this.load(),
    );
  }

  openRoutes(): void {
    // Re-read whenever it closes: a row may have been written however it was closed.
    void this.openModal<boolean, SettingsRoutesData>(SettingsRoutesModalComponent, {
      heading: 'Parts of the site',
      description: 'Which pages exist, and who they exist for',
      // The kit's widest (64rem): a row of controls for every page.
      size: 'xl',
      data: { routes: this.routes(), levels: this.levels() },
    }).closed.then(() => this.load());
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
