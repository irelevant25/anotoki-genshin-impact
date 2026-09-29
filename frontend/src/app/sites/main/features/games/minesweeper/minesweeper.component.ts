import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { SliderComponent } from '../../../../../shared/local-lib/components/slider/slider.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';

/** The seven elements a cell can hold. */
const ELEMENTS = ['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo'] as const;
type Element = (typeof ELEMENTS)[number];

/**
 * Every reaction the game can make dangerous.
 *
 * Swirl and Crystallize appear four times each, once per element they take,
 * because a round is about one *pair* - "anemo next to pyro" is a different
 * board from "anemo next to cryo", even though the game calls both Swirl.
 */
const REACTIONS: readonly { name: string; elements: readonly [Element, Element] }[] = [
  { name: 'Vaporize', elements: ['pyro', 'hydro'] },
  { name: 'Melt', elements: ['pyro', 'cryo'] },
  { name: 'Overloaded', elements: ['pyro', 'electro'] },
  { name: 'Burning', elements: ['pyro', 'dendro'] },
  { name: 'Freeze', elements: ['hydro', 'cryo'] },
  { name: 'Electro-Charged', elements: ['hydro', 'electro'] },
  { name: 'Bloom', elements: ['hydro', 'dendro'] },
  { name: 'Swirl', elements: ['anemo', 'pyro'] },
  { name: 'Swirl', elements: ['anemo', 'hydro'] },
  { name: 'Swirl', elements: ['anemo', 'electro'] },
  { name: 'Swirl', elements: ['anemo', 'cryo'] },
  { name: 'Superconduct', elements: ['electro', 'cryo'] },
  { name: 'Quicken', elements: ['electro', 'dendro'] },
  { name: 'Crystallize', elements: ['geo', 'pyro'] },
  { name: 'Crystallize', elements: ['geo', 'hydro'] },
  { name: 'Crystallize', elements: ['geo', 'electro'] },
  { name: 'Crystallize', elements: ['geo', 'cryo'] },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

/** In slider order, which is also easiest first. */
const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

const MIN_SIZE = 8;
const MAX_SIZE = 15;
const DEFAULT_SIZE = 9;

/** Medium's whole game, and how often Hard moves the danger. */
const TIME_LIMIT_SECONDS = 60;
const REACTION_ROTATION_SECONDS = 5;

/** How many cells the opening click clears, before the border is drawn around it. */
const START_AREA_MIN = 9;
const START_AREA_MAX = 16;

// ── Scoring ──────────────────────────────────────────────────────────────────
//
// Three things decide the score, and each is a separate factor so that raising
// one cannot quietly cancel another: how hard the round was, how much of the
// board was turned over, and how long it took.

/** What one cell is worth before time is taken off it. */
const DIFFICULTY_POINTS: Record<Difficulty, number> = { easy: 10, medium: 16, hard: 24 };

/** For clearing the board without ever turning a bomb over. */
const COMPLETION_BONUS = 1.25;

/**
 * Seconds per cell at which a board is worth half of what it would have been.
 *
 * This is what makes time cost something without a cliff: at `par` the score
 * halves, at twice `par` it thirds, and it never quite reaches nothing - so a
 * slow win still beats a fast loss, which is the ordering the game wants.
 */
const PAR_SECONDS_PER_CELL = 0.5;

interface Cell {
  readonly row: number;
  readonly col: number;
  /** An element, `empty` for the opening area, or null while nothing is known. */
  element: Element | 'empty' | null;
  revealed: boolean;
  isBomb: boolean;
  /** True until the cell has enough revealed neighbours to be worth clicking. */
  hidden: boolean;
}

type Outcome = 'playing' | 'win' | 'lose';

/**
 * Minesweeper played with elemental reactions.
 *
 * There are no numbers. Each round picks one reaction - Vaporize, say - and a
 * hidden cell becomes a bomb when the revealed cells around it hold both of its
 * elements. So the board is read by looking at what is already on it: pyro to
 * the left and hydro above means the cell between them will kill you.
 *
 * Two things are chosen before a board is dealt: how big it is, and which of
 * three difficulties to take it at - all the time in the world, sixty seconds,
 * or a reaction that moves every five. Both are sliders, because both are small
 * enough ranges to see whole.
 *
 * A score comes out at the end, of a win or a loss alike. Still a game and not
 * a quiz, though: it is shown, and then it is gone. Nothing is saved or sent.
 */
@Component({
  selector: 'app-games-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.scss'],
  imports: [ButtonComponent, SliderComponent, TranslatePipe],
})
export class GamesMinesweeperComponent implements OnDestroy {
  private readonly _i18n = inject(TranslationService);

  readonly elements = ELEMENTS;
  readonly bonusPercent = Math.round((COMPLETION_BONUS - 1) * 100);

