/**
 * storage-manager.js
 * A simple local storage manager for saving and loading application data
 */

class StorageManager {
    // Storage key in localStorage
    static STORAGE_KEY = 'app_data';

    // Default data structure
    static DEFAULT_DATA = {
        background: '',
        lastVersion: '',
        quizBanners: [],
        quizPixelate: [],
        quizMismatch: [],
        daily: {
            quizBanners: false,
            quizPixelate: false,
            quizMismatch: false
        }
    };

    // In-memory data cache
    dataCache = null;

    /**
     * Initialize the data structure
     * @returns {Object} The initialized data
     */
    init() {
        const savedData = this.loadData();
        if (!savedData) {
            this.saveData(StorageManager.DEFAULT_DATA);
            return { ...StorageManager.DEFAULT_DATA };
        }
        return this.savedData;
    }

    /**
     * Load all data from localStorage
     * @returns {Object|null} The loaded data or null if no data exists
     */
    loadData() {
        try {
            if (this.dataCache) return { ...this.dataCache };

            const data = localStorage.getItem(StorageManager.STORAGE_KEY);
            if (!data) return null;

            const parsedData = JSON.parse(data);
            this.dataCache = parsedData;
            return { ...parsedData };
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            return StorageManager.DEFAULT_DATA;
        }
    }

    /**
     * Save all data to localStorage
     * @param {Object} data - The data to save
     * @returns {boolean} True if successful, false otherwise
     */
    saveData(data) {
        try {
            const dataToSave = { ...data };
            localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(dataToSave));
            this.dataCache = { ...dataToSave };
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    /**
     * Get the background setting
     * @returns {string} The background value
     */
    getBackground() {
        const data = this.loadData();
        return data.background === '' ? null : data.background;
    }

    /**
     * Save the background setting
     * @param {string} background - The background value to save
     * @returns {boolean} True if successful, false otherwise
     */
    saveBackground(background) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.background = background;
        return this.saveData(data);
    }

    /**
     * Get the last version
     * @returns {string} The last version value
     */
    getLastVersion() {
        const data = this.loadData();
        return data.lastVersion === '' ? null : data.lastVersion;
    }

    /**
     * Save the last version
     * @param {string} version - The version to save
     * @returns {boolean} True if successful, false otherwise
     */
    saveLastVersion(version) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.lastVersion = version;
        return this.saveData(data);
    }

    /**
     * Get quiz banners data
     * @returns {Array} Array of quiz banner objects
     */
    getQuizBanners() {
        const data = this.loadData();
        return [...data.quizBanners];
    }

    /**
     * Save quiz banners data
     * @param {Array} quizBanners - Array of quiz banner objects
     * @returns {boolean} True if successful, false otherwise
     */
    saveQuizBanners(quizBanners) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.quizBanners = [...quizBanners];
        return this.saveData(data);
    }

    /**
     * Get quiz pixelate data
     * @returns {Array} Array of quiz pixelate objects
     */
    getQuizPixelate() {
        const data = this.loadData();
        return [...data.quizPixelate];
    }

    /**
     * Save quiz pixelate data
     * @param {Array} quizPixelate - Array of quiz pixelate objects
     * @returns {boolean} True if successful, false otherwise
     */
    saveQuizPixelate(quizPixelate) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.quizPixelate = [...quizPixelate];
        return this.saveData(data);
    }

    /**
     * Get quiz mismatch data
     * @returns {Array} Array of quiz mismatch objects
     */
    getQuizMismatch() {
        const data = this.loadData();
        return [...data.quizMismatch];
    }

    /**
     * Save quiz mismatch data
     * @param {Array} quizMismatch - Array of quiz mismatch objects
     * @returns {boolean} True if successful, false otherwise
     */
    saveQuizMismatch(quizMismatch) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.quizMismatch = [...quizMismatch];
        return this.saveData(data);
    }

    /**
     * Get daily quiz status
     * @returns {Object} The daily quiz status object
     */
    getDailyStatus() {
        const data = this.loadData();
        return { ...data.daily };
    }

    /**
     * Save daily quiz status
     * @param {Object} dailyStatus - The daily status object
     * @returns {boolean} True if successful, false otherwise
     */
    saveDailyStatus(dailyStatus) {
        const data = this.loadData() || { ...DEFAULT_DATA };
        data.daily = { ...dailyStatus };
        return this.saveData(data);
    }

    /**
     * Clear all data from storage
     * @returns {boolean} True if successful, false otherwise
     */
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