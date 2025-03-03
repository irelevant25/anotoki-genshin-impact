/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

const APP_CONFIG = {
    quizzes: {
        banners: {
            id: 'quiz-banners',
            triesMax: 5,
            triesDisplayMethod: 'tries-characters',
            triesEffects: [
                { try: 0, class: 'difficulty-1 difficulty-2 difficulty-3' },
                { try: 1, class: 'difficulty-1 difficulty-2' },
                { try: 2, class: 'difficulty-1' }
            ]
        },
        charactersPixelate: {
            id: 'quiz-characters-pixelate',
            triesMax: 5,
            triesDisplayMethod: 'tries-characters',
            pixelSizes: [7, 11, 15, 19, 23]
        },
        charactersMismatch: {
            id: 'quiz-characters-mismatch',
            triesMax: 1,
            triesDisplayMethod: 'None'
        }
    },

    backgrounds: {
        id: 'background-image',
        previewType: 'wish'
    },

    tooltips: {
        placement: 'top',
        customClass: 'custom-tooltip',
        container: 'body'
    }
};