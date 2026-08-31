import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { shuffle, Tournament, TOURNAMENT_SIZES, TournamentFormat } from './tournament.class';

/** How long a chosen face stays lit before the next pair comes up. */
const PICK_PAUSE_MS = 450;

/**
 * Pick your favourite, over and over, until one is left.
 *
 * Characters are drawn at random and shown two at a time; every click is a
 * verdict. Three formats, all handled by the bracket in tournament.class.ts.
 *
 * A game, not a quiz: no saved position, no result recorded, nothing to come
 * back to.
 */
@Component({
  selector: 'app-games-tournament',
  templateUrl: './tournament.component.html',
  styleUrls: ['./tournament.component.scss'],
  imports: [ButtonComponent, DropdownComponent, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class GamesTournamentComponent {
  private readonly _httpClient = inject(HttpClient);
  private readonly _i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly characters = signal<any[]>([]);

  readonly format = signal<string | number | boolean | null | undefined>('single');
  readonly size = signal<string | number | boolean | null | undefined>(8);

  readonly tournament = signal<Tournament<any> | null>(null);
  /** Bumped after every pick, since the bracket is a plain object. */
  private readonly _version = signal(0);

  /** The face just clicked, lit briefly before the next pair replaces it. */
  readonly picked = signal<any>(null);

  /**
   * Translated here rather than in the template: the dropdown takes plain
   * strings for its options, so the pipe has nothing to attach to. A computed
   * because `t` reads a signal, which is what makes the list follow a change
   * of language.
   */
  readonly formatOptions = computed<DropdownOption[]>(() =>
    (['single', 'double', 'roundRobin'] as const).map((format) => ({
      key: format,
      value: this._i18n.t(`game.tournament.format.${format}`),
    })),
  );

  readonly sizeOptions: DropdownOption[] = TOURNAMENT_SIZES.map((size) => ({ key: size, value: String(size) }));

  readonly match = computed(() => {
    this._version();
    return this.tournament()?.current;
  });

  readonly played = computed(() => {
    this._version();
    return this.tournament()?.played ?? 0;
  });

  readonly total = computed(() => {
    this._version();
    return this.tournament()?.total ?? 0;
  });

  readonly placings = computed(() => {
    this._version();
    return this.tournament()?.placings ?? [];
  });

  readonly isOver = computed(() => {
    this._version();
    return !!this.tournament()?.isOver;
  });

  /**
   * The podium, reordered so second stands left of first and third to its
   * right - which is how a podium looks, rather than how a list is written.
   */
  readonly podium = computed(() => {
    const placings = this.placings();
    if (placings.length < 3) {
      return [];
    }
    return [
      { ...placings[1], place: 2 },
      { ...placings[0], place: 1 },
      { ...placings[2], place: 3 },
    ];
  });

  readonly champion = computed(() => (this.placings().length === 1 ? this.placings()[0].entrant : null));

  constructor() {
    this._httpClient.get<any[]>('/api/characters/minimal').subscribe({
      next: (characters) => {
        // Travellers are left out for the same reason as everywhere else: one
        // character across twelve rows would meet themselves in the bracket.
        this.characters.set(characters.filter((character) => !character.is_traveler));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  start(): void {
    const size = Number(this.size());
    const entrants = shuffle(this.characters()).slice(0, size);
    this.tournament.set(new Tournament(this.format() as TournamentFormat, entrants));
    this.picked.set(null);
    this._version.update((v) => v + 1);
  }

  pick(character: any): void {
    const tournament = this.tournament();
    if (!tournament || this.picked() || tournament.isOver) {
      return;
    }

    // Lit first, resolved a moment later, so the click is visibly registered
    // rather than the pair simply vanishing.
    this.picked.set(character);
    setTimeout(() => {
      tournament.pick(character);
      this.picked.set(null);
      this._version.update((v) => v + 1);
    }, PICK_PAUSE_MS);
  }

  backToSetup(): void {
    this.tournament.set(null);
    this.picked.set(null);
    this._version.update((v) => v + 1);
  }
}
