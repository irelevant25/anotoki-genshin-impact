import { Injectable } from '@angular/core';
import { IBannersState } from '../sites/main/features/quizzes/banners/banners.component';
import { LocalStorageService } from './local-lib/services/local-storage.service';
import { HELPER } from './helper';

export interface IStateBottomMenu {
  background: string;
  difficulty: string;
  version: string;
}

export interface IStateTopMenu {
  daily: IStateDailyMenu;
  banners: { dailyState?: IBannersState; state?: IBannersState; };
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

  constructor(private readonly _storageService: LocalStorageService) { }

  getTopMenuBannersState(daily: boolean = false): IBannersState | undefined {
    if (daily === true) return this.data.topMenu.banners.dailyState;
    else return this.data.topMenu.banners.state;
  }

  saveTopMenuBannersState(state: IBannersState, daily: boolean = false) {
    if (daily === true) this.data.topMenu.banners.dailyState = { ...state };
    else this.data.topMenu.banners.state = { ...state };
    return this.saveData(this.data);
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
