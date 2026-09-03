import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { StateService } from '../../../../../shared/state-manager.service';
import { QuizId, QuizState } from './quiz.types';
import { QuizApiService } from '../../../../../api';

/**
 * Where a quiz's progress lives.
 *
 * Two places, for two kinds of visitor. Signed in, a saved game belongs to the
 * account and follows the player between machines, so it goes to the database.
 * Not signed in there is no account to hang it on, and it stays in the browser
 * the way it always did - the site is a public reference work and playing a
 * quiz has never required signing in.
 *
 * localStorage is written either way. For a signed-in player it is a mirror
 * rather than the record: if the network write fails, the game is still there
 * to carry on with, and the next successful save puts it right.
 */
@Injectable({ providedIn: 'root' })
export class QuizProgressService {
  private readonly _quizApi = inject(QuizApiService);
  private readonly _stateService = inject(StateService);
  private readonly _securityService = inject(SecurityService);

  private readonly _isLoggedIn = signal(false);
  private readonly _remote = new Map<string, QuizState>();
  private _loaded = false;

  /**
   * Bumped whenever a saved game changes.
   *
   * The games live in a Map and in local storage, neither of which a zoneless
   * app can watch. Anything that shows how far along a quiz is - the daily
   * cards, the count on the menu - reads this so it recomputes when a question
   * is answered rather than only when the page is next drawn.
   */
  readonly version = signal(0);

  constructor() {
    this._securityService.isLoggedIn$.subscribe((isLoggedIn) => {
      this._isLoggedIn.set(isLoggedIn);
      // Signing out must not leave the previous account's games readable, and
      // signing in has to fetch rather than trust what is already here.
      if (!isLoggedIn) {
        this._remote.clear();
        this._loaded = false;
      }
      this.version.update((n) => n + 1);
    });
  }

  /**
   * Emits once the saved games are in hand, so a quiz knows whether it is
   * resuming or starting fresh before it draws anything.
   *
   * For a visitor who is not signed in there is nothing to wait for, and this
   * completes without a request.
   */
  ready(): Observable<void> {
    if (!this._isLoggedIn() || this._loaded) {
      return of(undefined);
    }

    return this._quizApi.getQuizProgress().pipe(
      tap((games) => {
        this._remote.clear();
        // The server stores a saved game as an opaque blob - what is in it is
        // this side's business - so its shape is asserted here rather than typed
        // across the wire.
        games.forEach((game) =>
          this._remote.set(this._key(game.quiz as QuizId, game.is_daily), game.state as unknown as QuizState),
        );
        this._loaded = true;
        this.version.update((n) => n + 1);
      }),
      map(() => undefined),
      // A quiz that cannot reach its saved game should start a new one, not
      // refuse to load.
      catchError(() => of(undefined)),
    );
  }

  get(quizId: QuizId, daily: boolean): QuizState | undefined {
    return this._isLoggedIn() ? this._remote.get(this._key(quizId, daily)) : this._stateService.getQuizState(quizId, daily);
  }

  save(quizId: QuizId, state: QuizState, daily: boolean): void {
    this._stateService.saveQuizState(quizId, state, daily);
    this.version.update((n) => n + 1);

    if (!this._isLoggedIn()) {
      return;
    }

    this._remote.set(this._key(quizId, daily), state);
    this._quizApi.updateQuizProgress(quizId, { state, is_daily: daily }).subscribe({
      // Nothing to tell the player: the game is safe in the browser either way,
      // and a notification per guess would be its own annoyance.
      error: () => undefined,
    });
  }

  /**
   * Records a finished question - one row in the log, and the running total
   * moved on, which the server does together.
   *
   * Only for signed-in players. Statistics are a property of an account, and
   * there is nothing to attach them to without one.
   */
  recordResult(quizId: QuizId, characterId: number | undefined, win: boolean, attempts: number, difficulty: number): void {
    if (!this._isLoggedIn() || !characterId) {
      return;
    }

    this._quizApi
      .submitQuizResult({ quiz: quizId, character_id: characterId, win, attempts, difficulty })
      .subscribe({ error: () => undefined });
  }

  private _key(quizId: QuizId, daily: boolean): string {
    return `${quizId}:${daily}`;
  }
}
