import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { defer, finalize, firstValueFrom, from, Observable, of, shareReplay, tap } from 'rxjs';
import { AnotokiAuth, type Caller, issuedAs, SavesInFlight } from '@anotoki/lib/auth';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { VisitorKey } from '../../../../../shared/local-lib/services/visitor-key.service';
import { signedInSilently } from '../../../../../shared/silent-sign-in';
import { StateService } from '../../../../../shared/state-manager.service';
import { QuizId, QuizState } from './quiz.types';
import { ALL_QUIZZES, todayString } from './daily';
import { QuizApiService, QuizCarryResult, QuizProgress, QuizResultRequest } from '../../../../../api';

/**
 * Whose saved games are being played: a signed-in person's (by id), this
 * browser's visitor's (kept by the server under the visitor key), or the
 * browser's own - nobody has an account here yet.
 */
export type ProgressOwner = 'browser' | 'visitor' | `person:${number}`;

/** Why this page load stopped making a visitor: the server is full or busy (429 / 503), or a visitor's cap was met. */
export type VisitorRefusal = 'busy' | 'full' | null;

/** One game the browser holds, as the carry route takes it. */
interface BrowserGame {
  quiz: QuizId;
  is_daily: boolean;
  state: QuizState;
}

/**
 * Whether a saved game holds a play: a try made, or the question over (a
 * mismatch pick). A freshly drawn question - which every quiz saves the moment
 * its page is opened - holds none, and never makes a visitor. The same rule as
 * quizStateHasPlay() in quiz_progress.php.
 */
export function hasPlay(state: QuizState | undefined): state is QuizState {
  return !!state && ((state.tries?.length ?? 0) > 0 || state.isQuestionComplete === true);
}

