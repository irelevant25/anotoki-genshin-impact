import { computed, effect, EffectRef, inject, signal, untracked } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { StateService } from '../../../../../shared/state-manager.service';
import { todayString } from './daily';
import { DAILY_DIFFICULTY } from './quiz-levels';
import { QuizLevelsService } from './quiz-levels.service';
import { QuizProgressService, hasPlay } from './quiz-progress.service';
import { QuizId, QuizState } from './quiz.types';
import { CharacterApiService } from '../../../../../api';

/**
 * Everything the five "which character is this?" quizzes do.
 *
 * Banners, dish, pixelate, music and voice differ only in what they put on
 * screen and in which characters they can ask about - a music question needs a
 * demo track, a dish question needs a dish. The tries, the search box, the
 * reveal steps, the scoring and the saved game are the same in all five, and
 * were five copies of the same code on the old site.
 *
 * A subclass supplies `quizId`, narrows the pool with `canAsk`, and does its own
 * drawing in `onQuestionChanged`.
 *
 * Mismatch is not one of these. It asks a different question and has no tries.
 */
export abstract class CharacterQuizComponent {
  protected readonly characterApi = inject(CharacterApiService);
  protected readonly stateService = inject(StateService);
  protected readonly progress = inject(QuizProgressService);
  private readonly _levels = inject(QuizLevelsService);
  private readonly _activatedRoute = inject(ActivatedRoute);

  /** Picks the quiz's levels (the ones in force: QuizLevelsService), its chosen difficulty and the slot the saved game lives in. */
  protected abstract readonly quizId: QuizId;

  /**
   * Whether a character can be the answer. Music overrides it to ask only about
   * characters with a demo track, dish only about those with a special dish.
   */
  protected canAsk(character: any): boolean {
    return !!character;
  }

  /** Called once a question is settled, whether drawn fresh or restored. */
  protected onQuestionChanged(): void {
    // Nothing by default: a quiz that has to react to a new question overrides this.
  }

  readonly characters = signal<any[]>([]);
  readonly loading = signal(true);
  readonly isDaily = signal(false);

  readonly questionEntity = signal<any>(null);
  readonly tries = signal<any[]>([]);
  readonly isQuestionComplete = signal(false);

  /** The question's own level: the one it was drawn at, kept to its end. */
  readonly difficulty = signal(1);

  /**
   * The level the next question is drawn at: chosen for this quiz in its
   * difficulty dialog, and kept in this browser (StateService). Never the
   * daily's, which is the same for everybody (DAILY_DIFFICULTY).
   */
  readonly chosenDifficulty = signal(1);

  /** Whether the question on screen has begun: a guess made, or over. One that has keeps its level. */
  readonly started = computed(() => this.tries().length > 0 || this.isQuestionComplete());

  private readonly _level = computed(() => this._levels.level(this.quizId, this.difficulty()));
  readonly triesMax = computed(() => this._level().triesMax ?? 5);
  readonly triesEffects = computed(() => this._level().triesEffects ?? []);

  /**
   * How the question is hidden right now. Nothing once it is over - the whole
   * point of finishing is seeing the answer plainly.
   */
  readonly currentEffect = computed(() => (this.isQuestionComplete() ? undefined : this.triesEffects().find((effect) => effect.try === this.tries().length)));

  readonly effectClasses = computed(() => this.currentEffect()?.class?.split(' ') ?? []);

  /** Won if the last guess was right; a question can also end by running out. */
  readonly isSuccess = computed(() => {
    const tries = this.tries();
    return tries.length > 0 && tries[tries.length - 1]?.name === this.questionEntity()?.name;
  });

  /**
   * The tries row padded out to the maximum, so the empty slots are visible
   * from the start and you can see how many are left rather than counting.
   */
  readonly displayTries = computed(() => {
    const slots: (any | null)[] = Array(this.triesMax()).fill(null);
    this.tries().forEach((character, index) => {
      if (index < slots.length) {
        slots[index] = character;
      }
    });
    return slots;
  });

