/**
 * The bracket behind the tournament game.
 *
 * Kept apart from the component because it is the only part with rules worth
 * getting wrong: the component shows two faces and reports which was clicked,
 * and everything about who meets whom is decided here.
 *
 * Nothing in here touches storage. A tournament exists while it is being played
 * and is gone afterwards.
 */

export type TournamentFormat = 'single' | 'double' | 'roundRobin';

export const TOURNAMENT_SIZES = [8, 16, 32, 64] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

/** Which part of a double-elimination bracket a match belongs to. */
export type Bracket = 'upper' | 'lower' | 'final';

export interface Match<T> {
  readonly a: T;
  readonly b: T;
  readonly bracket?: Bracket;
}

export interface Placing<T> {
  readonly entrant: T;
  /** Round robin counts wins; the knockouts have none to show. */
  readonly wins?: number;
}

/** How many matches a format takes, which is fixed before a ball is kicked. */
export function totalMatches(format: TournamentFormat, size: number): number {
  if (format === 'single') return size - 1;
  if (format === 'double') return size * 2 - 2;
  return (size * (size - 1)) / 2;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Pairs a round off, and says who was left over.
 *
 * The schedule below only ever hands this an even number, but it reports the
 * odd one out rather than dropping it: quietly losing an entrant is how a
 * bracket ends up playing fewer matches than it should, which is exactly the
 * bug this returns to make impossible.
 */
function pairUp<T>(entrants: readonly T[], bracket?: Bracket): { matches: Match<T>[]; bye?: T } {
  const matches: Match<T>[] = [];
  for (let i = 0; i + 1 < entrants.length; i += 2) {
    matches.push({ a: entrants[i], b: entrants[i + 1], bracket });
  }
  return { matches, bye: entrants.length % 2 ? entrants[entrants.length - 1] : undefined };
}

/** Lines survivors up against arrivals so they meet rather than each other. */
function interleave<T>(survivors: readonly T[], arrivals: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(survivors.length, arrivals.length); i++) {
    if (i < survivors.length) out.push(survivors[i]);
    if (i < arrivals.length) out.push(arrivals[i]);
  }
  return out;
}

export class Tournament<T extends { name: string }> {
  private _queue: Match<T>[] = [];
  private _played = 0;

  /** Still standing in the winners' half, or everyone left in a knockout. */
  private _upper: T[] = [];
  /** Double elimination only: still alive after one loss. */
  private _lower: T[] = [];
  /** Double elimination only: just knocked out of the upper half. */
  private _dropped: T[] = [];
  private _wins = new Map<string, number>();
  private _placings: Placing<T>[] = [];

  readonly total: number;

  constructor(
    readonly format: TournamentFormat,
    readonly entrants: readonly T[],
  ) {
    this.total = totalMatches(format, entrants.length);

    if (format === 'roundRobin') {
      // Every pair once, in a jumbled order so the same face does not come up
      // several times in a row.
      const pairs: Match<T>[] = [];
      for (let i = 0; i < entrants.length; i++) {
        for (let j = i + 1; j < entrants.length; j++) {
          pairs.push({ a: entrants[i], b: entrants[j] });
        }
      }
      this._queue = shuffle(pairs);
      return;
    }

    const opening = pairUp(entrants, format === 'double' ? 'upper' : undefined);
    this._queue = opening.matches;
    this._upper = opening.bye ? [opening.bye] : [];
  }

  get current(): Match<T> | undefined {
    return this._queue[0];
  }

  get played(): number {
    return this._played;
  }

  get isOver(): boolean {
    return this._placings.length > 0;
  }

  /** First, second and third once it is over - or just the champion, for a knockout. */
  get placings(): readonly Placing<T>[] {
    return this._placings;
  }

