/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

const APP_CONFIG = {
    topMenu: {
        banners: {
            id: 'site-banners',
            triesMax: 5,
            triesDisplayMethod: 'tries-characters',
            triesEffects: [
                { try: 0, class: 'difficulty-1 difficulty-2 difficulty-3' },
                { try: 1, class: 'difficulty-1 difficulty-2' },
                { try: 2, class: 'difficulty-1' }
            ]
        },
        pixelate: {
            id: 'site-pixelate',
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
        mismatch: {
            id: 'site-mismatch',
            triesMax: 1,
            triesDisplayMethod: 'none'
        },
        tournament: {
            id: 'site-tournament',
            triesDisplayMethod: 'tries-characters',
        },
        music: {
            id: 'site-music',
            triesMax: 5,
            triesDisplayMethod: 'tries-characters',
            triesEffects: [
                { try: 0, data: 5 },
                { try: 1, data: 10 },
                { try: 2, data: 15 },
                { try: 3, data: 20 },
            ]
        }
    },

    tooltips: {
        placement: 'top',
        customClass: 'custom-tooltip',
        container: 'body'
    }
};