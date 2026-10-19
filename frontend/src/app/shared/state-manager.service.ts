import { Injectable } from '@angular/core';
import { QuizId, QuizState } from '../sites/main/features/quizzes/shared/quiz.types';
import { knownDifficulty } from '../sites/main/features/quizzes/shared/quiz-levels';
import { LocalStorageService } from './local-lib/services/local-storage.service';
import { HELPER } from './helper';

export interface IStateBottomMenu {
  background: string;
  /** The old site's one difficulty for every quiz, from its bottom menu: where a quiz with no choice of its own starts. */
  difficulty: string;
  /** The difficulty chosen for each quiz, in its difficulty dialog (1 easy, 2 medium, 3 hard). */
  difficulties?: Partial<Record<QuizId, number>>;
  version: string;
}

export interface IStateTopMenu {
  daily: IStateDailyMenu;
  banners: { dailyState?: QuizState; state?: QuizState };
  pixelate: { dailyState?: any; state?: any };
  mismatch: { dailyState?: any; state?: any };
  music: { dailyState?: any; state?: any };
  dish: { dailyState?: any; state?: any };
  voice: { dailyState?: any; state?: any };
  tournament: { state?: any };
  minesweeper: { state?: any };
}

export interface IStateDailyMenu {
  date: string;
  dailyQuizzes: string[];
  done: string[];
}

export interface IStateStatsDifficulty {
  losses: number;
  wins: number;
}

export interface IStateStatsCharacter {
  name: string;
  banners: IStateStatsDifficulty[];
  pixelate: IStateStatsDifficulty[];
  mismatch: IStateStatsDifficulty[];
  music: IStateStatsDifficulty[];
  dish: IStateStatsDifficulty[];
  voice: IStateStatsDifficulty[];
}

export interface IStateStatsDaily {
  date: string;
  quizzes: { quiz: string; difficulty: number; completed: boolean }[];
}

export interface IStateStats {
  characters: IStateStatsCharacter[];
  daily: IStateStatsDaily[];
}

export interface IState {
  version: string;
  stats: IStateStats;
  bottomMenu: IStateBottomMenu;
  topMenu: IStateTopMenu;
}

