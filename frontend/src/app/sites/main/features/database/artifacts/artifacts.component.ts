import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, SelectOption, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { matchesSearch } from '@anotoki/lib/ui/search';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { Artifact, Expanded } from '../../../../../api';
import { asList, buildVersionOptions, isChosen, pluralTail, rarityValues } from '../shared/database-helpers';
import { asNumber, asOneOf, asText, bindFiltersToUrl } from '../shared/filter-url';
import { FacetOption, FacetTrackComponent } from '../shared/facet-track/facet-track.component';
import { ListTileComponent } from '../shared/list-tile/list-tile.component';
import { GroupKey, groupRows } from '../shared/list-groups';
import { GameListsService } from '../../../game-lists.service';
import { artifactRarities, rarityRange } from './artifact-sets';

/** A set as the list reads it: the qualities it drops in worked out once, its highest as its `rarity`, its effects decoded once. */
type ArtifactRow = Expanded<Artifact, 'created_by' | 'updated_by'> & {
  /** The highest quality - the tile's colour, the main track's value and the rarity sections'. */
  rarity: number | null;
  /** "4–5★": what the tile says under the name. */
  range: string | null;
  tags: string[];
};

/** How this list can be grouped, the first the default. */
const GROUPINGS: readonly GroupKey[] = ['version', 'rarity', 'none'];

/** The effects a tile names; the set's page has them all. */
const TILE_TAGS = 2;

/**
 * The artifact sets, in the characters list's system (the owner's choice "E"
 * of 2026-10-21): the highest quality a set drops in as a wide track with
 * counts, the version and an effect under it, and the sets as tiles in
 * sections by version - or by that quality, or in one grid - A to Z within
 * each. A deleted set is not listed.
 */
@Component({
  selector: 'app-database-artifacts',
  templateUrl: './artifacts.component.html',
  styleUrls: ['./artifacts.component.scss'],
  imports: [ButtonComponent, SelectComponent, TextFieldComponent, IconComponent, SegmentedComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FacetTrackComponent, ListTileComponent],
})
export class DatabaseArtifactsComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  artifacts = signal<ArtifactRow[]>([]);
  loading = signal(true);

  // Clicking the rarity already on clears it, so null means "any".
  filterRarity = signal<number | null>(null);

  filterVersion = signal('');
  filterEffect = signal('');
  filterName = signal('');

  groupBy = signal<GroupKey>(GROUPINGS[0]);

  /** The highest qualities present, the highest first, each as its stars with its count. */
  rarityOptions = computed<FacetOption[]>(() => {
    const rows = this.artifacts();
    return rarityValues(rows).map((rarity) => ({
      value: rarity,
      label: `${rarity}★`,
      stars: rarity,
      words: false,
      count: rows.filter((artifact) => artifact.rarity === rarity).length,
    }));
  });

  versionOptions = computed(() => buildVersionOptions(this.artifacts()));

  /** Every effect a set is tagged with, A to Z - the select reads as the browser's own, so a letter typed jumps to it. */
  effectOptions = computed<SelectOption[]>(() => [...new Set(this.artifacts().flatMap((artifact) => artifact.tags))].sort((a, b) => a.localeCompare(b)).map((tag) => ({ value: tag, label: tag })));

  groupChoices = computed(() => GROUPINGS.map((key) => ({ value: key, label: this._i18n.t(`database.filters.group.${key}`) })));

  filteredArtifacts = computed(() => {
    const rarity = this.filterRarity();
    const version = this.filterVersion();
    const effect = this.filterEffect();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();

    return this.artifacts().filter((artifact) => {
      if (rarity !== null && artifact.rarity !== rarity) {
        return false;
      }
      if (isChosen(version) && artifact.version !== version) {
        return false;
      }
      if (isChosen(effect) && !artifact.tags.includes(effect)) {
        return false;
      }
      return !name || matchesSearch(String(artifact.name ?? ''), name);
    });
  });

  /** The filtered sets in sections, by what the reader groups them by. */
  groups = computed(() => groupRows(this.filteredArtifacts(), this.groupBy()));

  constructor() {
    // The filters go in the URL, so coming back from a set's page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      rarity: [this.filterRarity, asNumber],
      version: [this.filterVersion, asText],
      effect: [this.filterEffect, asText],
      name: [this.filterName, asText],
      group: [this.groupBy, asOneOf(GROUPINGS, GROUPINGS[0])],
    });

    this._lists.artifacts().subscribe({
      next: (artifacts) => {
        // New rows, never the list's own: it is shared with every page that asked for it (GameListsService).
        this.artifacts.set(
          artifacts
            .filter((artifact) => !artifact.deleted)
            .map((artifact) => {
              const rarities = artifactRarities(artifact);
              return { ...artifact, rarity: rarities[rarities.length - 1] ?? null, range: rarityRange(rarities), tags: asList(artifact.effects) };
            })
            .sort((a, b) => String(a.name).localeCompare(String(b.name))),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** The counted sentence for n sets - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.artifacts.count.${pluralTail(count, this._i18n.language())}`;
  }

  setGroupBy(key: string): void {
    if ((GROUPINGS as readonly string[]).includes(key)) {
      this.groupBy.set(key as GroupKey);
    }
  }

  /** The first effects a set is tagged with, for its tile. */
  tileTags(artifact: ArtifactRow): string[] {
    return artifact.tags.slice(0, TILE_TAGS);
  }

  resetFilters(): void {
    this.filterRarity.set(null);
    this.filterVersion.set('');
    this.filterEffect.set('');
    this.filterName.set('');
  }
}
