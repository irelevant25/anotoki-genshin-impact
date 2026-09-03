import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { QuizActivityDay, QuizApiService, QuizDifficultyRow, QuizRecentResult, QuizStatsRow } from '../../../../api';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { SecurityService, UserInfo } from '../../../../shared/local-lib/services/security.service';
import { MaterialIconDirective } from '../../../admin/shared/material-icon.directive';
import { SiteLoginModalComponent } from '../../common/footer/site-login-modal/site-login-modal.component';
import { difficultyName } from '../quizzes/shared/quiz.types';
import { ActivityGridComponent } from './activity-grid/activity-grid.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
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

/** Weeks in the activity grid. A quarter, which fits without scrolling. */
const ACTIVITY_WEEKS = 13;

/**
 * What a player has to show for the quizzes they have played.
 *
 * Four reads, all of them the player's own and all taken from the bearer token,
 * so there is no id to pass and nothing here that could ask about somebody
 * else. They are fetched together: the page is one screen and drawing it in
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
    TabComponent,
  ],
})
export class ProfileComponent {
  private readonly _quizApi = inject(QuizApiService);
  private readonly _security = inject(SecurityService);
  private readonly _modals = inject(ModalService);

  readonly loading = signal(true);
  readonly user = signal<UserInfo | null>(null);

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

  /**
   * Who the figures on screen belong to.
   *
   * currentUserData$ emits for more than a change of account - storing a
   * renewed token pushes the same user through again - and refetching four
   * reads because a header came back would be work for nothing.
   */
  private _loadedFor: string | null = null;

  constructor() {
    this._security.currentUserData$.subscribe((user) => {
      this.user.set(user);
      if (user) {
        if (user.username !== this._loadedFor) {
          this._loadedFor = user.username;
          this._load();
        }
      } else {
        this._loadedFor = null;
        // Signing out has to clear what is on screen: none of it belongs to
        // whoever is looking now.
        this._stats.set([]);
        this._difficulty.set([]);
        this._activity.set([]);
        this.recent.set([]);
        this.loading.set(false);
      }
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

  login(): void {
    this._modals.open(SiteLoginModalComponent, { size: '2' });
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

  private _load(): void {
    this.loading.set(true);
    this.failed.set(false);

    forkJoin({
      stats: this._orNothing(this._quizApi.getQuizStats()),
      difficulty: this._orNothing(this._quizApi.getQuizStatsByDifficulty()),
      activity: this._orNothing(this._quizApi.getQuizActivity()),
      recent: this._orNothing(this._quizApi.getRecentQuizResults()),
    }).subscribe((answers) => {
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
