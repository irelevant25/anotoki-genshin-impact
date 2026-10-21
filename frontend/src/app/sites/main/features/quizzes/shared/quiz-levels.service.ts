import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, timeout } from 'rxjs';
import { QuizLevelApiService } from '../../../../../api';
import { QUIZ_LEVELS, QuizLevels, levelOf, usableLevels } from './quiz-levels';
import { QuizId, QuizLevel } from './quiz.types';

/**
 * How long a quiz waits for the levels in force, at most: they are asked
 * beside its characters, which take longer, so this is only ever reached when
 * the answer is lost - and then the built-in levels are played.
 */
const LEVELS_WAIT_MS = 2500;

/**
 * The quizzes' levels in force: what the admin panel's Quiz levels page saved
 * (GET /api/quiz/levels), or the built-in ones (quiz-levels.ts, QUIZ_LEVELS)
 * while nothing is saved, while the answer is on its way and whenever there is
 * none - an error, a refusal, an answer that is no levels, no answer within
 * LEVELS_WAIT_MS. A quiz never breaks or waits on this.
 *
 * Asked once a page load, by the first quiz that wants them (ready(), which
 * every quiz joins to its characters, so a question is drawn at the levels
 * in force), and settled once: an answer after the wait is no longer heard,
 * so the levels never change under a question being played. The answer is
 * ETag + no-cache, so asking again on the next page load costs a 304 while
 * nothing changed.
 */
@Injectable({ providedIn: 'root' })
export class QuizLevelsService {
  private readonly _api = inject(QuizLevelApiService);
  private readonly _levels = signal<QuizLevels>(QUIZ_LEVELS);
  private _settled: Observable<void> | null = null;

  /** The levels in force: the built-in ones until the server has said others. */
  readonly levels = this._levels.asReadonly();

  /** Emits once and completes when the levels are settled - the server's, or the built-in ones; never fails. */
  ready(): Observable<void> {
    return (this._settled ??= this._api.getQuizLevels().pipe(
      timeout(LEVELS_WAIT_MS),
      map((answer) => usableLevels(answer?.levels)),
      catchError(() => of(null)),
      tap((levels) => {
        if (levels !== null) {
          this._levels.set(levels);
        }
      }),
      map((): void => undefined),
      shareReplay(1),
    ));
  }

  /** One level of one quiz, as it is in force; an unknown one is nothing. */
  level(quizId: QuizId, difficulty: number): QuizLevel {
    return levelOf(this._levels(), quizId, difficulty);
  }
}