  /**
   * What the search box offers.
   *
   * Aether and Lumine are left out. They are twelve rows here - one per element
   * the traveller can carry - so they would crowd the list with repeats of one
   * name, and picking the right name could still be a wrong answer because it
   * matched the wrong row.
   */
  readonly searchOptions = computed<DropdownOption[]>(() =>
    this.characters()
      .filter((character) => !character.is_traveler)
      .map((character) => ({ key: character.id, value: character.name, data: character })),
  );

  /** Characters this quiz could ask about, once the pool has loaded. */
  protected readonly answerable = computed(() => this.characters().filter((character) => !character.is_traveler && this.canAsk(character)));

  /**
   * The pool every quiz works from: the character list, which is both what a
   * question is drawn from and what the search box offers.
   *
   * Overridable because the dish quiz needs each character's dish attached, and
   * that lives in another table.
   */
  protected fetchCharacters(): Observable<any[]> {
    return this.characterApi.getCharactersMinimal();
  }

  /**
   * Whose game this page is playing: QuizProgressService's ticket, taken as
   * it restored or started, and handed back with every save and result. When
   * the owner changes under the page - a session that ended, a sign-in or a
   * visitor made in another tab - the saves under the old ticket are dropped,
   * and the page loads again for the new owner (`restarts`).
   */
  protected ticket = 0;
  private _loads = 0;

  private readonly _restartOnNewOwner = ((): EffectRef => {
    let seen: number | null = null;
    return effect(() => {
      const restarts = this.progress.restarts();
      untracked(() => {
        const first = seen === null;
        seen = restarts;
        if (!first) {
          this.fetchAndRestore();
        }
      });
    });
  })();

  protected load(): void {
    this._activatedRoute.data.subscribe((data) => this.isDaily.set(!!data['daily']));
    this.chosenDifficulty.set(this.stateService.getQuizDifficulty(this.quizId));
    this.difficulty.set(this.levelForNewQuestion());
    this.fetchAndRestore();
  }

  /** The level a question drawn now is played at: the daily's, or the one chosen for this quiz. */
  protected levelForNewQuestion(): number {
    return this.isDaily() ? DAILY_DIFFICULTY : this.chosenDifficulty();
  }

  /** A new question's level, as it is drawn - the choice read again, as another tab may have made one since. */
  protected drawLevel(): void {
    this.chosenDifficulty.set(this.stateService.getQuizDifficulty(this.quizId));
    this.difficulty.set(this.levelForNewQuestion());
  }

  /**
   * A level chosen in the difficulty dialog: kept for this quiz in this
   * browser, for the questions drawn from now on. A question nobody has
   * guessed at yet has not begun, and is drawn again at once; one under way,
   * or over, keeps its own level to its end - its result is recorded at the
   * level it was played at.
   */
  chooseDifficulty(difficulty: number): void {
    if (this.isDaily()) {
      return;
    }
    this.stateService.saveQuizDifficulty(this.quizId, difficulty);
    this.chosenDifficulty.set(this.stateService.getQuizDifficulty(this.quizId));
    if (!this.started() && this.difficulty() !== this.chosenDifficulty()) {
      this.newQuestion();
    }
  }

  /**
   * Whether a saved question is taken up again at its own level. One that has
   * begun always is; one nobody has guessed at yet only while it is at the
   * level chosen - another chosen since, in this tab or another, begins now.
   */
  protected keepsItsLevel(saved: QuizState): boolean {
    return this.isDaily() || saved.difficulty === this.chosenDifficulty() || hasPlay(saved);
  }