  /** Records the winner of the match on offer and sets up the next one. */
  pick(winner: T): void {
    const match = this.current;
    if (!match || this.isOver) {
      return;
    }

    const loser = match.a.name === winner.name ? match.b : match.a;
    this._queue.shift();
    this._played++;
    this._wins.set(winner.name, (this._wins.get(winner.name) ?? 0) + 1);

    if (this.format === 'roundRobin') {
      if (!this._queue.length) this._finishRoundRobin();
      return;
    }

    if (this.format === 'single') {
      this._upper.push(winner);
      if (!this._queue.length) this._advanceSingle();
      return;
    }

    if (match.bracket === 'final') {
      // The grand final settles first and second. Third was settled by whoever
      // last went out of the lower bracket.
      this._placings = [{ entrant: winner }, { entrant: loser }, ...(this._thirdPlace ? [{ entrant: this._thirdPlace }] : [])];
      return;
    }

    if (match.bracket === 'upper') {
      this._upper.push(winner);
      this._dropped.push(loser);
    } else {
      this._lower.push(winner);
      // The last one knocked out of the lower half finished third, so the most
      // recent loser there is always the standing answer.
      this._thirdPlace = loser;
    }

    if (!this._queue.length) this._advanceDouble();
  }

  private _thirdPlace?: T;

  private _advanceSingle(): void {
    if (this._upper.length === 1) {
      this._placings = [{ entrant: this._upper[0] }];
      return;
    }
    const round = pairUp(this._upper);
    this._queue = round.matches;
    this._upper = round.bye ? [round.bye] : [];
  }

  /**
   * Schedules the next double-elimination round.
   *
   * The order matters more than it looks. A cycle is: the upper half plays and
   * drops its losers, the lower half takes those arrivals in (a *major* round),
   * then halves itself again (a *minor* round). Get that order wrong - run the
   * minor before the upper half plays, say - and the major arrives with fewer
   * survivors than droppers, leaving somebody unpaired and the bracket short of
   * matches.
   *
   * The rules are checked in this order, and the first that fits is the next
   * round.
   */
  private _advanceDouble(): void {
    // 1. One left on each side and nobody still falling: the grand final.
    if (this._upper.length === 1 && this._lower.length === 1 && !this._dropped.length) {
      this._queue = [{ a: this._upper[0], b: this._lower[0], bracket: 'final' }];
      return;
    }

    // 2. Somebody has just fallen, so the lower half deals with them first.
    if (this._dropped.length) {
      const entrants = this._lower.length ? interleave(this._lower, this._dropped) : this._dropped;
      this._lower = [];
      this._dropped = [];
      this._schedule(entrants, 'lower');
      return;
    }

    // 3. The lower half is bigger than the next batch of droppers will need it
    //    to be, so it halves itself.
    if (this._lower.length > 1 && this._lower.length > this._upper.length / 2) {
      const entrants = this._lower;
      this._lower = [];
      this._schedule(entrants, 'lower');
      return;
    }

    // 4. Both halves are in step - the upper one plays.
    if (this._upper.length > 1) {
      const entrants = this._upper;
      this._upper = [];
      this._schedule(entrants, 'upper');
      return;
    }

    // Nothing left to schedule: whoever is standing has won it.
    this._placings = [{ entrant: this._upper[0] ?? this._lower[0] }];
  }

  /** Queues a round, carrying any unpaired entrant through to the next one. */
  private _schedule(entrants: T[], bracket: Bracket): void {
    const round = pairUp(entrants, bracket);
    this._queue = round.matches;
    if (round.bye) {
      if (bracket === 'upper') this._upper.push(round.bye);
      else this._lower.push(round.bye);
    }
    if (!round.matches.length) {
      this._advanceDouble();
    }
  }

  private _finishRoundRobin(): void {
    // Everyone is ranked, but only the top three are shown; someone who never
    // won still needs a row in the count so the ranking is complete.
    const ranked = this.entrants
      .map((entrant) => ({ entrant, wins: this._wins.get(entrant.name) ?? 0 }))
      .sort((a, b) => b.wins - a.wins);

    this._placings = ranked.slice(0, 3);
  }
}
