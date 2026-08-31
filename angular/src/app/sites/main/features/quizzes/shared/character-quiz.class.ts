import { computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { StateService } from '../../../../../shared/state-manager.service';
import { QuizProgressService } from './quiz-progress.service';
import { QuizId, QuizState, difficultyName } from './quiz.types';

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
  protected readonly httpClient = inject(HttpClient);
  protected readonly stateService = inject(StateService);
  protected readonly progress = inject(QuizProgressService);
  private readonly _activatedRoute = inject(ActivatedRoute);

  /** Picks the difficulty config and the slot the saved game lives in. */
  protected abstract readonly quizId: QuizId;

  /**
   * Whether a character can be the answer. Music overrides it to ask only about
   * characters with a demo track, dish only about those with a special dish.
   */
  protected canAsk(character: any): boolean {
    return !!character;
  }

  /** Called once a question is settled, whether drawn fresh or restored. */
  protected onQuestionChanged(): void {}

  readonly characters = signal<any[]>([]);
  readonly loading = signal(true);
  readonly isDaily = signal(false);

  readonly questionEntity = signal<any>(null);
  readonly tries = signal<any[]>([]);
  readonly isQuestionComplete = signal(false);
  readonly difficulty = signal(1);

  readonly difficultyString = computed(() => difficultyName(this.difficulty()));

  private readonly _level = computed(() => this.stateService.getQuizLevel(this.quizId, this.difficulty()));
  readonly triesMax = computed(() => this._level().triesMax ?? 5);
  readonly triesEffects = computed(() => this._level().triesEffects ?? []);

  /**
   * How the question is hidden right now. Nothing once it is over - the whole
   * point of finishing is seeing the answer plainly.
   */
  readonly currentEffect = computed(() =>
    this.isQuestionComplete() ? undefined : this.triesEffects().find((effect) => effect.try === this.tries().length),
  );

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
      if (index < slots.length) slots[index] = character;
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
  protected readonly answerable = computed(() =>
    this.characters().filter((character) => !character.is_traveler && this.canAsk(character)),
  );

  /**
   * The pool every quiz works from: the character list, which is both what a
   * question is drawn from and what the search box offers.
   *
   * Overridable because the dish quiz needs each character's dish attached, and
   * that lives in another table.
   */
  protected fetchCharacters(): Observable<any[]> {
    return this.httpClient.get<any[]>('/api/characters/minimal');
  }

  protected load(): void {
    this._activatedRoute.data.subscribe((data) => this.isDaily.set(!!data['daily']));
    this.difficulty.set(this.stateService.getDifficulty());

    // The saved game is fetched alongside the characters rather than after
    // them: neither needs the other, and a quiz cannot decide whether it is
    // resuming until both have arrived.
    forkJoin({ characters: this.fetchCharacters(), progress: this.progress.ready() }).subscribe({
      next: ({ characters }) => {
        this.characters.set(characters);
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
   * than restored half-formed.
   */
  protected restoreOrStart(): void {
    const saved = this.progress.get(this.quizId, this.isDaily());
    const character = saved?.questionEntity ? this.characters().find((x) => x.name === saved.questionEntity) : undefined;

    if (saved && character && this.canAsk(character)) {
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
      this.progress.recordResult(this.quizId, this.questionEntity()?.id, this.isSuccess(), this.tries().length, this.difficulty());
    }

    this.onQuestionChanged();
    this.saveState();
  }

  next(): void {
    this.newQuestion();
  }

  protected saveState(): void {
    const state: QuizState = {
      questionEntity: this.questionEntity()?.name,
      tries: this.tries().map((character) => character.name),
      triesMax: this.triesMax(),
      triesEffects: this.triesEffects(),
      isQuestionComplete: this.isQuestionComplete(),
      difficulty: this.difficulty(),
    };
    this.progress.save(this.quizId, state, this.isDaily());
  }
}