  // ── The setup screen ───────────────────────────────────────────────────────
  //
  // Widened past `number` because that is what a two-way binding to the
  // slider's own `value` model demands; everything downstream reads them back
  // through Number().

  readonly difficultyIndex = signal<number | undefined | null>(0);
  readonly size = signal<number | undefined | null>(DEFAULT_SIZE);

  readonly chosenDifficulty = computed<Difficulty>(() => DIFFICULTIES[Number(this.difficultyIndex() ?? 0)] ?? 'easy');
  readonly chosenSize = computed(() => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(this.size() ?? DEFAULT_SIZE))));

  readonly minSize = MIN_SIZE;
  readonly maxSize = MAX_SIZE;

  /**
   * Translated here rather than in the template: the slider takes plain strings
   * for its ticks, so the pipe has nothing to attach to. A computed because `t`
   * reads a signal, which is what makes them follow a change of language.
   */
  readonly difficultyTicks = computed(() => DIFFICULTIES.map((difficulty) => this._i18n.t(`game.minesweeper.difficulty.${difficulty}`)));

  readonly sizeTicks = Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, index) => String(MIN_SIZE + index));

  /**
   * The board as it reads, not as it is stored. Shown beside the label because
   * eight numbered ticks say which stop the thumb is on but not what a stop
   * means - and 9 is a board of eighty-one cells, not of nine.
   */
  readonly chosenSizeName = computed(() => `${this.chosenSize()} × ${this.chosenSize()}`);
  readonly difficultyHint = computed(() => `game.minesweeper.difficultyHint.${this.chosenDifficulty()}`);

  /** What the board being set up would pay if it were cleared instantly. */
  readonly maxScore = computed(() => this._maxFor(this.chosenDifficulty(), this.chosenSize()));

  // ── The board ──────────────────────────────────────────────────────────────
  //
  // Difficulty and size are copied here at the start rather than read from the
  // sliders, so that a game is played at what it was dealt at even if the
  // setup screen is opened again behind it.

  readonly inSetup = signal(true);
  readonly difficulty = signal<Difficulty>('easy');
  readonly boardSize = signal(DEFAULT_SIZE);

  readonly reaction = signal(REACTIONS[0]);
  readonly cells = signal<Cell[]>([]);
  readonly outcome = signal<Outcome>('playing');

  /** False until the opening click, which is what lays the board out. */
  readonly started = signal(false);

  readonly elapsed = signal(0);
  private _timer?: ReturnType<typeof setInterval>;

  /**
   * When the board was opened, and how long it was in the end.
   *
   * The clock above ticks in whole seconds because that is what is worth
   * watching; the score is settled against a tenth, because whole seconds
   * would make every game finished inside the first one worth the full
   * ceiling - which is exactly the number that is meant to be out of reach.
   */
  private _openedAt = 0;
  readonly finishedIn = signal(0);

  readonly score = signal(0);
  /** Told apart from a bomb, because they are not the same way to lose. */
  readonly ranOutOfTime = signal(false);

  readonly revealedCount = computed(() => this.cells().filter((cell) => cell.revealed).length);
  readonly total = computed(() => this.boardSize() * this.boardSize());

  readonly timeLeft = computed(() => Math.max(0, TIME_LIMIT_SECONDS - this.elapsed()));
  readonly rotationLeft = computed(() => REACTION_ROTATION_SECONDS - (this.elapsed() % REACTION_ROTATION_SECONDS));

  /** The ceiling for the board actually in play, to put the score against. */
  readonly gameMaxScore = computed(() => this._maxFor(this.difficulty(), this.boardSize()));

  readonly resultMessage = computed(() => {
    if (this.outcome() === 'win') {
      return 'game.minesweeper.win';
    }

    return this.ranOutOfTime() ? 'game.minesweeper.outOfTime' : 'game.minesweeper.lose';
  });

  ngOnDestroy(): void {
    this._stopClock();
  }

  /** Deals a board at whatever the sliders say, and shows it. */
  start(): void {
    this.difficulty.set(this.chosenDifficulty());
    this.boardSize.set(this.chosenSize());
    this.inSetup.set(false);
    this.newGame();
  }

  backToSetup(): void {
    this._stopClock();
    this.inSetup.set(true);
  }

  /** Another board at the same settings. */
  newGame(): void {
    const size = this.boardSize();

    this._stopClock();
    this.elapsed.set(0);
    this._openedAt = 0;
    this.finishedIn.set(0);
    this.score.set(0);
    this.ranOutOfTime.set(false);
    this.reaction.set(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    this.outcome.set('playing');
    this.started.set(false);
    this.cells.set(
      Array.from({ length: size * size }, (_, index) => ({
        row: Math.floor(index / size),
        col: index % size,
        element: null,
        revealed: false,
        isBomb: false,
        hidden: true,
      })),
    );
  }

  /**
   * Whether a cell can be clicked.
   *
   * Before the first click everything can, because that click only decides
   * where the board opens. Afterwards only cells that have been worked out -
   * a dimmed cell has nothing next to it to reason from, and clicking one
   * would be a guess the game never asks you to make.
   */
  isClickable(cell: Cell): boolean {
    if (this.outcome() !== 'playing') {
      return false;
    }
    return this.started() ? !cell.revealed && !cell.hidden : true;
  }

  cellContent(cell: Cell): string {
    if (!cell.revealed) {
      return '';
    }
    if (cell.isBomb) {
      return '💣';
    }
    return cell.element && cell.element !== 'empty' ? cell.element.charAt(0).toUpperCase() : '';
  }

  click(cell: Cell): void {
    if (!this.isClickable(cell)) {
      return;
    }

    if (!this.started()) {
      this.openBoard(cell);
      return;
    }

    let lost = false;

    this.mutate((cells) => {
      const target = this.at(cells, cell.row, cell.col);
      target.revealed = true;

      if (target.isBomb) {
        lost = true;
        return;
      }

      this.workOutBorder(cells);
    });

    if (lost) {
      this._finish('lose');
      return;
    }

    // Won once nothing revealable is left: every cell is either turned over,
    // a bomb, or still beyond the edge of what has been worked out.
    if (this.cells().every((c) => c.revealed || c.isBomb || c.element === null)) {
      this._finish('win');
    }
  }

  /**
   * The opening click clears a small patch and draws elements around its edge,
   * which is what gives the first few moves something to reason from.
   *
   * It is also what starts the clock. A countdown that ran while the board sat
   * untouched would be counting the time it took to decide where to click,
   * which is not the thing being timed.
   */
  private openBoard(cell: Cell): void {
    this.mutate((cells) => {
      this.growStartingArea(cells, cell);
      this.workOutBorder(cells);
    });
    this.started.set(true);
    this._openedAt = Date.now();
    this._startClock();
  }

  /**
   * Clears a patch of between nine and sixteen cells outwards from the click.
   *
   * Grown by taking a *random* cell off the frontier rather than the next one,
   * so the patch comes out as a blob rather than a tidy diamond.
   */
  private growStartingArea(cells: Cell[], from: Cell): void {
    const target = START_AREA_MIN + Math.floor(Math.random() * (START_AREA_MAX - START_AREA_MIN + 1));
    const cleared = new Set<string>();
    const frontier: [number, number][] = [[from.row, from.col]];

    while (cleared.size < target && frontier.length) {
      const [row, col] = frontier.splice(Math.floor(Math.random() * frontier.length), 1)[0];
      const key = `${row},${col}`;
      if (cleared.has(key)) {
        continue;
      }

      cleared.add(key);
      const cell = this.at(cells, row, col);
      cell.revealed = true;
      cell.isBomb = false;
      cell.element = 'empty';
      cell.hidden = false;

      for (const neighbour of this.neighbours(cells, row, col, true)) {
        if (!cleared.has(`${neighbour.row},${neighbour.col}`)) {
          frontier.push([neighbour.row, neighbour.col]);
        }
      }
    }

    // The patch is ringed with elements so it can be read outwards from. Only
    // edge-on neighbours count, which keeps the ring tight to the shape.
    for (const cell of cells) {
      if (cell.revealed) {
        continue;
      }
      const touchesPatch = this.neighbours(cells, cell.row, cell.col, false).some((n) => n.revealed && n.element === 'empty');
      if (touchesPatch) {
        cell.element = this.rollElement();
        cell.revealed = true;
        cell.hidden = false;
      }
    }
  }

  /**
   * Works out every cell that now has enough revealed neighbours to be decided.
   *
   * Two or more is the threshold, because one element on its own cannot make a
   * reaction. If those neighbours between them hold both halves of the round's
   * reaction, the cell is a bomb; otherwise it gets an element and joins the
   * part of the board you can reason about.
   */
  private workOutBorder(cells: Cell[]): void {
    for (const cell of cells) {
      if (cell.revealed) {
        continue;
      }

      const known = this.neighbours(cells, cell.row, cell.col, true).filter((n) => n.revealed && !n.isBomb && n.element !== null && n.element !== 'empty');

      if (known.length < 2) {
        continue;
      }

      const around = new Set(known.map((n) => n.element));
      if (this.reaction().elements.every((element) => around.has(element))) {
        cell.isBomb = true;
        cell.element = null;
      } else {
        cell.element = this.rollElement();
      }
      cell.hidden = false;
    }
  }

  /**
   * Picks an element, with the reaction's own two turning up about twice as
   * often as chance would give them - otherwise bombs would be rare enough
   * that the board could be cleared without ever reading it.
   */
  private rollElement(): Element {
    const dangerous = this.reaction().elements;
    const safe = ELEMENTS.filter((element) => !dangerous.includes(element));
    const pool = Math.random() < (dangerous.length / ELEMENTS.length) * 2 ? dangerous : safe;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private at(cells: Cell[], row: number, col: number): Cell {
    return cells[row * this.boardSize() + col];
  }

  /** The eight cells around one, or the four edge-on ones when `diagonals` is false. */
  private neighbours(cells: Cell[], row: number, col: number, diagonals: boolean): Cell[] {
    const size = this.boardSize();
    const found: Cell[] = [];
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        if (r === row && c === col) continue;
        if (!diagonals && r !== row && c !== col) continue;
        found.push(this.at(cells, r, c));
      }
    }
    return found;
  }

  /**
   * Runs a change over a copy of the board and publishes it.
   *
   * The algorithms above are far clearer written as mutations, and a signal
   * only notifies on a new reference, so the copy is what lets both be true.
   */
  private mutate(change: (cells: Cell[]) => void): void {
    const next = this.cells().map((cell) => ({ ...cell }));
    change(next);
    this.cells.set(next);
  }

  // ── The clock ──────────────────────────────────────────────────────────────
  //
  // One interval for all three difficulties, because everything that ticks is
  // a function of the seconds elapsed: the count up, Medium's count down, and
  // the five-second boundary Hard moves the danger on. Two timers would only
  // give them two chances to disagree about what time it is.

  private _startClock(): void {
    this._stopClock();
    this._timer = setInterval(() => this._tick(), 1000);
  }

  private _stopClock(): void {
    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  private _tick(): void {
    if (this.outcome() !== 'playing') {
      this._stopClock();
      return;
    }

    const elapsed = this.elapsed() + 1;
    this.elapsed.set(elapsed);

    if (this.difficulty() === 'medium' && elapsed >= TIME_LIMIT_SECONDS) {
      this.ranOutOfTime.set(true);
      this._finish('lose');
      return;
    }

    if (this.difficulty() === 'hard' && elapsed % REACTION_ROTATION_SECONDS === 0) {
      this._rotateReaction();
    }
  }

  /**
   * Moves the danger onto a different pair, and works the board out again.
   *
   * Revealed cells keep their elements - those are facts on the board, and one
   * that rewrote its own history could not be read at all. Everything still
   * face down is decided afresh against the new reaction, which is the whole
   * point: the cell that was safe a moment ago may not be now.
   */
  private _rotateReaction(): void {
    const current = this.reaction();
    let next = current;

    // A different one. Rolling the same pair again would read as the timer
    // having failed rather than as a round where nothing happened to change.
    while (next === current && REACTIONS.length > 1) {
      next = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    }

    this.reaction.set(next);

    this.mutate((cells) => {
      for (const cell of cells) {
        if (cell.revealed) {
          continue;
        }
        cell.isBomb = false;
        cell.element = null;
        cell.hidden = true;
      }
      this.workOutBorder(cells);
    });
  }

  // ── Scoring ────────────────────────────────────────────────────────────────

  private _finish(outcome: 'win' | 'lose'): void {
    this._stopClock();
    this.outcome.set(outcome);

    // The same tenth of a second is both shown and scored against, so the two
    // numbers in the result can always be checked against each other.
    const seconds = this._openedAt ? Math.round((Date.now() - this._openedAt) / 100) / 10 : 0;

    this.finishedIn.set(seconds);
    this.score.set(this._scoreFor(outcome, seconds));
  }

  /** What a board of this size at this difficulty is worth at its very best. */
  private _maxFor(difficulty: Difficulty, size: number): number {
    return Math.round(size * size * DIFFICULTY_POINTS[difficulty] * COMPLETION_BONUS);
  }

  /**
   * The score, of a win or a loss alike.
   *
   * A loss pays for as much of the board as was turned over, so a game lost on
   * the last cell is worth more than one lost on the second. A win pays for the
   * whole board however many cells the layout left unreachable - finishing is
   * finishing - plus the bonus for never having turned a bomb over.
   *
   * The time factor is the reason the number on the setup screen cannot be
   * earned: it is below one for any elapsed time at all, and only reaches one
   * at the instant the board opened. Rounded down rather than to nearest, so
   * that a board cleared very fast comes close to the ceiling without ever
   * being rounded up onto it.
   */
  private _scoreFor(outcome: 'win' | 'lose', seconds: number): number {
    const size = this.boardSize();
    const base = size * size * DIFFICULTY_POINTS[this.difficulty()];
    const par = size * size * PAR_SECONDS_PER_CELL;

    const timeFactor = par / (par + seconds);
    const progress = outcome === 'win' ? 1 : this.revealedCount() / (size * size);
    const bonus = outcome === 'win' ? COMPLETION_BONUS : 1;

    return Math.floor(base * progress * timeFactor * bonus);
  }
}
