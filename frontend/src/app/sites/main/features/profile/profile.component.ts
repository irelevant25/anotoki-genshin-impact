import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, catchError, forkJoin, from, of, switchMap } from 'rxjs';
import { QuizActivityDay, QuizApiService, QuizDifficultyRow, QuizRecentResult, QuizStatsRow } from '../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { ToastService } from '@anotoki/lib/ui/toast';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { VisitorKey } from '../../../../shared/local-lib/services/visitor-key.service';
import { issuedAs } from '@anotoki/lib/auth';
import { QuizProgressService } from '../quizzes/shared/quiz-progress.service';
import { MaterialIconDirective } from '../../../admin/shared/material-icon.directive';
import { difficultyName } from '../quizzes/shared/quiz.types';
import { ActivityGridComponent } from './activity-grid/activity-grid.component';
import { VisitorNoticeComponent } from '../../common/visitor-notice/visitor-notice.component';
import { TabsComponent } from '@anotoki/lib/ui/tabs';
import {
  ActivityCell,
  CharacterBreakdown,
  HIGHLIGHT_MIN_PLAYED,
  activityGrid,
  activitySummary,
  byCharacter,
  byDifficulty,
  byQuiz,
  cardFor,
  highlights,
  isQuizId,
  localToday,
  sumTotals,
} from './profile-stats';

/** How the character table can be ordered. */
type CharacterSort = 'played' | 'winRate' | 'name';

/**
 * Weeks in the activity grid.
 *
 * A year, which is what /api/quiz/activity returns and what the grid is now
 * wide enough to draw: at a quarter it was thirteen columns of fixed-width
 * squares stranded in the left fifth of a full-width page. Fifty-two rather
 * than fifty-three so the oldest column is inside the year the read covers.
 */
const ACTIVITY_WEEKS = 52;

