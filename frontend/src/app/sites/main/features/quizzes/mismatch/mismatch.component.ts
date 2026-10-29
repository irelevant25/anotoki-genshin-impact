import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChildren } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { StateService } from '../../../../../shared/state-manager.service';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { todayString } from '../shared/daily';
import { QuizDifficultyBadgeComponent } from '../shared/difficulty-badge/quiz-difficulty-badge.component';
import { FocusOnShowDirective, finePointer } from '../shared/focus-on-show.directive';
import { DAILY_DIFFICULTY } from '../shared/quiz-levels';
import { QuizLevelsService } from '../shared/quiz-levels.service';
import { QuizProgressService, hasPlay } from '../shared/quiz-progress.service';
import { MISMATCH_PROPERTIES, MismatchProperty, QuizId, QuizState } from '../shared/quiz.types';
import { GameListsService } from '../../../game-lists.service';
import { drawMismatchSet } from './mismatch-sets';

interface QuizSet {
  options: any[];
  answer: any;
  property: MismatchProperty | null;
  commonValue: string;
}

/** The keys that move between the characters: the arrows, and W A S D. */
const STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowUp: -1, a: -1, w: -1, ArrowRight: 1, ArrowDown: 1, d: 1, s: 1 };

/** A saved set's property; sets saved before 2026-10-29 named the weapon by its column. */
function propertyOf(saved: string | undefined): MismatchProperty | null {
  const property = saved === 'weapon_type' ? 'weapon' : saved;
  return MISMATCH_PROPERTIES.find((known) => known === property) ?? null;
}

/**
 * Pick the character that does not belong.
 *
 * All but one share an element, a weapon type, a region, an era or an
 * affiliation - which of them a level asks, how many characters it shows and
 * how much its odd one out looks like the rest are the levels in force
 * (QuizLevelsService); the sets are drawn by mismatch-sets.ts.
 *
 * This is the one quiz that is not "which character is this?", so it has none of
 * the tries machinery the other five share - one click ends it. It is played
 * by the keyboard as well: the arrows or A and D move between the characters,
 * Enter picks one, and Enter again moves on.
 */
@Component({
  selector: 'app-quizzes-mismatch',
  templateUrl: './mismatch.component.html',
  styleUrls: ['./mismatch.component.scss'],
  imports: [LoaderComponent, ButtonComponent, TranslatePipe, MaterialIconDirective, QuizDifficultyBadgeComponent, FocusOnShowDirective],
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class QuizzesMismatchComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _stateService = inject(StateService);
  private readonly _progress = inject(QuizProgressService);
  private readonly _levels = inject(QuizLevelsService);
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

  private readonly _level = computed(() => this._levels.level(this._quizId, this.difficulty()));
  readonly choicesAmount = computed(() => this._level().choicesAmount ?? 4);
  readonly isSuccess = computed(() => !!this.picked() && this.picked()?.name === this.quizSet()?.answer?.name);

  /** The characters' buttons, for the keys that move between them. */
  private readonly _cards = viewChildren<ElementRef<HTMLButtonElement>>('card');

  /**
   * Whether the page says which keys play it: only where there is a mouse or
   * a trackpad, which is where there is a keyboard to play with.
   */
  readonly keyboardHint = finePointer();

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

    // The levels in force beside them, as every quiz asks (CharacterQuizComponent.fetchAndRestore()).
    forkJoin({ characters: known.length ? of(known) : this._lists.charactersMinimal(), progress: this._progress.ready(), levels: this._levels.ready() }).subscribe({
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
   * The arrows and W A S D move the focus from character to character, round
   * the ends; Enter on the one focused picks it, as on any button. Keys meant
   * for something else - typed into a field, pressed in a dialog, with a
   * modifier - are left alone, and so is everything once the set is over.
   */
  onKeydown(event: KeyboardEvent): void {
    const step = STEPS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    const target = event.target instanceof Element ? event.target : null;
    if (
      !step ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      this.isQuestionComplete() ||
      target?.closest('input, textarea, select, [contenteditable="true"], dialog, [role="dialog"]')
    ) {
      return;
    }
    const cards = this._cards().map((card) => card.nativeElement);
    if (!cards.length) {
      return;
    }
    event.preventDefault();
    const current = cards.indexOf(document.activeElement as HTMLButtonElement);
    const next = current === -1 ? (step > 0 ? 0 : cards.length - 1) : (current + step + cards.length) % cards.length;
    cards[next].focus();
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
        property: propertyOf(saved.quizProperty),
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
    const set = drawMismatchSet(this.characters(), this._level());
    this.quizSet.set(set && { options: set.options, answer: set.answer, property: set.property, commonValue: set.value });
    this.picked.set(null);
    this.isQuestionComplete.set(false);
    this._saveState();
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
      quizProperty: set?.property ?? undefined,
      commonValue: set?.commonValue,
    };
    this._progress.save(this._quizId, state, this.isDaily(), this._ticket);
  }
}
