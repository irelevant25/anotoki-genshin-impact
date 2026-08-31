import { Component, computed, signal } from '@angular/core';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

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

const GRID_SIZE = 9;

/** How many cells the opening click clears, before the border is drawn around it. */
const START_AREA_MIN = 9;
const START_AREA_MAX = 16;

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
 * A game, not a quiz: nothing is saved, scored or sent anywhere.
 */
@Component({
  selector: 'app-games-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.scss'],
  imports: [TranslatePipe],
})
export class GamesMinesweeperComponent {
  readonly elements = ELEMENTS;
  readonly gridSize = GRID_SIZE;

  readonly reaction = signal(REACTIONS[0]);
  readonly cells = signal<Cell[]>([]);
  readonly outcome = signal<Outcome>('playing');

  /** False until the opening click, which is what lays the board out. */
  readonly started = signal(false);

  readonly revealedCount = computed(() => this.cells().filter((cell) => cell.revealed).length);
  readonly total = GRID_SIZE * GRID_SIZE;

  constructor() {
    this.newGame();
  }

  newGame(): void {
    this.reaction.set(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    this.outcome.set('playing');
    this.started.set(false);
    this.cells.set(
      Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        row: Math.floor(index / GRID_SIZE),
        col: index % GRID_SIZE,
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

    this.mutate((cells) => {
      const target = this.at(cells, cell.row, cell.col);
      target.revealed = true;

      if (target.isBomb) {
        this.outcome.set('lose');
        return;
      }

      this.workOutBorder(cells);

      // Won once nothing revealable is left: every cell is either turned over,
      // a bomb, or still beyond the edge of what has been worked out.
      if (cells.every((c) => c.revealed || c.isBomb || c.element === null)) {
        this.outcome.set('win');
      }
    });
  }

  /**
   * The opening click clears a small patch and draws elements around its edge,
   * which is what gives the first few moves something to reason from.
   */
  private openBoard(cell: Cell): void {
    this.mutate((cells) => {
      this.growStartingArea(cells, cell);
      this.workOutBorder(cells);
    });
    this.started.set(true);
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

      const known = this.neighbours(cells, cell.row, cell.col, true).filter(
        (n) => n.revealed && !n.isBomb && n.element !== null && n.element !== 'empty',
      );

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
    return cells[row * GRID_SIZE + col];
  }

  /** The eight cells around one, or the four edge-on ones when `diagonals` is false. */
  private neighbours(cells: Cell[], row: number, col: number, diagonals: boolean): Cell[] {
    const found: Cell[] = [];
    for (let r = Math.max(0, row - 1); r <= Math.min(GRID_SIZE - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(GRID_SIZE - 1, col + 1); c++) {
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
}
