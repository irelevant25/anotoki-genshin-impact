import { DecimalPipe, formatNumber, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, LOCALE_ID, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, from, of, switchMap } from 'rxjs';
import { QuizActivityDay, QuizApiService, QuizDifficultyRow, QuizRecentResult, QuizStatsRow } from '../../../../api';
import { issuedAs } from '@anotoki/lib/auth';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AlertComponent } from '@anotoki/lib/ui/alert';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { CardComponent } from '@anotoki/lib/ui/card';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { AnotokiIcons, IconComponent } from '@anotoki/lib/ui/icon';
import { iconActivity, iconGamepad, iconHistory, iconUsers } from '@anotoki/lib/ui/icons';
import { ProgressBarComponent } from '@anotoki/lib/ui/progress';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { StatTileComponent, StatTilesComponent } from '@anotoki/lib/ui/stat-tiles';
import { TabsComponent } from '@anotoki/lib/ui/tabs';
import { ToastService } from '@anotoki/lib/ui/toast';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { DateFormatService, formatWith } from '../../../../shared/local-lib/i18n/date-format.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { VisitorKey } from '../../../../shared/local-lib/services/visitor-key.service';
import { MaterialIconDirective } from '../../../admin/shared/material-icon.directive';
import { VisitorNoticeComponent } from '../../common/visitor-notice/visitor-notice.component';
import { GameListsService } from '../../game-lists.service';
import { pluralTail } from '../database/shared/database-helpers';
import { DetailHeroComponent, HeroPicture, HeroStat } from '../database/shared/detail-hero/detail-hero.component';
import { FacetOption, FacetTrackComponent } from '../database/shared/facet-track/facet-track.component';
import { asOneOf, asText, asToggle, bindFiltersToUrl } from '../database/shared/filter-url';
import { ELEMENT_ORDER, inGameOrder } from '../database/shared/list-groups';
import { ListTileComponent } from '../database/shared/list-tile/list-tile.component';
import { QUIZ_CATALOG } from '../quizzes/shared/quiz-catalog';
import { QuizProgressService } from '../quizzes/shared/quiz-progress.service';
import { difficultyName } from '../quizzes/shared/quiz.types';
import { ActivityGridComponent } from './activity-grid/activity-grid.component';
import { ProfileQuizCardComponent } from './quiz-card/quiz-card.component';
import { ProfileRecentListComponent } from './recent-list/recent-list.component';
import {
  ActivityCell,
  CharacterBreakdown,
  CharacterDetails,
  CharacterSort,
  HIGHLIGHT_MIN_PLAYED,
  activityGrid,
  activitySummary,
  byCharacter,
  byDifficulty,
  byQuiz,
  cardFor,
  characterDetails,
  elementCounts,
  filterCharacters,
  heroCharacter,
  highlights,
  isQuizId,
  localToday,
  quizReports,
  sortCharacters,
  sumTotals,
} from './profile-stats';

/** The page's views, each a tab; the first is the one the address does not name. */
type ProfileTab = 'overview' | 'quizzes' | 'characters' | 'history';

const TABS: readonly ProfileTab[] = ['overview', 'quizzes', 'characters', 'history'];

/** The tabs' icons, by the names the kit's registry knows them under (registered in the constructor). */
const TAB_ICONS: Record<ProfileTab, string> = { overview: 'activity', quizzes: 'gamepad', characters: 'users', history: 'history' };

const SORTS: readonly CharacterSort[] = ['played', 'best', 'toughest', 'name'];

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
 * How many character tiles the Characters tab draws before it asks.
 *
 * A tile is two pictures - the portrait and the namecard behind it - and a
 * player who has been here a while has met most of the game: 175 tiles at
 * once would be 350 requests and a page longer than anybody scrolls. Two
 * dozen is a screen and a half, and the button under them says how many wait.
 */
const CHARACTERS_PAGE = 24;

/** The headline figures' labels, in the order the hero's strip and the empty page's preview show them. */
const FIGURE_LABELS: readonly string[] = [
  'profile.overview.played',
  'profile.overview.winRate',
  'profile.overview.attempts',
  'profile.overview.characters',
  'profile.overview.quizzes',
  'profile.overview.streak',
];

