import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { BadgeComponent, BadgeTone } from '@anotoki/lib/ui/badge';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { buildVersionOptions, compareVersionsDesc, isChosen, matchesTerm, pluralTail, versionLabel } from '../shared/database-helpers';
import { asText, bindFiltersToUrl } from '../shared/filter-url';
import { Banner, Character, Expanded, Weapon } from '../../../../../api';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { GameListsService } from '../../../game-lists.service';
import { todayString } from '../../quizzes/shared/daily';
import { BannerPhase, groupBanners, phaseNumbers } from './banner-groups';
import { BannerCardComponent } from './banner-card/banner-card.component';

type IBannerFull = Banner & {
  characters: Expanded<Character, 'created_by' | 'updated_by'>[];
  weapons: Expanded<Weapon, 'created_by' | 'updated_by'>[];
};

/** A phase with its state put into words: the key, its placeholders, the badge's colour. */
type ShownPhase = BannerPhase<IBannerFull> & { stateKey: string; stateParams: Record<string, number>; tone: BadgeTone };

/**
 * The banners as a timeline (the owner's choice of 2026-10-21 among the
 * mockups): a heading a version, and under it one block a phase - the banners
 * that ran together - with the dates and the state said once, on the left,
 * and the phase's banners as cards beside them.
 */
@Component({
  selector: 'app-database-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  imports: [AppDatePipe, ButtonComponent, BadgeComponent, IconComponent, TranslatePipe, SelectComponent, TextFieldComponent, LoaderComponent, BannerCardComponent],
})
export class DatabaseBannersComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);
  /** The day the states are judged against, taken once: the page is not open for days. */
  private readonly _today = todayString();

  banners = signal<IBannerFull[]>([]);
  loading = signal(true);

  filterVersions = signal('');
  filterCharacterName = signal('');
  filterWeaponName = signal('');

  versionLabel = versionLabel;

  // The key stays the raw `version` off the banner, so it can be compared
  // straight against the data; only the label gets the Luna number added.
  versionOptions = computed(() => buildVersionOptions(this.banners()));

  filteredBanners = computed(() => {
    const version = this.filterVersions();
    const characterName = String(this.filterCharacterName() ?? '')
      .trim()
      .toLowerCase();
    const weaponName = String(this.filterWeaponName() ?? '')
      .trim()
      .toLowerCase();

    return this.banners()
      .filter((banner) => {
        if (isChosen(version) && banner.version !== version) {
          return false;
        }
        if (characterName && !(banner.characters ?? []).some((character: any) => matchesTerm(character.name, characterName))) {
          return false;
        }
        if (weaponName && !(banner.weapons ?? []).some((weapon: any) => matchesTerm(weapon.name, weaponName))) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Version descending
        const versionDiff = compareVersionsDesc(a.version, b.version);

        if (versionDiff !== 0) {
          return versionDiff;
        }

        // 2. duration_from ascending
        const durationDiff = a.duration_from.localeCompare(b.duration_from);

        if (durationDiff !== 0) {
          return durationDiff;
        }

        // 3. Objects with weapons go to the end
        const aHasWeapons = a.weapons?.length > 0;
        const bHasWeapons = b.weapons?.length > 0;

        if (aHasWeapons !== bHasWeapons) {
          return aHasWeapons ? 1 : -1;
        }

        return 0;
      });
  });

  /** Each phase's number within its version, from every banner, so a filter never renumbers one. */
  private readonly _phaseNumbers = computed(() => phaseNumbers(this.banners()));

  /** The filtered banners by version and phase - a version or a phase the filter empties is simply not there. */
  groups = computed(() => {
    const language = this._i18n.language();
    return groupBanners(this.filteredBanners(), this._phaseNumbers(), this._today).map((version) => ({
      ...version,
      countKey: `database.banners.count.${pluralTail(version.count, language)}`,
      phases: version.phases.map((phase): ShownPhase => ({ ...phase, ...this._stateWords(phase, language) })),
    }));
  });

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      version: [this.filterVersions, asText],
      character: [this.filterCharacterName, asText],
      weapon: [this.filterWeaponName, asText],
    });

    // The three lists do not depend on one another - only the merge below does -
    // so they go out together rather than one after the next.
    forkJoin({
      characters: this._lists.characters(),
      weapons: this._lists.weapons(),
      banners: this._lists.banners(),
    }).subscribe({
      next: ({ characters, weapons, banners }) => {
        const charactersById = new Map(characters.map((character) => [character.id, character]));
        const weaponsById = new Map(weapons.map((weapon) => [weapon.id, weapon]));

        // Each banner with the full rows its join rows name, in their order; a row the lists lack is left out.
        this.banners.set(
          banners.map(
            (banner) =>
              ({
                ...banner,
                characters: banner.characters.map((row) => charactersById.get(row.character_id ?? -1)).filter((character) => !!character),
                weapons: banner.weapons.map((row) => weaponsById.get(row.weapon_id ?? -1)).filter((weapon) => !!weapon),
              }) as IBannerFull,
          ),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** The counted sentence for n banners - the page head's total - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.banners.count.${pluralTail(count, this._i18n.language())}`;
  }

  resetFilters(): void {
    this.filterVersions.set('');
    this.filterCharacterName.set('');
    this.filterWeaponName.set('');
  }

  /** The state badge's words - a counted sentence in the reader's language - and its colour. */
  private _stateWords(phase: BannerPhase<IBannerFull>, language: string): { stateKey: string; stateParams: Record<string, number>; tone: BadgeTone } {
    const days = phase.days ?? 0;
    switch (phase.state) {
      case 'ended':
        return { stateKey: 'database.banners.state.ended', stateParams: {}, tone: 'neutral' };
      case 'upcoming':
        return { stateKey: `database.banners.state.startsIn.${pluralTail(days, language)}`, stateParams: { days }, tone: 'info' };
      default:
        if (phase.days === null) {
          return { stateKey: 'database.banners.state.running', stateParams: {}, tone: 'success' };
        }
        if (days === 0) {
          return { stateKey: 'database.banners.state.endsToday', stateParams: {}, tone: 'success' };
        }
        return { stateKey: `database.banners.state.endsIn.${pluralTail(days, language)}`, stateParams: { days }, tone: 'success' };
    }
  }
}
