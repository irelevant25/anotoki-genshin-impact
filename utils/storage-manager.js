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
                banners: {
                    dailyState: {
                        triesMax: 0,
                        triesEffects: []
                    },
                    state: {
                        triesMax: 0,
                        triesEffects: []
                    }
                },
                pixelate: {
                    dailyState: {
                        triesMax: 0,
                        triesEffects: []
                    },
                    state: {
                        triesMax: 0,
                        triesEffects: []
                    }
                },
                mismatch: {
                    dailyState: {
                        triesMax: 0,
                        triesEffects: []
                    },
                    state: {
                        triesMax: 0,
                        triesEffects: []
                    }
                },
                tournament: {
                    dailyState: {
                        triesMax: 0,
                        triesEffects: []
                    },
                    state: {
                        triesMax: 0,
                        triesEffects: []
                    }
                },
                music: {
                    dailyState: {
                        triesMax: 0,
                        triesEffects: []
                    },
                    state: {
                        triesMax: 0,
                        triesEffects: []
                    }
                }
            }
        };

        data = null;

        init() {
            const data = this._loadData();
            if (!data) {
                this.saveData(StorageManager.DEFAULT_DATA);
            }
            else if (!data.version || data.version !== StorageManager.DEFAULT_DATA.version) {
                data.version = data.version ?? StorageManager.DEFAULT_DATA.version;
                data = migrate(data);
                this.saveData(data);
            }
            return this.data;
        }

        _loadData() {
            try {
                if (this.data) return { ...this.data };

                const data = localStorage.getItem(StorageManager.STORAGE_KEY);
                if (!data) return null;

                const parsedData = JSON.parse(data);
                this.data = parsedData;
                return this.data;
            } catch (error) {
                console.error('Error loading data from localStorage:', error);
                this.data = StorageManager.DEFAULT_DATA;
                return this.data;
            }
        }

        saveData(data) {
            try {
                const dataToSave = data;
                localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(dataToSave));
                return true;
            } catch (error) {
                console.error('Error saving data to localStorage:', error);
                return false;
            }
        }

        getBackground() {
            const data = this._loadData();
            return data.bottomMenu.background === '' ? null : data.bottomMenu.background;
        }

        saveBackground(background) {
            const data = this._loadData();
            data.bottomMenu.background = background;
            return this.saveData(data);
        }

        getLastVersion() {
            const data = this._loadData();
            return data.bottomMenu.lastVersion === '' ? null : data.bottomMenu.lastVersion;
        }

        saveLastVersion(version) {
            const data = this._loadData();
            data.lastVersion = version;
            return this.saveData(data);
        }

        // getQuizBanners() {
        //     const data = this._loadData();
        //     return [...data.quizBanners];
        // }

        // saveQuizBanners(quizBanners) {
        //     const data = this._loadData();
        //     data.quizBanners = [...quizBanners];
        //     return this.saveData(data);
        // }

        // getQuizPixelate() {
        //     const data = this._loadData();
        //     return [...data.quizPixelate];
        // }

        // saveQuizPixelate(quizPixelate) {
        //     const data = this._loadData();
        //     data.quizPixelate = [...quizPixelate];
        //     return this.saveData(data);
        // }

        // getQuizMismatch() {
        //     const data = this._loadData();
        //     return [...data.quizMismatch];
        // }

        // saveQuizMismatch(quizMismatch) {
        //     const data = this._loadData();
        //     data.quizMismatch = [...quizMismatch];
        //     return this.saveData(data);
        // }

        // getDailyStatus() {
        //     const data = this._loadData();
        //     return { ...data.daily };
        // }

        // saveDailyStatus(dailyStatus) {
        //     const data = this._loadData();
        //     data.daily = { ...dailyStatus };
        //     return this.saveData(data);
        // }

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
    }

    window.storageManager = new StorageManager();

    document.addEventListener('DOMContentLoaded', () => {
        window.storageManager.init();
    });
})();
