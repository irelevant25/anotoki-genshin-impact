import { afterNextRender, Component, computed, ElementRef, inject, Injector, OnDestroy, signal, viewChild, viewChildren } from '@angular/core';
import { AlertComponent } from '@anotoki/lib/ui/alert';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SliderComponent, SliderTick } from '@anotoki/lib/ui/slider';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { GameListsService } from '../../../game-lists.service';
import { finePointer } from '../../quizzes/shared/focus-on-show.directive';
import { dealPexeso, judgeSelection, PEXESO_LEVEL_ORDER, PEXESO_LEVELS, PexesoCard, PexesoCharacter, PexesoDeal, PexesoLevel } from './pexeso-board';

/** How long a turn that failed stays face up, marked, before it turns back down. */
const WRONG_MS = 900;

/** How often the clock is read: a new second shows within a quarter of one, however late the timer runs. */
const TICK_MS = 250;

/** The cards shown to be remembered, then the turns, then every group found. */
type Phase = 'look' | 'play' | 'won';

/** A card as it lies: face down, shown to be remembered, turned this turn, in a group found, or in a turn that failed. */
type CardState = 'down' | 'shown' | 'turned' | 'found' | 'wrong';

interface CardView {
  /** Its place in the @for: a new deal's cards are new buttons, never the last deal's with its pictures still in them. */
  readonly key: string;
  readonly card: PexesoCard;
  readonly state: CardState;
  /** Whether a press turns it: face down, while the turns are played and no failed turn is still showing. */
  readonly playable: boolean;
}

/** The keys that move the focus between the cards - the arrows, and W A S D -, as steps across and down. */
const STEPS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
  ArrowUp: [0, -1],
  w: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
};

function stateOf(card: PexesoCard, phase: Phase, found: ReadonlySet<number>, turned: readonly number[], wrong: readonly number[]): CardState {
  if (wrong.includes(card.id)) {
    return 'wrong';
  }
  if (found.has(card.id)) {
    return 'found';
  }
  if (turned.includes(card.id)) {
    return 'turned';
  }
  return phase === 'look' ? 'shown' : 'down';
}

/**
 * Pexeso - Memory: find every group on a board of face-down cards.
 *
 * A group is a character's card and a card for each kind of what they are -
 * their element, weapon type or region; which kinds, the deal draws for each
 * game (pexeso-board.ts, which holds the deal and the rule of a turn). The
 * cards are shown for a few seconds first, then turned down, and the clock
 * starts. A turn turns cards one at a time until it is a group - it stays
 * face up, found - or until it can no longer become one, when it shows as
 * wrong for a moment and turns back down.
 *
 * A game, not a quiz: nothing is saved or sent, and leaving the page ends it.
 */
