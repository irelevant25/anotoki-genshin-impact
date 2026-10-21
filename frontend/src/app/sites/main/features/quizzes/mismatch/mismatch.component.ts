import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HELPER } from '../../../../../shared/helper';
import { StateService } from '../../../../../shared/state-manager.service';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { todayString } from '../shared/daily';
import { QuizDifficultyBadgeComponent } from '../shared/difficulty-badge/quiz-difficulty-badge.component';
import { DAILY_DIFFICULTY, quizLevel } from '../shared/quiz-levels';
import { QuizProgressService, hasPlay } from '../shared/quiz-progress.service';
import { QuizId, QuizState } from '../shared/quiz.types';
import { CharacterApiService } from '../../../../../api';

/** The three things a set can have in common. */
const PROPERTIES = ['element', 'weapon_type', 'region'] as const;

/** Attempts at a clean set before giving up on a property/value pairing. */
const MAX_ATTEMPTS = 30;

interface QuizSet {
  options: any[];
  answer: any;
  property: string;
  commonValue: string;
}

/**
 * Pick the character that does not belong.
 *
 * All but one share an element, a weapon type or a region; you click the odd one
 * out. Three on easy, five on hard.
 *
 * This is the one quiz that is not "which character is this?", so it has none of
 * the tries machinery the other five share - one click ends it.
 */