/**
 * What a player has to show for the quizzes they have played (the owner's
 * choice "D" of 2026-10-22 among the mockups): the character pages' hero worn
 * by the player - the namecard of the character they meet most behind their
 * name, that character's art, the headline figures as the strip of facts -
 * and under it four tabs, so no view scrolls far: Overview (the three
 * highlights, each quiz and each difficulty as a meter, the year's activity),
 * Quizzes (each quiz by difficulty, and who the player does best and worst
 * against in it), Characters (everyone met, as the database list's tiles,
 * filtered by element, searched, sorted, two dozen at a time) and History
 * (the activity again and the last twenty). The tab and the Characters tab's
 * filters live in the address, so Back and a shared link find the page as it
 * was.
 *
 * Four reads, all of them the player's own - a signed-in person's, or this
 * browser's visitor's (somebody playing without signing in, whose statistics
 * the server keeps under the visitor key) - and all taken from the token or
 * the key, so there is no id to pass and nothing here that could ask about
 * somebody else; and beside them the game's own list of characters, cached
 * for the page load, for the pictures and the elements the reads do not
 * carry. They are fetched together: the page is one screen and drawing it in
 * instalments would only make it jump.
 *
 * The arithmetic lives in profile-stats.ts. This holds the signals, the tab
 * and the filters, and what to do when a request fails - which, for a page
 * that is only ever a report on the past, is to show the parts that did
 * arrive. Before the first played question the page is the way in instead:
 * the six quizzes, and a preview of the figures that will fill.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    RouterLink,
    LoaderComponent,
    TranslatePipe,
    MaterialIconDirective,
    AlertComponent,
    ButtonComponent,
    CardComponent,
    TextFieldComponent,
    IconComponent,
    ProgressBarComponent,
    SegmentedComponent,
    StatTileComponent,
    StatTilesComponent,
    TabsComponent,
    DetailHeroComponent,
    FacetTrackComponent,
    ListTileComponent,
    ActivityGridComponent,
    ProfileQuizCardComponent,
    ProfileRecentListComponent,
    VisitorNoticeComponent,
  ],
})
export class ProfileComponent {
  private readonly _quizApi = inject(QuizApiService);
  private readonly _lists = inject(GameListsService);
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(ToastService);
  private readonly _i18n = inject(TranslationService);
  private readonly _locale = inject(LOCALE_ID);
  private readonly _dates = inject(DateFormatService);
  private readonly _progress = inject(QuizProgressService);
  private readonly _visitorKey = inject(VisitorKey);

  readonly loading = signal(true);

  /** True once a read has failed, so the page can say so rather than show a gap. */
  readonly failed = signal(false);

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

  private readonly _stats = signal<QuizStatsRow[]>([]);
  private readonly _difficulty = signal<QuizDifficultyRow[]>([]);
  private readonly _activity = signal<QuizActivityDay[]>([]);
  private readonly _list = signal<readonly CharacterDetails[]>([]);
  readonly recent = signal<QuizRecentResult[]>([]);

  // ── The address: the tab, and the Characters tab's filters ─────────────────

  /** One of TABS; a string, as the kit's tabs hand one back. */
  readonly activeTab = signal<string>(TABS[0]);
  readonly filterElement = signal<string | null>(null);
  readonly search = signal('');
  readonly sort = signal<CharacterSort>(SORTS[0]);

  /** How many tiles the Characters tab shows - the first page again whenever the list under them changes. */
  readonly shown = signal(CHARACTERS_PAGE);

  // ── The numbers ────────────────────────────────────────────────────────────

  private readonly _details = computed(() => characterDetails(this._list()));
  readonly totals = computed(() => sumTotals(this._stats()));
  readonly quizzes = computed(() => byQuiz(this._stats()));
  readonly quizReports = computed(() => quizReports(this._stats(), this._difficulty(), this._details()));
  readonly characters = computed(() => byCharacter(this._stats(), this._details()));
  readonly difficulties = computed(() => byDifficulty(this._difficulty()));
  readonly highlights = computed(() => highlights(this.characters()));

  /** Read by the template, to say how many questions a highlight needs. */
  readonly minPlayed = HIGHLIGHT_MIN_PLAYED;

  /** Quizzes that have actually been played, for the "5 / 6" figure. */
  readonly quizzesPlayed = computed(() => this.quizzes().filter((quiz) => quiz.totals.played > 0).length);

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

  // ── The hero ───────────────────────────────────────────────────────────────

  /** The character behind the name: the one met most that has a namecard (profile-stats). */
  readonly heroCharacter = computed(() => heroCharacter(this.characters()));
  readonly heroName = computed(() => this.user()?.username ?? this._i18n.t('profile.title'));
  readonly heroBackdrop = computed<HeroPicture | null>(() => {
    const character = this.heroCharacter();
    return character?.namecard ? { name: character.namecard, folder: 'character.namecard_background' } : null;
  });
  readonly heroSplash = computed<HeroPicture | null>(() => {
    const character = this.heroCharacter();
    return character?.splash ? { name: character.splash, folder: 'character.wish_icon' } : null;
  });

  /** Under the name: since when, and when last - or, before anything was played, what the page is waiting for. */
  readonly heroSubtitle = computed<string>(() => {
    if (this.empty()) {
      return `${this._i18n.t('profile.empty.title')} — ${this._i18n.t('profile.empty.text')}`;
    }
    const parts: string[] = [];
    const since = this.user()?.created_at;
    if (since) {
      parts.push(`${this._i18n.t('profile.memberSince')} ${this._when(since)}`);
    }
    const last = this.lastPlayed();
    if (last) {
      parts.push(`${this._i18n.t('profile.lastPlayed')} ${this._when(last, true)}`);
    }
    return parts.join(' · ');
  });

  /** The headline figures as the hero's strip of facts, written the reader's way. */
  readonly heroStats = computed<HeroStat[]>(() => {
    if (this.empty()) {
      return [];
    }
    const totals = this.totals();
    const activity = this.activity();
    return [
      { label: 'profile.overview.played', value: this._figure(totals.played) },
      { label: 'profile.overview.winRate', value: `${this._figure(totals.winRate)}%`, hint: this._i18n.t('profile.overview.wonHint', { count: this._figure(totals.wins) }) },
      { label: 'profile.overview.attempts', value: this._figure(totals.averageAttempts, 1) },
      { label: 'profile.overview.characters', value: this._figure(this.characters().length) },
      { label: 'profile.overview.quizzes', value: `${this.quizzesPlayed()} / ${this.quizzes().length}` },
      { label: 'profile.overview.streak', value: this._figure(activity.current), hint: this._i18n.t('profile.overview.longestHint', { count: this._figure(activity.longest) }) },
    ];
  });

  /** The empty page's preview of those figures, and the six quizzes it offers. */
  readonly figureLabels = FIGURE_LABELS;
  readonly quizCards = QUIZ_CATALOG;

  // ── The tabs ───────────────────────────────────────────────────────────────

  readonly tabItems = computed(() =>
    TABS.map((id) => ({
      id,
      label: this._i18n.t(`profile.tabs.${id}`),
      icon: TAB_ICONS[id],
      // A quiet number after Characters: how many there are to look through.
      count: id === 'characters' && this.characters().length ? this.characters().length : null,
    })),
  );

  // ── The Characters tab ─────────────────────────────────────────────────────

  /** The elements of the characters met, in the game's order, each with its glyph, its count and its own colours. */
  readonly elementOptions = computed<FacetOption[]>(() => {
    const counts = elementCounts(this.characters());
    return inGameOrder([...counts.keys()], ELEMENT_ORDER)
      .filter((element) => element !== 'Adaptive')
      .map((element) => ({
        value: element,
        label: element,
        picture: { name: element, folder: 'elements' },
        count: counts.get(element),
        ring: `var(--${element.toLowerCase()}-secondary-white)`,
        ink: `var(--${element.toLowerCase()}-text)`,
      }));
  });

  readonly sortChoices = computed(() => SORTS.map((value) => ({ value, label: this._i18n.t(`profile.sort.${value}`) })));

  readonly filteredCharacters = computed(() => sortCharacters(filterCharacters(this.characters(), this.filterElement(), this.search()), this.sort()));
  readonly shownCharacters = computed(() => this.filteredCharacters().slice(0, this.shown()));
  readonly hiddenCount = computed(() => Math.max(0, this.filteredCharacters().length - this.shown()));
  readonly nextPage = computed(() => Math.min(CHARACTERS_PAGE, this.hiddenCount()));

  constructor() {
    // The tabs' icons (the family's drawings), registered with the kit's icons before they are drawn: this page's own.
    inject(AnotokiIcons).register({ activity: iconActivity, gamepad: iconGamepad, users: iconUsers, history: iconHistory });

    // The tab and the filters go in the address, so a link finds the page as
    // it was left and Back from a character's page returns to the same tiles.
    // One call for all of them: the binding writes its own keys and no others.
    bindFiltersToUrl({
      tab: [this.activeTab, asOneOf(TABS, TABS[0])],
      element: [this.filterElement, asToggle],
      q: [this.search, asText],
      sort: [this.sort, asOneOf(SORTS, SORTS[0])],
    });

    // A new list under the tiles starts at its first page again.
    effect(() => {
      this.filteredCharacters();
      untracked(() => this.shown.set(CHARACTERS_PAGE));
    });

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

  quizPicture(quiz: string): string | null {
    return cardFor(quiz)?.image ?? null;
  }

  /** `quiz.difficulty.easy` and the rest, or the "before it was recorded" key. */
  difficultyLabel(difficulty: number | null): string {
    return difficulty === null ? 'profile.difficulty.unknown' : `quiz.difficulty.${difficultyName(difficulty)}`;
  }

  /** The counted sentence for n characters met - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `profile.characters.count.${pluralTail(count, this._i18n.language())}`;
  }

  /** What a tile is to the page - met most, best, toughest - as the badge in its corner, or nothing. */
  badgeFor(character: CharacterBreakdown): string | null {
    const picks = this.highlights();
    if (character.characterId === picks.mostMet?.characterId) {
      return this._i18n.t('profile.characters.mostMet');
    }
    if (character.characterId === picks.best?.characterId) {
      return this._i18n.t('profile.characters.best');
    }
    if (character.characterId === picks.toughest?.characterId) {
      return this._i18n.t('profile.characters.toughest');
    }
    return null;
  }

  badgeToneFor(character: CharacterBreakdown): 'primary' | 'success' | 'danger' | 'neutral' {
    const picks = this.highlights();
    if (character.characterId === picks.mostMet?.characterId) {
      return 'primary';
    }
    if (character.characterId === picks.best?.characterId) {
      return 'success';
    }
    return character.characterId === picks.toughest?.characterId ? 'danger' : 'neutral';
  }

  setSort(value: string): void {
    if ((SORTS as readonly string[]).includes(value)) {
      this.sort.set(value as CharacterSort);
    }
  }

  resetFilters(): void {
    this.filterElement.set(null);
    this.search.set('');
    this.sort.set(SORTS[0]);
  }

  showMore(): void {
    this.shown.update((shown) => shown + CHARACTERS_PAGE);
  }

  /**
   * The four reads and the game's list, issued as the owner the page is for.
   * A person's wait for the move of this browser's visitor first, so what
   * was played before the sign-in is counted in.
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
            // The game's list is for the pictures and the elements: without it
            // the page still has every number, so its failure is not one of
            // the profile's and raises no flag.
            list: this._lists.charactersMinimal().pipe(catchError(() => of<CharacterDetails[]>([]))),
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
        this._list.set(answers.list);
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

  /** A figure written as every `number` pipe of the site writes one (the app's LOCALE_ID), so the hero agrees with the tiles under it. */
  private _figure(value: number, decimals = 0): string {
    return formatNumber(value, this._locale, `1.${decimals}-${decimals}`);
  }

  /**
   * A moment written the reader's way - the date pipe's rule, for a sentence
   * the hero takes whole. A bare day ("2026-05-16") is that day where the
   * reader is, as the pipe reads one, never UTC midnight.
   */
  private _when(iso: string, withTime = false): string {
    const bareDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    const date = bareDay ? new Date(Number(bareDay[1]), Number(bareDay[2]) - 1, Number(bareDay[3])) : new Date(iso);
    const day = formatWith(date, this._dates.pattern().date);
    return withTime ? `${day} ${this._dates.time(date)}` : day;
  }
}