/**
 * What a player has to show for the quizzes they have played.
 *
 * Four reads, all of them the player's own - a signed-in person's, or this
 * browser's visitor's (somebody playing without signing in, whose statistics
 * the server keeps under the visitor key) - and all taken from the token or
 * the key, so there is no id to pass and nothing here that could ask about
 * somebody else. They are fetched together: the page is one screen and drawing it in
 * four instalments would only make it jump.
 *
 * The arithmetic lives in profile-stats.ts. This holds the signals, the sort
 * the table is under, and what to do when a request fails - which, for a page
 * that is only ever a report on the past, is to show the parts that did arrive.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    RouterModule,
    DecimalPipe,
    LoaderComponent,
    TranslatePipe,
    AppDatePipe,
    MaterialIconDirective,
    ButtonComponent,
    ActivityGridComponent,
    TabsComponent,
    VisitorNoticeComponent,
  ],
})
export class ProfileComponent {
  private readonly _quizApi = inject(QuizApiService);
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(ToastService);
  private readonly _i18n = inject(TranslationService);
  private readonly _progress = inject(QuizProgressService);
  private readonly _visitorKey = inject(VisitorKey);

  readonly loading = signal(true);

  /** The two long breakdowns, one on screen at a time (see the template). */
  readonly activeTab = signal('characters');
  readonly tabItems = computed(() => [
    { id: 'characters', label: this._i18n.t('profile.characters.title') },
    { id: 'recent', label: this._i18n.t('profile.recent.title') },
  ]);
  readonly user = this._security.currentUser;

  /**
   * Whether the reader plays as a visitor here (nobody signed in, sign-in not
   * required, the server keeps visitors): the page is theirs too, under a
   * heading of its own - empty until their first played question.
   */
  readonly visiting = this._visitorKey.visiting;

  /** Whose figures are on screen - see the constructor. */
  private readonly _owner = this._progress.owner;

  /** Bumped per load, so an answer for somebody who is no longer reading is dropped. */
  private _loads = 0;

  /** True once a read has failed, so the page can say so rather than show a gap. */
  readonly failed = signal(false);

  private readonly _stats = signal<QuizStatsRow[]>([]);
  private readonly _difficulty = signal<QuizDifficultyRow[]>([]);
  private readonly _activity = signal<QuizActivityDay[]>([]);
  readonly recent = signal<QuizRecentResult[]>([]);

  // ── The numbers ────────────────────────────────────────────────────────────

  readonly totals = computed(() => sumTotals(this._stats()));
  readonly quizzes = computed(() => byQuiz(this._stats()));
  readonly characters = computed(() => byCharacter(this._stats()));
  readonly difficulties = computed(() => byDifficulty(this._difficulty()));
  readonly highlights = computed(() => highlights(this.characters()));

  /** Read by the template, to say how many questions a highlight needs. */
  readonly minPlayed = HIGHLIGHT_MIN_PLAYED;

  /** Quizzes that have actually been played, for the "5 of 6" line. */
  readonly quizzesPlayed = computed(() => this.quizzes().filter((quiz) => quiz.totals.played > 0).length);

  /** The busiest quiz sets the scale, so the bars compare against each other. */
  readonly busiestQuiz = computed(() => Math.max(1, ...this.quizzes().map((quiz) => quiz.totals.played)));

  private readonly _today = localToday();
  readonly activity = computed(() => activitySummary(this._activity(), this._today));
  readonly activityCells = computed<ActivityCell[]>(() => activityGrid(this._activity(), ACTIVITY_WEEKS, this._today));

  /** Nothing has been played at all - a different page from one with a gap in it. */
  readonly empty = computed(() => this.totals().played === 0);

  /**
   * When the last question was finished, or null for somebody who never has.
   *
   * Taken from the recent list, which the server already orders newest first,
   * rather than from the activity days - those are dates with no time on them,
   * and "yesterday" is a worse answer than "yesterday at nine".
   */
  readonly lastPlayed = computed<string | null>(() => this.recent()[0]?.created_at ?? null);

  // ── The character table ────────────────────────────────────────────────────

  readonly sort = signal<CharacterSort>('played');
  readonly sortDescending = signal(true);

  readonly sortedCharacters = computed<CharacterBreakdown[]>(() => {
    const key = this.sort();
    const direction = this.sortDescending() ? -1 : 1;

    return [...this.characters()].sort((a, b) => {
      if (key === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }
      // A tie on either number is broken by the name, so the order is stable
      // and a re-sort never shuffles equal rows about.
      const difference = key === 'played' ? a.totals.played - b.totals.played : a.totals.winRate - b.totals.winRate;
      return difference * direction || a.name.localeCompare(b.name);
    });
  });

  constructor() {
    // Keyed on whose figures they are rather than on the whole record, which
    // is replaced for more than a change of account - a date format saved, a
    // role changed at the IAM - and refetching four reads for that would be
    // work for nothing. Again after a move brought a visitor's statistics in.
    effect(() => {
      const owner = this._owner();
      this._visitorKey.moves();

      untracked(() => {
        this._loads++;
        if (owner !== 'browser') {
          this._load(owner === 'visitor' ? 'visitor' : 'person');
          return;
        }
        // Signing out has to clear what is on screen: none of it belongs to
        // whoever is looking now. Nor does anybody's, before a visitor's
        // first played question - there is nothing on the server to read.
        this._stats.set([]);
        this._difficulty.set([]);
        this._activity.set([]);
        this.recent.set([]);
        this.loading.set(false);
      });
    });
  }

  toggleSort(key: CharacterSort): void {
    if (this.sort() === key) {
      this.sortDescending.update((descending) => !descending);
      return;
    }

    this.sort.set(key);
    // Names read best from A, numbers from the top.
    this.sortDescending.set(key !== 'name');
  }

  /** Off to the IAM's sign-in, coming back to this page. */
  login(): void {
    this._security.login().catch(() => this._notifications.error(this._i18n.t('auth.startFailed')));
  }

  /** The route a quiz's own page is at, or null for a name the site cannot place. */
  quizLink(quiz: string): string[] | null {
    const card = cardFor(quiz);
    return card && isQuizId(quiz) ? ['/', 'quizzes', card.path] : null;
  }

  quizTitle(quiz: string): string {
    return cardFor(quiz)?.title ?? quiz;
  }

  /** `quiz.difficulty.easy` and the rest, or the "before it was recorded" key. */
  difficultyLabel(difficulty: number | null): string {
    return difficulty === null ? 'profile.difficulty.unknown' : `quiz.difficulty.${difficultyName(difficulty)}`;
  }

  /**
   * The four reads, issued as the owner the page is for. A person's wait for
   * the move of this browser's visitor first, so what was played before the
   * sign-in is counted in.
   */
  private _load(caller: 'person' | 'visitor'): void {
    const run = this._loads;
    this.loading.set(true);
    this.failed.set(false);

    const context = issuedAs(caller);
    const moved = caller === 'person' ? from(this._visitorKey.settledMove()) : of(undefined);

    moved
      .pipe(
        switchMap(() =>
          forkJoin({
            stats: this._orNothing(this._quizApi.getQuizStats(context)),
            difficulty: this._orNothing(this._quizApi.getQuizStatsByDifficulty(context)),
            activity: this._orNothing(this._quizApi.getQuizActivity(context)),
            recent: this._orNothing(this._quizApi.getRecentQuizResults(context)),
          }),
        ),
      )
      .subscribe((answers) => {
        if (run !== this._loads) {
          return;
        }
        this._stats.set(answers.stats);
        this._difficulty.set(answers.difficulty);
        this._activity.set(answers.activity);
        this.recent.set(answers.recent);
        this.loading.set(false);
      });
  }

  /**
   * One failure should not take the rest of the page with it.
   *
   * Each read falls back to nothing and raises the flag, so a page with three
   * of its four answers draws those three and says the fourth is missing -
   * rather than showing an empty profile to somebody who has played plenty.
   */
  private _orNothing<T>(source: Observable<T[]>): Observable<T[]> {
    return source.pipe(
      catchError(() => {
        this.failed.set(true);
        return of<T[]>([]);
      }),
    );
  }
}