@Component({
  selector: 'app-quizzes-mismatch',
  templateUrl: './mismatch.component.html',
  styleUrls: ['./mismatch.component.scss'],
  imports: [LoaderComponent, ButtonComponent, TranslatePipe, MaterialIconDirective, QuizDifficultyBadgeComponent],
})
export class QuizzesMismatchComponent {
  private readonly _characterApi = inject(CharacterApiService);
  private readonly _stateService = inject(StateService);
  private readonly _progress = inject(QuizProgressService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _quizId: QuizId = 'mismatch';

  readonly characters = signal<any[]>([]);
  readonly loading = signal(true);
  readonly isDaily = signal(false);

  /** The set's own level: the one it was drawn at, kept to its end. */
  readonly difficulty = signal(1);

  /** The level the next set is drawn at, chosen in the difficulty dialog - as in CharacterQuizComponent. */
  readonly chosenDifficulty = signal(1);

  readonly quizSet = signal<QuizSet | null>(null);
  readonly picked = signal<any>(null);
  readonly isQuestionComplete = signal(false);

  readonly choicesAmount = computed(() => quizLevel(this._quizId, this.difficulty()).choicesAmount ?? 4);
  readonly isSuccess = computed(() => !!this.picked() && this.picked()?.name === this.quizSet()?.answer?.name);

  /**
   * Whose game this page is playing - QuizProgressService's ticket, handed
   * back with every save and result; see CharacterQuizComponent.
   */
  private _ticket = 0;
  private _loads = 0;

  constructor() {
    this._activatedRoute.data.subscribe((data) => this.isDaily.set(!!data['daily']));
    this.chosenDifficulty.set(this._stateService.getQuizDifficulty(this._quizId));
    this.difficulty.set(this._levelForNewSet());
    this._fetchAndRestore();

    // The owner changed under the page (a session that ended, a sign-in or a
    // visitor made in another tab): load again for the new one.
    let seen: number | null = null;
    effect(() => {
      const restarts = this._progress.restarts();
      untracked(() => {
        const first = seen === null;
        seen = restarts;
        if (!first) {
          this._fetchAndRestore();
        }
      });
    });
  }

  private _fetchAndRestore(): void {
    const run = ++this._loads;
    const known = this.characters();
    this.loading.set(true);

    forkJoin({ characters: known.length ? of(known) : this._characterApi.getCharactersMinimal(), progress: this._progress.ready() }).subscribe({
      next: ({ characters }) => {
        if (run !== this._loads) {
          return;
        }
        // Travellers are excluded here for the same reason as in the search
        // box: twelve rows carrying two names, and one of them is Anemo, Geo,
        // Electro, Dendro, Hydro and Pyro at once, which makes "the odd one
        // out" meaningless.
        this.characters.set(characters.filter((character) => !character.is_traveler));
        this._ticket = this._progress.ticket();
        this._restoreOrStart();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  choose(character: any): void {
    if (this.isQuestionComplete()) {
      return;
    }
    this.picked.set(character);
    this.isQuestionComplete.set(true);
    // One click is the whole question here, so the result is settled the moment
    // it lands. Mismatch has no tries, so a single attempt is recorded.
    this._progress.recordResult(this._quizId, this.quizSet()?.answer?.id, this.isSuccess(), 1, this.difficulty(), this._ticket);
    this._saveState();
  }

  next(): void {
    this._newQuestion();
  }

  /**
   * A level chosen in the difficulty dialog: kept for this quiz in this
   * browser, for the sets drawn from now on. A set nobody has picked from yet
   * has not begun, and is drawn again at once; an answered one keeps its level.
   */
  chooseDifficulty(difficulty: number): void {
    if (this.isDaily()) {
      return;
    }
    this._stateService.saveQuizDifficulty(this._quizId, difficulty);
    this.chosenDifficulty.set(this._stateService.getQuizDifficulty(this._quizId));
    if (!this.isQuestionComplete() && this.difficulty() !== this.chosenDifficulty()) {
      this._newQuestion();
    }
  }

  /** The daily's level, or the one chosen for this quiz. */
  private _levelForNewSet(): number {
    return this.isDaily() ? DAILY_DIFFICULTY : this.chosenDifficulty();
  }

  private _restoreOrStart(): void {
    const saved = this._progress.get(this._quizId, this.isDaily());
    const byName = (name?: string): any => this.characters().find((character) => character.name === name);
    const options = (saved?.options ?? []).map(byName).filter(Boolean);

    // Restored only if the whole set comes back and, for a daily game, if it is
    // today's - the daily slot is reused, so yesterday's answered question would
    // otherwise still be sitting there. A set nobody has picked from yet, at
    // another level than the one chosen since, has not begun: drawn again.
    const isForToday = !this.isDaily() || saved?.date === todayString();
    const keepsItsLevel = this.isDaily() || saved?.difficulty === this.chosenDifficulty() || hasPlay(saved);

    if (saved && isForToday && keepsItsLevel && saved.options?.length && options.length === saved.options.length && byName(saved.answer)) {
      this.difficulty.set(saved.difficulty);
      this.quizSet.set({
        options,
        answer: byName(saved.answer),
        property: saved.quizProperty ?? '',
        commonValue: saved.commonValue ?? '',
      });
      this.isQuestionComplete.set(saved.isQuestionComplete);
      return;
    }

    this._newQuestion();
  }

  private _newQuestion(): void {
    // The choice read again, as another tab may have made one since.
    this.chosenDifficulty.set(this._stateService.getQuizDifficulty(this._quizId));
    this.difficulty.set(this._levelForNewSet());
    this.quizSet.set(this._randomQuizSet(this.choicesAmount()));
    this.picked.set(null);
    this.isQuestionComplete.set(false);
    this._saveState();
  }

  /**
   * Builds a set where exactly one property separates one character from the
   * rest.
   *
   * The hard part is not finding a majority - it is making sure no *other*
   * property accidentally splits the set the same way, which would leave two
   * defensible answers. Sets are drawn and thrown away until one is clean.
   */
  private _randomQuizSet(count: number): QuizSet | null {
    const characters = this.characters();

    // Every property/value pairing with enough characters behind it to fill a
    // majority, in random order so the quiz does not always ask about elements.
    const viable: { property: string; value: string }[] = [];
    for (const property of HELPER.shuffleArray([...PROPERTIES])) {
      const counts = new Map<string, number>();
      for (const character of characters) {
        const value = character[property];
        if (value) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      for (const [value, frequency] of counts) {
        if (frequency >= count - 1) {
          viable.push({ property, value });
        }
      }
    }

    for (const { property, value } of HELPER.shuffleArray(viable)) {
      const matching = characters.filter((character) => character[property] === value);
      const notMatching = characters.filter((character) => character[property] !== value);

      if (matching.length < count - 1 || !notMatching.length) {
        continue;
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const majority = HELPER.shuffleArray([...matching]).slice(0, count - 1);
        const oddOneOut = notMatching[HELPER.getRandomInt(0, notMatching.length - 1)];
        const candidate = [...majority, oddOneOut];

        if (PROPERTIES.every((other) => other === property || !this._splitsTheSameWay(candidate, other, count))) {
          return {
            options: HELPER.shuffleArray(candidate),
            answer: oddOneOut,
            property,
            commonValue: value,
          };
        }
      }
    }

    return null;
  }

  /** True when some other property also has count-1 of the set agreeing on it. */
  private _splitsTheSameWay(candidate: any[], property: string, count: number): boolean {
    const counts = new Map<string, number>();
    for (const character of candidate) {
      const value = character[property];
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Math.max(...counts.values()) >= count - 1;
  }

  private _saveState(): void {
    const set = this.quizSet();
    const state: QuizState = {
      tries: [],
      triesMax: 1,
      triesEffects: [],
      isQuestionComplete: this.isQuestionComplete(),
      isSuccess: this.isQuestionComplete() ? this.isSuccess() : undefined,
      difficulty: this.difficulty(),
      date: this.isDaily() ? todayString() : undefined,
      choicesAmount: this.choicesAmount(),
      options: set?.options.map((character) => character.name),
      answer: set?.answer?.name,
      quizProperty: set?.property,
      commonValue: set?.commonValue,
    };
    this._progress.save(this._quizId, state, this.isDaily(), this._ticket);
  }
}
