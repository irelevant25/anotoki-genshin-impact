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
            triesEffects: [
                { try: 0, data: 7 },
                { try: 1, data: 11 },
                { try: 2, data: 15 },
                { try: 3, data: 19 },
                { try: 4, data: 23 },
            ]
        },
        charactersMismatch: {
            id: 'quiz-characters-mismatch',
            triesMax: 1,
            triesDisplayMethod: 'none'
        },
        charactersTournament: {
            id: 'quiz-characters-tournament',
            triesDisplayMethod: 'tries-characters',
        }
    },

    tooltips: {
        placement: 'top',
        customClass: 'custom-tooltip',
        container: 'body'
    }
};