function migration_01_to_02(input) {
    return {
        version: '0.2',
        bottomMenu: {
            background: input.background || '',
            difficulty: '',   // default value (update if needed)
            version: ''       // default value (update if needed)
        },
        topMenu: {
            banners: {
                dailyState: {
                    // Convert the old daily flag into a number (1 if true, else 0)
                    triesMax: (input.daily && input.daily.quizBanners) ? 1 : 0,
                    triesEffects: []  // Initialize as empty or adjust as needed
                },
                state: {
                    triesMax: 0,
                    // Use the old quizBanners array if available
                    triesEffects: Array.isArray(input.quizBanners) ? input.quizBanners : []
                }
            },
            pixelate: {
                dailyState: {
                    triesMax: (input.daily && input.daily.quizPixelate) ? 1 : 0,
                    triesEffects: []
                },
                state: {
                    triesMax: 0,
                    triesEffects: Array.isArray(input.quizPixelate) ? input.quizPixelate : []
                }
            },
            mismatch: {
                dailyState: {
                    triesMax: (input.daily && input.daily.quizMismatch) ? 1 : 0,
                    triesEffects: []
                },
                state: {
                    triesMax: 0,
                    triesEffects: Array.isArray(input.quizMismatch) ? input.quizMismatch : []
                }
            },
            // The new structure includes additional sections with default values
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
}