  /**
   * The saved game is fetched alongside the characters rather than after
   * them: neither needs the other, and a quiz cannot decide whether it is
   * resuming until both have arrived. So are the levels in force, so that the
   * first question is drawn at them - settled by then whatever the server
   * said, or did not (QuizLevelsService). Again after a change of owner, with
   * the characters already in hand; only the latest of these draws.
   */
  protected fetchAndRestore(): void {
    const run = ++this._loads;
    const characters = this.characters();
    this.loading.set(true);

    forkJoin({ characters: characters.length ? of(characters) : this.fetchCharacters(), progress: this.progress.ready(), levels: this._levels.ready() }).subscribe({
      next: ({ characters }) => {
        if (run !== this._loads) {
          return;
        }
        this.characters.set(characters);
        this.ticket = this.progress.ticket();
        this.restoreOrStart();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Picks up the game in progress, or starts one.
   *
   * A saved question whose character no longer resolves - renamed, removed, or
   * no longer answerable because the data behind it changed - is dropped rather
   * than restored half-formed; so is one that has not begun at another level
   * than the one chosen (keepsItsLevel).
   */
  protected restoreOrStart(): void {
    const saved = this.progress.get(this.quizId, this.isDaily());
    const character = saved?.questionEntity ? this.characters().find((x) => x.name === saved.questionEntity) : undefined;

    if (saved && character && this.canAsk(character) && this.isForToday(saved) && this.keepsItsLevel(saved)) {
      this.difficulty.set(saved.difficulty);
      this.questionEntity.set(character);
      this.tries.set(saved.tries.map((name) => this.characters().find((x) => x.name === name)).filter(Boolean));
      this.isQuestionComplete.set(saved.isQuestionComplete);
      this.onQuestionChanged();
      return;
    }

    this.newQuestion();
  }

  protected newQuestion(): void {
    this.drawLevel();
    const pool = this.answerable();
    this.questionEntity.set(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
    this.tries.set([]);
    this.isQuestionComplete.set(false);
    this.onQuestionChanged();
    this.saveState();
  }

  guess(option: DropdownOption | undefined): void {
    if (!option?.data || this.isQuestionComplete()) {
      return;
    }

    const character = option.data as any;
    // A name already tried is not another try - it tells you nothing new, and
    // spending a life on it would feel like a bug rather than a rule.
    if (this.tries().some((tried) => tried.name === character.name)) {
      return;
    }

    this.tries.update((tries) => [...tries, character]);

    if (this.isSuccess() || this.tries().length >= this.triesMax()) {
      this.isQuestionComplete.set(true);
      // Recorded here rather than wherever isQuestionComplete is read: this is
      // the one place a question actually finishes. Restoring a finished game
      // sets the same flag, and counting that as a second result would inflate
      // a player's history every time they reopened the page.
      this.progress.recordResult(this.quizId, this.questionEntity()?.id, this.isSuccess(), this.tries().length, this.difficulty(), this.ticket);
    }

    this.onQuestionChanged();
    this.saveState();
  }

  next(): void {
    this.newQuestion();
  }

  /**
   * Whether a saved daily game belongs to today.
   *
   * The daily slot is reused every day, so without this yesterday's finished
   * question would be restored this morning and the day would start already
   * over. An ordinary game has no expiry.
   */
  protected isForToday(saved: QuizState): boolean {
    return !this.isDaily() || saved.date === todayString();
  }

  /** What is written down, with the day stamped on it for a daily game. */
  protected buildState(): QuizState {
    return {
      questionEntity: this.questionEntity()?.name,
      tries: this.tries().map((character) => character.name),
      triesMax: this.triesMax(),
      triesEffects: this.triesEffects(),
      isQuestionComplete: this.isQuestionComplete(),
      isSuccess: this.isQuestionComplete() ? this.isSuccess() : undefined,
      difficulty: this.difficulty(),
      date: this.isDaily() ? todayString() : undefined,
    };
  }

  protected saveState(): void {
    this.progress.save(this.quizId, this.buildState(), this.isDaily(), this.ticket);
  }
}