export const StorageKeys = {
  VERSION: 'version',
  BACKGROUND: 'background',
  STORAGE_KEY: 'app_data',
};

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private _data: IState = {
    version: '0.4',
    stats: {
      characters: [],
      daily: [],
    },
    bottomMenu: {
      background: '',
      difficulty: '1',
      difficulties: {},
      version: '',
    },
    topMenu: {
      daily: {
        date: '',
        dailyQuizzes: [],
        done: [],
      },
      banners: { dailyState: undefined, state: undefined },
      pixelate: { dailyState: undefined, state: undefined },
      mismatch: { dailyState: undefined, state: undefined },
      music: { dailyState: undefined, state: undefined },
      dish: { dailyState: undefined, state: undefined },
      voice: { dailyState: undefined, state: undefined },
      tournament: { state: undefined },
      minesweeper: { state: undefined },
    },
  };
  set data(data: IState) {
    this._data = data;
  }
  get data() {
    return this._data;
  }

  constructor(private readonly _storageService: LocalStorageService) {
    this.loadData();
  }

  /**
   * Reads back what saveData wrote.
   *
   * Without this the service only ever held its defaults - it has been writing
   * to localStorage since it was added and never reading, so every quiz began
   * again on each reload. Merged one level deep rather than assigned, so a key
   * added to the defaults since the last save is still present afterwards.
   */
  loadData(): boolean {
    try {
      const saved = localStorage.getItem(StorageKeys.STORAGE_KEY);
      if (!saved) {
        return false;
      }

      const parsed = JSON.parse(saved) as Partial<IState>;
      this._data = {
        ...this._data,
        ...parsed,
        stats: { ...this._data.stats, ...parsed.stats },
        bottomMenu: { ...this._data.bottomMenu, ...parsed.bottomMenu },
        topMenu: { ...this._data.topMenu, ...parsed.topMenu },
      };
      return true;
    } catch (error) {
      // A half-written or hand-edited entry should cost the defaults, not the
      // page.
      console.error('Error reading data from localStorage:', error);
      return false;
    }
  }

  /**
   * The difficulty chosen for a quiz in this browser: 1 easy, 2 medium, 3
   * hard. A quiz never chosen for starts where the old site's one difficulty
   * for every quiz was set, which is easy unless somebody set it there.
   *
   * Kept here, in app_data, beside the old one rather than on the server: a
   * choice of how to play, as the wallpaper is, that the result of each
   * question records anyway. Read back first, as the saved games are, for
   * another tab may have chosen since.
   */
  getQuizDifficulty(quizId: QuizId): number {
    this.loadData();
    const menu = this.data.bottomMenu;
    return knownDifficulty(menu.difficulties?.[quizId] ?? menu.difficulty);
  }

  saveQuizDifficulty(quizId: QuizId, difficulty: number): boolean {
    this.loadData();
    const menu = this.data.bottomMenu;
    menu.difficulties = { ...menu.difficulties, [quizId]: knownDifficulty(difficulty) };
    return this.saveData(this.data);
  }

  /**
   * A quiz's saved question, by name rather than by a method per quiz - the six
   * of them keep the same shape, and there is nothing for six copies to differ
   * about.
   */
  //
  // The saved games are read back from localStorage before every read and
  // write of one. Every tab of the site shares that storage but holds its own
  // copy in memory, and saveData() writes the whole copy: a tab that wrote
  // from what it read at its start would put back the games another tab has
  // since carried into an account and cleared (QuizProgressService), to be
  // carried again.
  //

  getQuizState(quizId: QuizId, daily: boolean = false): QuizState | undefined {
    this.loadData();
    const entry = this.data.topMenu[quizId];
    return daily ? entry?.dailyState : entry?.state;
  }

  saveQuizState(quizId: QuizId, state: QuizState, daily: boolean = false): boolean {
    this.loadData();
    const entry = this.data.topMenu[quizId];
    if (daily) entry.dailyState = { ...state };
    else entry.state = { ...state };
    return this.saveData(this.data);
  }

  clearQuizState(quizId: QuizId, daily: boolean = false): boolean {
    return this.clearQuizStates([quizId], daily ? [true] : [false]);
  }

  /** Clears the saved games of these quizzes, of the given kinds (free, daily), in one write. */
  clearQuizStates(quizIds: QuizId[], kinds: boolean[] = [false, true]): boolean {
    this.loadData();
    for (const quizId of quizIds) {
      const entry = this.data.topMenu[quizId];
      if (!entry) {
        continue;
      }
      if (kinds.includes(true)) {
        entry.dailyState = undefined;
      }
      if (kinds.includes(false)) {
        entry.state = undefined;
      }
    }
    return this.saveData(this.data);
  }

  getTopMenuBannersState(daily: boolean = false): QuizState | undefined {
    return this.getQuizState('banners', daily);
  }

  saveTopMenuBannersState(state: QuizState, daily: boolean = false) {
    return this.saveQuizState('banners', state, daily);
  }

  getTopMenuDailyState(): IStateDailyMenu {
    return this.data.topMenu.daily;
  }

  saveStats(quizName: keyof IStateStatsCharacter, character: any, isSuccess: boolean, difficulty: number, daily: boolean = false, quizzes = []): boolean {
    const characterStats = this.data.stats.characters.find((x) => x.name === character);
    if (!characterStats) {
      return false;
    }

    const characterQuizStats = characterStats[quizName];
    if (typeof characterQuizStats !== 'object') {
      return false;
    }

    characterQuizStats[difficulty].losses += isSuccess ? 0 : 1;
    characterQuizStats[difficulty].wins += isSuccess ? 1 : 0;

    if (daily === true) {
      const date = HELPER.getTodayString();
      let dailyStats = this.data.stats.daily.find((x) => x.date === date);
      if (!dailyStats) {
        dailyStats = { date, quizzes: [...quizzes] };
        this.data.stats.daily.push(dailyStats);
      }
      const quizStats = dailyStats.quizzes.find((x) => x.quiz === quizName);
      if (quizStats) {
        quizStats.completed = isSuccess;
        quizStats.difficulty = difficulty;
      }
      if (!this.data.topMenu.daily.done.includes(quizName)) {
        this.data.topMenu.daily.done.push(quizName);
      }
    }
    return this.saveData(this.data);
  }

  saveData(data?: IState): boolean {
    try {
      localStorage.setItem(StorageKeys.STORAGE_KEY, JSON.stringify(data ?? this.data));
      return true;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      return false;
    }
  }
}
