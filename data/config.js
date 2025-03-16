const APP_CONFIG = {
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