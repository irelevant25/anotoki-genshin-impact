import { Injectable } from '@angular/core';
import { QuizId, QuizLevel, QuizState } from '../sites/main/features/quizzes/shared/quiz.types';
import { LocalStorageService } from './local-lib/services/local-storage.service';
import { HELPER } from './helper';

export interface IStateBottomMenu {
  background: string;
  difficulty: string;
  version: string;
}

export interface IStateTopMenu {
  daily: IStateDailyMenu;
  banners: { dailyState?: QuizState; state?: QuizState; };
  pixelate: { dailyState?: any; state?: any; };
  mismatch: { dailyState?: any; state?: any; };
  music: { dailyState?: any; state?: any; };
  dish: { dailyState?: any; state?: any; };
  voice: { dailyState?: any; state?: any; };
  tournament: { state?: any; };
  minesweeper: { state?: any; };
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
  quizzes: { quiz: string; difficulty: number; completed: boolean; }[];
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
}

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

  readonly APP_CONFIG = {
    topMenu: {
      banners: {
        id: 'site-banners',
        1: {
          triesMax: 5,
          triesEffects: [
            { try: 0, class: 'difficulty-3' }
          ]
        },
        2: {
          triesMax: 4,
          triesEffects: [
            { try: 0, class: 'difficulty-2 difficulty-3' },
            { try: 1, class: 'difficulty-2' }
          ]
        },
        3: {
          triesMax: 3,
          triesEffects: [
            { try: 0, class: 'difficulty-1 difficulty-2 difficulty-3' },
            { try: 1, class: 'difficulty-1 difficulty-2' },
            { try: 2, class: 'difficulty-1' }
          ]
        }
      },
      pixelate: {
        id: 'site-pixelate',
        1: {
          triesMax: 5,
          triesEffects: [
            { try: 0, data: 7 },
            { try: 1, data: 12 },
            { try: 2, data: 17 },
            { try: 3, data: 22 },
            { try: 4, data: 27 },
          ]
        },
        2: {
          triesMax: 4,
          triesEffects: [
            { try: 0, data: 6 },
            { try: 1, data: 11 },
            { try: 2, data: 16 },
            { try: 3, data: 21 },
          ]
        },
        3: {
          triesMax: 3,
          triesEffects: [
            { try: 0, data: 5 },
            { try: 1, data: 10 },
            { try: 2, data: 15 },
          ]
        }
      },
      mismatch: {
        id: 'site-mismatch',
        1: {
          choicesAmount: 3,
        },
        2: {
          choicesAmount: 4,
        },
        3: {
          choicesAmount: 5,
        }
      },
      music: {
        id: 'site-music',
        1: {
          triesMax: 5,
          triesEffects: [
            { try: 0, data: 5 },
            { try: 1, data: 10 },
            { try: 2, data: 15 },
            { try: 3, data: 20 },
          ]
        },
        2: {
          triesMax: 4,
          triesEffects: [
            { try: 0, data: 5 },
            { try: 1, data: 10 },
            { try: 2, data: 15 },
            { try: 3, data: 20 },
          ]
        },
        3: {
          triesMax: 3,
          triesEffects: [
            { try: 0, data: 5 },
            { try: 1, data: 10 },
            { try: 2, data: 15 },
          ]
        }
      },
      dish: {
        id: 'site-dish',
        1: {
          triesMax: 5,
          triesEffects: [
            { try: 0, class: 'difficulty-3' }
          ]
        },
        2: {
          triesMax: 4,
          triesEffects: [
            { try: 0, class: 'difficulty-2 difficulty-3' },
            { try: 1, class: 'difficulty-2' }
          ]
        },
        3: {
          triesMax: 3,
          triesEffects: [
            { try: 0, class: 'difficulty-1 difficulty-2 difficulty-3' },
            { try: 1, class: 'difficulty-1 difficulty-2' },
            { try: 2, class: 'difficulty-1' }
          ]
        }
      },
      voice: {
        id: 'site-voice',
        1: {
          triesMax: 5,
          triesEffects: [
            { try: 0, class: 'half-text hidden-audio' },
            { try: 1, class: 'hidden-audio' },
            { try: 2, data: 0.5 },
            { try: 3 },
            { try: 4 },
          ]
        },
        2: {
          triesMax: 4,
          triesEffects: [
            { try: 0, class: 'half-text hidden-audio' },
            { try: 1, class: 'hidden-audio' },
            { try: 2, data: 0.5 },
            { try: 3 },
          ]
        },
        3: {
          triesMax: 3,
          triesEffects: [
            { try: 0, class: 'half-text hidden-audio' },
            { try: 1, class: 'hidden-audio' },
            { try: 2, data: 0.5 },
          ]
        }
      },
      tournament: {
        id: 'site-tournament',
      }
    },

    tooltips: {
      placement: 'top',
      customClass: 'custom-tooltip',
      container: 'body'
    }
  };

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

  /** The difficulty the whole site is set to. 1 easy, 2 medium, 3 hard. */
  getDifficulty(): number {
    const difficulty = Number(this.data.bottomMenu.difficulty);
    return difficulty >= 1 && difficulty <= 3 ? difficulty : 1;
  }

  /**
   * The tries and reveal steps for one quiz at one difficulty.
   *
   * APP_CONFIG is a literal, so its entries have six different inferred shapes
   * and cannot be indexed by a QuizId without this. QuizLevel is what they all
   * actually are.
   */
  getQuizLevel(quizId: QuizId, difficulty: number): QuizLevel {
    const quiz = (this.APP_CONFIG.topMenu as unknown as Record<string, Record<number, QuizLevel>>)[quizId];
    return quiz?.[difficulty] ?? {};
  }

  /**
   * A quiz's saved question, by name rather than by a method per quiz - the six
   * of them keep the same shape, and there is nothing for six copies to differ
   * about.
   */
  getQuizState(quizId: QuizId, daily: boolean = false): QuizState | undefined {
    const entry = this.data.topMenu[quizId];
    return daily ? entry?.dailyState : entry?.state;
  }

  saveQuizState(quizId: QuizId, state: QuizState, daily: boolean = false): boolean {
    const entry = this.data.topMenu[quizId];
    if (daily) entry.dailyState = { ...state };
    else entry.state = { ...state };
    return this.saveData(this.data);
  }

  clearQuizState(quizId: QuizId, daily: boolean = false): boolean {
    const entry = this.data.topMenu[quizId];
    if (daily) entry.dailyState = undefined;
    else entry.state = undefined;
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
        this.data.topMenu.daily.done.push(quizName)
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
