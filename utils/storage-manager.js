(() => {
    'use strict';

    class StorageManager {
        static STORAGE_KEY = 'app_data';
        static DEFAULT_DATA = {
            version: '0.3',
            stats: {
                // 1, 2 and 3  (1 - easy, 2 - medium, 3 - hard), [0, 0] - [looses, wins]
                characters: CHARACTERS.map(x => ({
                    name: x.name,
                    banners: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                    pixelate: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                    mismatch: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                    music: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                    dish: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                    voice: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                })),
                // array of objects d - date and q - quizzes { d: string date 'YYYY-MM-DD', q: array of quiz names (strings) } with q suffix
                // '1' or '2' or '3' for difficulty (1 - easy, 2 - medium, 3 - hard) }
                // and with prefix
                // '-' if not completed or '+' if completed
                daily: [],
            },
            bottomMenu: {
                background: '',
                difficulty: '1',
                version: ''
            },
            topMenu: {
                daily: {
                    // string date 'YYYY-MM-DD'
                    date: '',
                    // array of quiz names (strings)
                    dailyQuizzes: [],
                    // array of quiz names (strings)
                    done: []
                },
                banners: {
                    dailyState: null,
                    state: null
                },
                pixelate: {
                    dailyState: null,
                    state: null
                },
                mismatch: {
                    dailyState: null,
                    state: null
                },
                music: {
                    dailyState: null,
                    state: null
                },
                tournament: {
                    dailyState: null,
                    state: null
                },
                dish: {
                    dailyState: null,
                    state: null
                },
                voice: {
                    dailyState: null,
                    state: null
                }
            }
        };

        constructor() {
            this.data = null;
        }

        init() {
            this._loadData();
            if (!this.data.version || this.data.version !== StorageManager.DEFAULT_DATA.version) {
                this.data = migrate(this.data);
                this.saveData(this.data);
            }
            return this.data;
        }

        _loadData() {
            try {
                if (this.data) return { ...this.data };

                const data = localStorage.getItem(StorageManager.STORAGE_KEY);
                if (!data) {
                    this.data = StorageManager.DEFAULT_DATA;
                    this.saveData(this.data);
                    return;
                }

                this.data = JSON.parse(data);
                return this.data;
            } catch (error) {
                console.error('Error loading data from localStorage:', error);
                this.data = StorageManager.DEFAULT_DATA;
                this.saveData(this.data);
                return this.data;
            }
        }

        saveData(data) {
            try {
                localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(data ?? this.data));
                return true;
            } catch (error) {
                console.error('Error saving data to localStorage:', error);
                return false;
            }
        }

        clearData() {
            try {
                localStorage.removeItem(StorageManager.STORAGE_KEY);
                this.dataCache = null;
                return true;
            } catch (error) {
                console.error('Error clearing data from localStorage:', error);
                return false;
            }
        }

        /////////////////
        // BOTTOM MENU //
        /////////////////

        // DOFFICULTY

        getDifficulty() {
            return this.data.bottomMenu.difficulty;
        }

        saveDifficulty(difficulty) {
            this.data.bottomMenu.difficulty = difficulty;
            return this.saveData(this.data);
        }

        // BACKGROUND

        getBackground() {
            return this.data.bottomMenu.background === '' ? null : this.data.bottomMenu.background;
        }

        saveBackground(background) {
            this.data.bottomMenu.background = background;
            return this.saveData(this.data);
        }

        // VERSION

        getLastVersion() {
            return this.data.bottomMenu.lastVersion === '' ? null : this.data.bottomMenu.lastVersion;
        }

        saveLastVersion(version) {
            this.data.bottomMenu.lastVersion = version;
            return this.saveData(this.data);
        }

        // STATS

        getStats(quizName, daily = false) {
            if (daily === true) return this.data.stats.daily.filter(x => x.quizzes.includes(quizName));
            else return this.data.stats.characters.map(x => x[quizName]);
        }

        saveStats(quizName, character, isSuccess, difficulty, daily = false, quizzes = []) {
            const characterStats = this.data.stats.characters.find(x => x.name === character);
            characterStats[quizName][difficulty][isSuccess ? 1 : 0] += 1;
            if (daily === true) {
                const date = getTodayString();
                let dailyStats = this.data.stats.daily.find(x => x.date === date);
                if (!dailyStats) {
                    dailyStats = { date, quizzes: [...quizzes] };
                    this.data.stats.daily.push(dailyStats);
                }
                const quizIndex = dailyStats.quizzes.findIndex(x => x.includes(quizName));
                dailyStats.quizzes[quizIndex] = `${isSuccess ? '+' : '-'}${quizName}${difficulty}`;
                if (!this.data.topMenu.daily.done.includes(quizName)) this.data.topMenu.daily.done.push(quizName);
            }
            return this.saveData(this.data);
        }

        //////////////
        // TOP MENU //
        //////////////

        // BANNERS

        getTopMenuBannersState(daily = false) {
            if (daily === true) return this.data.topMenu.banners.dailyState;
            else return this.data.topMenu.banners.state;
        }

        saveTopMenuBannersState(state, daily = false) {
            if (daily === true) this.data.topMenu.banners.dailyState = { ...state };
            else this.data.topMenu.banners.state = { ...state };
            return this.saveData(this.data);
        }

        // PIXELATE

        getTopMenuPixelateState(daily = false) {
            if (daily === true) return this.data.topMenu.pixelate.dailyState;
            else return this.data.topMenu.pixelate.state;
        }

        saveTopMenuPixelateState(state, daily = false) {
            if (daily === true) this.data.topMenu.pixelate.dailyState = { ...state };
            else this.data.topMenu.pixelate.state = { ...state };
            return this.saveData(this.data);
        }

        // MISMATCH

        getTopMenuMismatchState(daily = false) {
            if (daily === true) return this.data.topMenu.mismatch.dailyState;
            else return this.data.topMenu.mismatch.state;
        }

        saveTopMenuMismatchState(state, daily = false) {
            if (daily === true) this.data.topMenu.mismatch.dailyState = { ...state };
            else this.data.topMenu.mismatch.state = { ...state };
            return this.saveData(this.data);
        }

        // MUSIC

        getTopMenuMusicState(daily = false) {
            if (daily === true) return this.data.topMenu.music.dailyState;
            else return this.data.topMenu.music.state;
        }

        saveTopMenuMusicState(state, daily = false) {
            if (daily === true) this.data.topMenu.music.dailyState = { ...state };
            else this.data.topMenu.music.state = { ...state };
            return this.saveData(this.data);
        }

        // DISH

        getTopMenuDishState(daily = false) {
            if (daily === true) return this.data.topMenu.dish.dailyState;
            else return this.data.topMenu.dish.state;
        }

        saveTopMenuDishState(state, daily = false) {
            if (daily === true) this.data.topMenu.dish.dailyState = { ...state };
            else this.data.topMenu.dish.state = { ...state };
            return this.saveData(this.data);
        }

        // VOICE

        getTopMenVoiceState(daily = false) {
            if (daily === true) return this.data.topMenu.voice.dailyState;
            else return this.data.topMenu.voice.state;
        }

        saveTopMenuVoiceState(state, daily = false) {
            if (daily === true) this.data.topMenu.voice.dailyState = { ...state };
            else this.data.topMenu.voice.state = { ...state };
            return this.saveData(this.data);
        }

        // DAILY

        getTopMenuDailyState() {
            return this.data.topMenu.daily;
        }

        saveTopMenuDailyState(state) {
            console.log(`saveTopMenuDailyState: `, state);
            this.data.topMenu.daily = { ...state };
            return this.saveData(this.data);
        }
    }

    window.storageManager = new StorageManager();

    document.addEventListener('DOMContentLoaded', () => {
        window.storageManager.init();
    });
})();