/** The family's refusal code in an API error's body (`{error, code}`), or null. */
function apiErrorCode(error: HttpErrorResponse): string | null {
  const code = (error.error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : null;
}

/**
 * Where a quiz's progress lives.
 *
 * - **A signed-in person's** games and statistics are their account's, on the
 *   server, and follow them between machines.
 * - **A visitor's** - somebody playing without signing in, while the site does
 *   not require it and the server keeps visitors - are on the server too,
 *   under a visitor of their own that the server made on their first save with
 *   a play, and kept for a month after their last visit (api/visitors.php,
 *   VisitorKey). Signing in moves them into the account.
 * - **The browser** keeps the games only while nobody has an account here:
 *   before a visitor's first play, while the server keeps no visitors (the
 *   database update that makes them is not applied), or after it refused to
 *   make one (full, busy). Its statistics are kept nowhere then, as before.
 *
 * Once there is an owner on the server, nothing is written to the browser any
 * more: a person who signs out leaves no games behind for whoever comes next.
 * The browser's own games are carried in once - when a visitor is made (the
 * game just played among them) and when a person's games are first loaded
 * after a sign-in - and then cleared from it; the server keeps the account's
 * game where both have one, and a daily of another day never moves. After a
 * silent sign-in (the IAM's hint, no click) an account that already has
 * something here takes none of them in, and the browser keeps them (`stayed`,
 * the owner's decision of 2026-10-11) - as VisitorKey's move does.
 *
 * Who a request is for is decided here as it is issued (`issuedAs()`), never
 * by the interceptor from whether a token happens to be there.
 *
 * The pages hold a game in memory, so they hold a **ticket**: `ticket()` as
 * they restored or started, passed back with every save and result. When the
 * owner changes under an open page - a person's session ends (a failed
 * refresh, a sign-out in another tab), another tab signs in or makes a
 * visitor, the move brings a visitor's games into the account - the ticket
 * moves on: a save under an old ticket is dropped, and `restarts` tells the
 * pages to load again for the new owner. A person's game is never saved as
 * anybody else's, and never makes a visitor. A visitor this tab made itself is
 * the one change that is not one: the same game goes on, now on the server.
 */
@Injectable({ providedIn: 'root' })
export class QuizProgressService {
  private readonly _quizApi = inject(QuizApiService);
  private readonly _stateService = inject(StateService);
  private readonly _security = inject(SecurityService);
  private readonly _visitorKey = inject(VisitorKey);
  private readonly _saves = inject(SavesInFlight);
  private readonly _auth = inject(AnotokiAuth);

  /** Whose saved games are being played now. */
  readonly owner = computed<ProgressOwner>(() => {
    const id = this._security.currentUser()?.id;
    if (id !== undefined && id !== null) {
      return `person:${id}`;
    }
    return this._visitorKey.active() ? 'visitor' : 'browser';
  });

  /** The server's saved games of `_loadedFor`. */
  private readonly _remote = new Map<string, QuizState>();

  /** Whose saved games `_remote` holds, once they have arrived ('browser': nothing to fetch). */
  private _loadedFor: ProgressOwner | null = null;

  /** The load in progress, shared by everything that asks for the same owner meanwhile. */
  private _loading: { owner: ProgressOwner; done: Observable<void> } | null = null;

  private _ticket = 0;
  private _ticketOwner: ProgressOwner | null = null;

  /** The visitor key this tab's own make brought - see `ticket()`. */
  private _madeKey: string | null = null;

  /** The make in progress: resolves true once the visitor exists and holds the browser's games. */
  private _making: Promise<boolean> | null = null;

  /** Saves that arrived while a make was on its way: sent again as the visitor's once it exists. */
  private readonly _joined = new Map<string, BrowserGame>();

  /** Results recorded just before the save that makes the visitor: posted as its once it exists. */
  private _waitingResults: QuizResultRequest[] = [];

  /** No visitor is made for the rest of this page load (refused, or a person's session ended under it). */
  private _makingPaused = false;

  /**
   * Bumped whenever a saved game changes.
   *
   * The games live in a Map and in local storage, neither of which a zoneless
   * app can watch. Anything that shows how far along a quiz is - the daily
   * cards, the count on the menu - reads this so it recomputes when a question
   * is answered rather than only when the page is next drawn.
   */
  readonly version = signal(0);

  /** Bumped when the owner changed under the open pages: they load again (see the class). */
  readonly restarts = signal(0);

  /** Why making a visitor stopped for this page load - for the shell's toast. */
  readonly refusal = signal<VisitorRefusal>(null);

  /** The browser's games carried into an account or a visitor at its first load, when any were - for the shell's toast. */
  readonly carried = signal<QuizCarryResult | null>(null);

  constructor() {
    // The owner changed: what is held belongs to somebody else now.
    effect(() => {
      this.owner();
      untracked(() => this.ticket());
    });

    // A move brought a visitor's games into the account after they were
    // loaded (a move asked again after a sign-in had given up on it).
    let movesSeen: number | null = null;
    effect(() => {
      const moves = this._visitorKey.moves();
      untracked(() => {
        const first = movesSeen === null;
        movesSeen = moves;
        if (!first && this._loadedFor?.startsWith('person:')) {
          this._newTicket();
        }
      });
    });
  }

  /**
   * The ticket a page holds while it plays (see the class), checked against
   * the owner now - so a change is seen at once, not only when the effect
   * that watches the owner runs.
   */
  ticket(): number {
    const owner = this.owner();
    const previous = this._ticketOwner;
    if (owner === previous) {
      return this._ticket;
    }
    this._ticketOwner = owner;
    if (previous === null) {
      return this._ticket;
    }
    // This tab's own visitor, just made: the same games, now kept by the server.
    if (previous === 'browser' && owner === 'visitor' && this._madeKey !== null && this._madeKey === this._visitorKey.key()) {
      return this._ticket;
    }
    // A person's session ended under an open page: what it holds is theirs,
    // and the next guess there must not make a visitor of it. The browser
    // keeps whatever is played for the rest of this page load.
    if (previous.startsWith('person:') && !owner.startsWith('person:')) {
      this._makingPaused = true;
    }
    this._newTicket();
    return this._ticket;
  }

  /**
   * Emits once the saved games are in hand, so a quiz knows whether it is
   * resuming or starting fresh before it draws anything.
   *
   * For the browser there is nothing to wait for. For a person it waits for
   * the move of this browser's visitor first (VisitorKey.settledMove()), then
   * reads their games and carries the browser's in; for a visitor it reads
   * theirs and carries the browser's in. One load per owner at a time, however
   * many ask.
   */
  ready(): Observable<void> {
    return defer(() => {
      this.ticket();
      const owner = this.owner();

      if (owner === 'browser') {
        this._loadedFor = 'browser';
        return of(undefined);
      }
      if (this._loadedFor === owner) {
        return of(undefined);
      }
      if (this._loading?.owner !== owner) {
        this._loading = { owner, done: from(this._load(owner)).pipe(shareReplay({ bufferSize: 1, refCount: false })) };
      }
      return this._loading.done;
    });
  }

  get(quizId: QuizId, daily: boolean): QuizState | undefined {
    const owner = this.owner();
    if (owner === 'browser') {
      return this._stateService.getQuizState(quizId, daily);
    }
    return this._loadedFor === owner ? this._remote.get(this._key(quizId, daily)) : undefined;
  }

  /** Saves the game a page holds under `ticket` - dropped when the owner has changed since (the page restarts). */
  save(quizId: QuizId, state: QuizState, daily: boolean, ticket: number): void {
    if (ticket !== this.ticket()) {
      return;
    }

    const owner = this.owner();

    if (owner === 'browser') {
      this._stateService.saveQuizState(quizId, state, daily);
      this.version.update((n) => n + 1);

      if (this._making) {
        this._joined.set(this._key(quizId, daily), { quiz: quizId, is_daily: daily, state });
      } else if (this._mayMake() && hasPlay(state)) {
        this._make();
      }
      return;
    }

    this._remote.set(this._key(quizId, daily), state);
    this.version.update((n) => n + 1);
    this._put({ quiz: quizId, is_daily: daily, state }, owner === 'visitor' ? 'visitor' : 'person');
  }

  /**
   * Records a finished question - one row in the log, and the running total
   * moved on, which the server does together.
   *
   * For a person or a visitor. A result never makes a visitor by itself: it is
   * recorded just before the save that ends the question, and that save makes
   * the visitor - the result waits for it and is then posted as the visitor's.
   * While the browser keeps the games, it is kept nowhere, as before.
   */
  recordResult(quizId: QuizId, characterId: number | undefined, win: boolean, attempts: number, difficulty: number, ticket: number): void {
    if (!characterId || ticket !== this.ticket()) {
      return;
    }

    const body: QuizResultRequest = { quiz: quizId, character_id: characterId, win, attempts, difficulty };
    const owner = this.owner();

    if (owner !== 'browser') {
      this._post(body, owner === 'visitor' ? 'visitor' : 'person');
      return;
    }
    if (!this._mayMake()) {
      return;
    }
    if (this._making) {
      const done = this._saves.begin();
      this._making.then((made) => made && this._post(body, 'visitor')).finally(done);
      return;
    }

    // Taken by the make the next save starts - in the same turn, as both quiz
    // kinds record the result and then save. Dropped if none does.
    this._waitingResults.push(body);
    queueMicrotask(() => {
      const index = this._waitingResults.indexOf(body);
      if (index >= 0) {
        this._waitingResults.splice(index, 1);
      }
    });
  }

  /** Whether a save of the browser's may make a visitor now. */
  private _mayMake(): boolean {
    return this._visitorKey.visiting() && !this._makingPaused && this._visitorKey.key() === null;
  }

  /**
   * Makes this browser's visitor: nobody's carry of every game the browser
   * holds with a play - read after the save that triggered it was written, so
   * that game is among them. Once at a time: what is saved meanwhile joins it
   * and is sent again as the visitor's, and a result recorded meanwhile waits
   * for it.
   */
  private _make(): void {
    const games = this._carryable();
    const results = this._waitingResults.splice(0);
    const done = this._saves.begin();
    this._visitorKey.lastMade = null;

    this._making = (async (): Promise<boolean> => {
      try {
        await firstValueFrom(
          this._quizApi.carryQuizProgress({ games }, issuedAs('visitor')).pipe(
            // In the same turn as the interceptor kept the key the answer
            // brought: the games are the visitor's from now on, here too.
            tap((result) => {
              const held = this._visitorKey.current();
              if (held !== null && held === this._visitorKey.lastMade) {
                this._madeKey = held;
                this._fill('visitor', result.games);
              }
            }),
          ),
        );

        const held = this._visitorKey.current();
        if (held === null) {
          // Nobody was made after all (the site began to require a sign-in on the way).
          return false;
        }
        if (this._visitorKey.lastMade !== held) {
          // Another tab's visitor was there first, and its key stays: this
          // tab's games go into that one too. The visitor this request made
          // holds nothing anybody can reach, and goes with the sweep.
          await firstValueFrom(this._quizApi.carryQuizProgress({ games }, issuedAs('visitor')));
        }

        this._clearBrowserGames();
        for (const game of this._joined.values()) {
          if (this._loadedFor === 'visitor') {
            this._remote.set(this._key(game.quiz, game.is_daily), game.state);
          }
          this._put(game, 'visitor');
        }
        results.forEach((body) => this._post(body, 'visitor'));
        this.version.update((n) => n + 1);
        return true;
      } catch (error) {
        this._refused(error);
        return false;
      } finally {
        this._making = null;
        this._joined.clear();
        done();
      }
    })();
  }

  /** What a refused make or result means for the rest of this page load. */
  private _refused(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      return;
    }
    const code = apiErrorCode(error);
    if (error.status === 429 || (error.status === 503 && code === 'visitors_unavailable')) {
      // Full or not ready: the games stay in the browser for this page load,
      // and nothing more is tried until the next.
      this._makingPaused = true;
      this.refusal.set('busy');
    } else if (error.status === 422 && code === 'visitor_limit') {
      this.refusal.set('full');
    }
    // Anything else - a network gone, a 401 when the site began to require a
    // sign-in - leaves the next played save to try again.
  }

  /** Loads `owner`'s games (see `ready()`). Never rejects: a quiz that cannot reach them starts a new one. */
  private async _load(owner: ProgressOwner): Promise<void> {
    const ticket = this._ticket;
    const caller: Caller = owner === 'visitor' ? 'visitor' : 'person';
    const current = (): boolean => this._ticket === ticket && this.owner() === owner;

    try {
      if (caller === 'person') {
        await this._visitorKey.settledMove();
      }
      if (!current()) {
        return;
      }

      const games = await firstValueFrom(this._quizApi.getQuizProgress(issuedAs(caller)));
      if (!current()) {
        return;
      }

      // The browser's own games, carried in once: the account's game stays
      // where both have one, a daily of another day never moves. Cleared from
      // the browser afterwards - and so are the ones not worth carrying (a
      // fresh draw, yesterday's daily): the browser keeps no games of an
      // owner the server knows. But after a silent sign-in (the IAM's hint,
      // no click) an account that has its own here takes none in (`stayed`,
      // the owner's decision of 2026-10-11): the browser keeps them, for when
      // nobody is signed in here again or the person signs in themselves.
      const browserGames = this._carryable();
      let held = games;
      if (browserGames.length) {
        const silent = caller === 'person' && signedInSilently(untracked(this._auth.sub));
        const result = await firstValueFrom(this._quizApi.carryQuizProgress({ games: browserGames, silent }, issuedAs(caller)));
        if (!result.stayed) {
          this._clearBrowserGames();
        }
        if (result.carried > 0) {
          this.carried.set(result);
        }
        if (!current()) {
          return;
        }
        held = result.games;
      } else {
        this._clearBrowserGames();
      }

      this._fill(owner, held);
    } catch {
      // Asked again by the next page that wants them.
    } finally {
      if (this._loading?.owner === owner) {
        this._loading = null;
      }
    }
  }

  /** `_remote` becomes `owner`'s games, as the server answered them. */
  private _fill(owner: ProgressOwner, games: QuizProgress[]): void {
    this._remote.clear();
    // The server stores a saved game as an opaque blob - what is in it is
    // this side's business - so its shape is asserted here rather than typed
    // across the wire.
    games.forEach((game) => this._remote.set(this._key(game.quiz as QuizId, game.is_daily), game.state as unknown as QuizState));
    this._loadedFor = owner;
    this.version.update((n) => n + 1);
  }

  /** The browser's games worth carrying: those with a play - free ones, and today's dailies. */
  private _carryable(): BrowserGame[] {
    const today = todayString();
    const games: BrowserGame[] = [];
    for (const quiz of ALL_QUIZZES) {
      for (const daily of [false, true]) {
        const state = this._stateService.getQuizState(quiz, daily);
        if (hasPlay(state) && (!daily || state.date === today)) {
          games.push({ quiz, is_daily: daily, state });
        }
      }
    }
    return games;
  }

  private _clearBrowserGames(): void {
    this._stateService.clearQuizStates(ALL_QUIZZES);
  }

  /**
   * The signed-in person's saved games were deleted elsewhere - their own, on
   * the admin panel's People page: nothing held is theirs any more, and the
   * open pages load again (saving what is held would only put it back).
   * Nothing for a visitor's games or the browser's own.
   */
  forgetPersonGames(): void {
    if (this._loadedFor?.startsWith('person:') || this._loading?.owner.startsWith('person:')) {
      this._newTicket();
    }
  }

  /** The owner changed under the open pages: nothing held is theirs; they load again. */
  private _newTicket(): void {
    this._ticket++;
    this._ticketOwner = this.owner();
    this._remote.clear();
    this._loadedFor = null;
    this._loading = null;
    this.restarts.update((n) => n + 1);
    this.version.update((n) => n + 1);
  }

  private _put(game: BrowserGame, caller: Caller): void {
    const done = this._saves.begin();
    this._quizApi
      .updateQuizProgress(game.quiz, { state: game.state, is_daily: game.is_daily }, issuedAs(caller))
      .pipe(finalize(done))
      // Nothing to tell the player per guess. The game is in memory either
      // way, and the next save that lands puts the server right.
      .subscribe({ error: () => undefined });
  }

  private _post(body: QuizResultRequest, caller: Caller): void {
    const done = this._saves.begin();
    this._quizApi
      .submitQuizResult(body, issuedAs(caller))
      .pipe(finalize(done))
      .subscribe({ error: (error: unknown) => this._refused(error) });
  }

  private _key(quizId: QuizId, daily: boolean): string {
    return `${quizId}:${daily}`;
  }
}
