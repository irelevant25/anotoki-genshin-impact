import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '@anotoki/lib/translations';
import { CardComponent } from '@anotoki/lib/ui/card';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { ArtifactApiService, ArtifactPayload, ArtifactPiecePayload, Saved } from '../../../../../../api';
import { asList, versionLabel } from '../../shared/database-helpers';
import { inGameOrder } from '../../shared/list-groups';
import { DetailHeroComponent, HeroPicture, HeroStat } from '../../shared/detail-hero/detail-hero.component';
import { DetailFactsComponent, FactRow } from '../../shared/detail-facts/detail-facts.component';
import { artifactRarities, rarityRange, sourceGroups } from '../artifact-sets';

/** The five pieces of a set in the game's own order, the flower first; the rows come in the order they were saved. */
const PIECE_ORDER: readonly string[] = ['Flower of Life', 'Plume of Death', 'Sands of Eon', 'Goblet of Eonothem', 'Circlet of Logos'];

/**
 * The `/full` answer's set is the whole row (the API's find), though its type
 * is the body a form sends: `deleted` comes with it, unnamed.
 */
function isDeleted(row: object): boolean {
  return 'deleted' in row && row.deleted === true;
}

/**
 * An artifact set's page: the hero in its highest quality's colour with the
 * set's picture and the strip of facts, the Set bonuses and Effects cards, the
 * pieces, then how to obtain it quality by quality - the same bones as the
 * weapon's page (the owner's choice of 2026-10-21 among the mockups,
 * "Showcase"). A deleted set is not found, as the list leaves it out.
 */
@Component({
  selector: 'app-database-artifact-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [LoaderComponent, TranslatePipe, CardComponent, MaterialIconDirective, DetailHeroComponent, DetailFactsComponent],
})
export class DatabaseArtifactDetailComponent {
  private readonly _artifactApi = inject(ArtifactApiService);
  private readonly _route = inject(ActivatedRoute);

  artifact = signal<Saved<ArtifactPayload> | null>(null);
  pieces = signal<Saved<ArtifactPiecePayload>[]>([]);
  loading = signal(true);

  /** The qualities the set drops in, the lowest first; the highest colours the page. */
  rarities = computed(() => {
    const artifact = this.artifact();
    return artifact ? artifactRarities(artifact) : [];
  });
  rarity = computed<number | null>(() => this.rarities()[this.rarities().length - 1] ?? null);

  effects = computed(() => asList(this.artifact()?.effects));
  bonuses = computed(() => {
    const artifact = this.artifact();
    return [
      { label: 'database.detail.twoPiece', text: artifact?.two_piece },
      { label: 'database.detail.fourPiece', text: artifact?.four_piece },
    ].filter((bonus) => !!bonus.text?.trim());
  });

  /** How to obtain it, the highest quality first, the qualities that share their ways in one line. */
  sources = computed(() => {
    const artifact = this.artifact();
    return artifact ? sourceGroups(artifact) : [];
  });
  /** The lines as the facts list draws them: the qualities, then the ways as chips. */
  sourceRows = computed<FactRow[]>(() => this.sources().map((group) => ({ labelText: group.label, chips: group.sources })));
  /** The first way, the highest quality's: the hero's strip says it. */
  firstSource = computed(() => this.sources()[0]?.sources[0] ?? null);
  /** Its card is drawn where it has more to say than the strip: more ways than one, or more lines than one. */
  showSources = computed(() => this.sources().length > 1 || (this.sources()[0]?.sources.length ?? 0) > 1);

  splash = computed<HeroPicture | null>(() => {
    const artifact = this.artifact();
    return artifact ? { name: artifact.icon_name ?? artifact.name, folder: 'artifacts' } : null;
  });

  /** The strip of tiles under the name: what identifies the set at a glance. */
  heroStats = computed<HeroStat[]>(() => {
    const artifact = this.artifact();
    if (!artifact) {
      return [];
    }
    return [
      { label: 'database.filters.rarity', value: rarityRange(this.rarities()) },
      { label: 'database.filters.version', value: artifact.version ? versionLabel(artifact.version) : null },
      { label: 'database.detail.pieces', value: this.pieces().length || null },
      { label: 'database.detail.obtained', value: this.firstSource() },
    ];
  });

  constructor() {
    this._route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.loading.set(true);
          return id ? this._artifactApi.getArtifactFull(Number(id)) : of(null);
        }),
      )
      .subscribe({
        next: (full) => {
          const artifact = full?.artifact ?? null;
          this.artifact.set(artifact && !isDeleted(artifact) ? artifact : null);
          // In the game's order: the rows come as they were saved, one piece added after another.
          const byOrder = inGameOrder(
            (full?.pieces ?? []).map((piece) => piece.type),
            PIECE_ORDER,
          );
          this.pieces.set([...(full?.pieces ?? [])].sort((a, b) => byOrder.indexOf(a.type) - byOrder.indexOf(b.type) || String(a.name).localeCompare(String(b.name))));
          this.loading.set(false);
        },
        error: () => {
          this.artifact.set(null);
          this.pieces.set([]);
          this.loading.set(false);
        },
      });
  }
}