@Component({
  selector: 'app-games-pexeso',
  templateUrl: './pexeso.component.html',
  styleUrls: ['./pexeso.component.scss'],
  imports: [AlertComponent, ButtonComponent, SliderComponent, TranslatePipe, MaterialIconDirective],
})
export class GamesPexesoComponent implements OnDestroy {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);
  private readonly _injector = inject(Injector);

  /** True until the characters are here: Start waits for them. */
  readonly loading = signal(true);
  private readonly _characters = signal<readonly PexesoCharacter[]>([]);

  // ── The setup screen ───────────────────────────────────────────────────────
  //
  // The kit's slider, as Minesweeper's: its three stops' words under it, and
  // heard - "Easy, Medium, Hard", never "0, 1, 2" - with the chosen level's
  // hint tied to it.

  readonly levels = PEXESO_LEVEL_ORDER;
  readonly levelIndex = signal(0);
  readonly chosenLevel = computed<PexesoLevel>(() => PEXESO_LEVEL_ORDER[this.levelIndex()] ?? 'easy');

  /** Translated here, as the slider takes plain words for its ticks; a computed, as `t` reads a signal - the words follow a change of language. */
  readonly levelTicks = computed<SliderTick[]>(() => PEXESO_LEVEL_ORDER.map((level, index) => ({ value: index, label: this._i18n.t(`game.pexeso.difficulty.${level}`) })));
  readonly levelHint = computed(() => `game.pexeso.difficultyHint.${this.chosenLevel()}`);

  // ── The board ──────────────────────────────────────────────────────────────
  //
  // The level is copied at the start rather than read from the slider, so a
  // game is played at what it was dealt at.

  readonly inSetup = signal(true);
  readonly level = signal<PexesoLevel>('easy');
  /** The board, or null when too few characters could be dealt one. */
  readonly deal = signal<PexesoDeal | null>(null);
  readonly phase = signal<Phase>('look');
  /** The seconds left to look at the cards. */
  readonly lookLeft = signal(0);
  /** The seconds played, from the moment the cards turned down. */
  readonly elapsed = signal(0);
  readonly turns = signal(0);

  /** Bumped by every deal: the cards' keys. */
  private readonly _round = signal(0);
  private readonly _found = signal<ReadonlySet<number>>(new Set());
  /** The cards of the turn being played, in the order turned. */
  private readonly _turned = signal<readonly number[]>([]);
  /** The cards of a turn that failed, while they show as wrong. */
  private readonly _wrong = signal<readonly number[]>([]);

  readonly side = computed(() => PEXESO_LEVELS[this.level()].side);
  readonly columns = computed(() => `repeat(${this.side()}, minmax(0, 1fr))`);
  readonly foundGroups = computed(() => this._found().size / (this.deal()?.groupSize ?? 1));

  /**
   * What a group is on this board: a character and their kinds, named and
   * joined as the reader's language joins a list - by the language's locale,
   * as the quizzes' difficulty dialog joins Mismatch's properties: British
   * English writes "element, weapon type and region", where the bare `en`
   * would put a comma before the "and".
   */
  readonly groupRule = computed(() => {
    const kinds = (this.deal()?.kinds ?? []).map((kind) => this._i18n.t(`game.pexeso.kind.${kind}`));
    return this._i18n.t('game.pexeso.group', { kinds: new Intl.ListFormat(this._i18n.locale(), { type: 'conjunction' }).format(kinds) });
  });

  readonly cards = computed<readonly CardView[]>(() => {
    const deal = this.deal();
    if (!deal) {
      return [];
    }
    const round = this._round();
    const phase = this.phase();
    const found = this._found();
    const turned = this._turned();
    const wrong = this._wrong();
    return deal.cards.map((card) => {
      const state = stateOf(card, phase, found, turned, wrong);
      return { key: `${round}:${card.id}`, card, state, playable: phase === 'play' && wrong.length === 0 && state === 'down' };
    });
  });

  private readonly _cardButtons = viewChildren<ElementRef<HTMLButtonElement>>('card');
  private readonly _again = viewChild('again', { read: ElementRef });
  private readonly _actions = viewChild<ElementRef<HTMLElement>>('actions');

  /** One timer for the countdown and the clock alike: both are the time since a moment, read on every tick. */
  private _clock?: ReturnType<typeof setInterval>;
  private _wrongTimer?: ReturnType<typeof setTimeout>;
  private _lookEndsAt = 0;
  private _startedAt = 0;

  constructor() {
    this._lists.charactersMinimal().subscribe({
      next: (characters) => {
        this._characters.set(characters);
        this.loading.set(false);
      },
      // No characters to deal from: a board says there are not enough of them.
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this._stopTimers();
  }

  /** Deals a board at the level the slider says, and shows it. */
  start(): void {
    this.level.set(this.chosenLevel());
    this.inSetup.set(false);
    this._deal();
  }

  /** Another board at the same level. */
  playAgain(): void {
    this._deal();
  }

  backToSetup(): void {
    this._stopTimers();
    this.deal.set(null);
    this.inSetup.set(true);
  }

  /**
   * Turns a card, and judges the turn (judgeSelection()): still open, a group
   * found - it stays face up -, or failed - shown as wrong, then turned back
   * down; a found or a failed one is a turn. A card face up, a press before
   * the cards have turned down or while a failed turn still shows, is ignored.
   */
  flip(card: PexesoCard): void {
    const deal = this.deal();
    const found = this._found();
    const turned = this._turned();
    if (!deal || this.phase() !== 'play' || this._wrong().length || found.has(card.id) || turned.includes(card.id)) {
      return;
    }

    const ids = [...turned, card.id];
    const selection = judgeSelection(
      deal.cards.filter((each) => ids.includes(each.id)),
      deal.cards.filter((each) => !found.has(each.id)),
      deal.groupSize,
    );
    if (selection === 'open') {
      this._turned.set(ids);
      return;
    }

    this.turns.update((turns) => turns + 1);
    this._turned.set([]);

    if (selection === 'failed') {
      this._wrong.set(ids);
      this._wrongTimer = setTimeout(() => {
        this._wrongTimer = undefined;
        this._wrong.set([]);
      }, WRONG_MS);
      return;
    }

    // Any group found leaves a board that can still be finished (judgeSelection()), so there is nothing to check here.
    const nowFound = new Set(found);
    for (const id of ids) {
      nowFound.add(id);
    }
    this._found.set(nowFound);
    if (nowFound.size === deal.cards.length) {
      this._win();
    }
  }

  /**
   * The arrows and W A S D move the focus from card to card - along the row
   * and on into the next one, or a row up or down -, so that a board of 36 is
   * not 36 presses of Tab; Enter or Space turns the card focused, as on any
   * button. With a modifier, or past the board's edge, a key is left alone.
   */
  onBoardKeydown(event: KeyboardEvent): void {
    const step = STEPS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!step || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const buttons = this._cardButtons().map((button) => button.nativeElement);
    const from = buttons.indexOf(event.target as HTMLButtonElement);
    const to = from + step[0] + step[1] * this.side();
    if (from === -1 || to < 0 || to >= buttons.length) {
      return;
    }
    event.preventDefault();
    buttons[to].focus();
  }

  private _deal(): void {
    this._stopTimers();
    const deal = dealPexeso(this._characters(), this.level());
    this._round.update((round) => round + 1);
    this.deal.set(deal);
    this._found.set(new Set());
    this._turned.set([]);
    this._wrong.set([]);
    this.turns.set(0);
    this.elapsed.set(0);
    if (!deal) {
      return;
    }

    const seconds = PEXESO_LEVELS[deal.level].lookSeconds;
    this.phase.set('look');
    this.lookLeft.set(seconds);
    this._lookEndsAt = Date.now() + seconds * 1000;
    this._clock = setInterval(() => this._tick(), TICK_MS);

    // For whoever plays from the keyboard, the first card takes the focus, without a scroll - only where the
    // pointer is fine, as the quizzes' Next does (finePointer()).
    afterNextRender(
      () => {
        if (finePointer()) {
          this._cardButtons()[0]?.nativeElement.focus({ preventScroll: true });
        }
      },
      { injector: this._injector },
    );
  }

  private _tick(): void {
    const now = Date.now();
    if (this.phase() === 'look') {
      const left = Math.ceil((this._lookEndsAt - now) / 1000);
      if (left > 0) {
        this.lookLeft.set(left);
        return;
      }
      // Every card down at once, and the clock starts: the seconds spent looking are not the game's.
      this.phase.set('play');
      this._startedAt = now;
      return;
    }
    if (this.phase() === 'play') {
      this.elapsed.set(this._secondsPlayed(now));
    }
  }

  /**
   * Every group found: the clock stops on the seconds it shows, and the words
   * come in sight under the board - where the pointer is fine Play again
   * takes the focus, for the next game from the keyboard.
   */
  private _win(): void {
    this.elapsed.set(this._secondsPlayed(Date.now()));
    this.phase.set('won');
    this._stopTimers();
    afterNextRender(
      () => {
        this._actions()?.nativeElement.scrollIntoView({ block: 'nearest' });
        if (finePointer()) {
          this._again()?.nativeElement.focus({ preventScroll: true });
        }
      },
      { injector: this._injector },
    );
  }

  private _secondsPlayed(now: number): number {
    return Math.max(0, Math.floor((now - this._startedAt) / 1000));
  }

  private _stopTimers(): void {
    if (this._clock !== undefined) {
      clearInterval(this._clock);
      this._clock = undefined;
    }
    if (this._wrongTimer !== undefined) {
      clearTimeout(this._wrongTimer);
      this._wrongTimer = undefined;
    }
  }
}
