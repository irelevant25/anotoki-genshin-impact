(() => {
    'use strict';

    class StorageManager {
        static STORAGE_KEY = 'app_data';
        static DEFAULT_DATA = {
            version: '0.2',
            bottomMenu: {
                background: '',
                difficulty: '',
                version: ''
            },
            topMenu: {
                daily: {
                    date: '',
                    subjects: []
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
                }
            }
        };

        constructor() {
            this.data = null;
        }

        init() {
            this._loadData();
            if (!this.data.version || this.data.version !== StorageManager.DEFAULT_DATA.version) {
                this.data.version = this.data.version ?? StorageManager.DEFAULT_DATA.version;
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
                localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(data));
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

        getBackground() {
            return this.data.bottomMenu.background === '' ? null : this.data.bottomMenu.background;
        }

        saveBackground(background) {
            this.data.bottomMenu.background = background;
            return this.saveData(this.data);
        }

        getLastVersion() {
            return this.data.bottomMenu.lastVersion === '' ? null : this.data.bottomMenu.lastVersion;
        }

        saveLastVersion(version) {
            this.data.bottomMenu.lastVersion = version;
            return this.saveData(this.data);
        }

        getTopMenuBannersState(daily = false) {
            if (daily === true) return this.data.topMenu.banners.dailyState;
            else return this.data.topMenu.banners.state;
        }

        saveTopMenuBannersState(state, daily = false) {
            if (daily === true) this.data.topMenu.banners.dailyState = { ...state };
            else this.data.topMenu.banners.state = { ...state };
            return this.saveData(this.data);
        }

        getTopMenuPixelateState(daily = false) {
            if (daily === true) return this.data.topMenu.pixelate.dailyState;
            else return this.data.topMenu.pixelate.state;
        }

        saveTopMenuPixelateState(state, daily = false) {            
            if (daily === true) this.data.topMenu.pixelate.dailyState = { ...state };
            else this.data.topMenu.pixelate.state = { ...state };
            return this.saveData(this.data);
        }

        getTopMenuMismatchState(daily = false) {
            if (daily === true) return this.data.topMenu.mismatch.dailyState;
            else return this.data.topMenu.mismatch.state;
        }

        saveTopMenuMismatchState(state, daily = false) {            
            console.log(`daily: ${daily}, saveTopMenuMismatchState: `, state);
            if (daily === true) this.data.topMenu.mismatch.dailyState = { ...state };
            else this.data.topMenu.mismatch.state = { ...state };
            return this.saveData(this.data);
        }

        getTopMenuMusicState(daily = false) {
            if (daily === true) return this.data.topMenu.music.dailyState;
            else return this.data.topMenu.music.state;
        }

        saveTopMenuMusicState(state, daily = false) {            
            console.log(`daily: ${daily}, saveTopMenuMusicState: `, state);
            if (daily === true) this.data.topMenu.music.dailyState = { ...state };
            else this.data.topMenu.music.state = { ...state };
            return this.saveData(this.data);
        }
    }

    window.storageManager = new StorageManager();

    document.addEventListener('DOMContentLoaded', () => {
        window.storageManager.init();

        // storageManager.saveTopMenuBannersState({
        //     triesMax: 0,
        //     triesEffects: []
        // });
    });
})();
