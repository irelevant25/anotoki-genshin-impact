function migration_02_to_03(input) {
    return {
        version: '0.3',
        stats: {
            // 1, 2 and 3  (1 - easy, 2 - medium, 3 - hard), [0, 0] - [looses, wins]
            characters: CHARACTERS.map(x => ({
                name: x.name,
                banners: x.banners,
                pixelate: x.pixelate,
                mismatch: x.mismatch,
                music: x.music,
                dish: x.dish,
                voice: x.voice,
            })),
            // array of objects d - date and q - quizzes { d: string date 'YYYY-MM-DD', q: array of quiz names (strings) } with q suffix
            // '1' or '2' or '3' for difficulty (1 - easy, 2 - medium, 3 - hard) }
            // and with prefix
            // '-' if not completed or '+' if completed
            daily: input.stats.daily,
        },
        bottomMenu: {
            background: input.bottomMenu.background || '',
            difficulty: input.bottomMenu.difficulty || '1',
            version: input.bottomMenu.version || ''
        },
        topMenu: {
            daily: {
                // string date 'YYYY-MM-DD'
                date: input.topMenu.daily.date || '',
                // array of quiz names (strings)
                dailyQuizzes: input.topMenu.daily.dailyQuizzes || [],
                // array of quiz names (strings)
                done: input.topMenu.daily.done || [],
            },
            banners: {
                dailyState: input.topMenu.banners.dailyState || null,
                state: input.topMenu.banners.state || null
            },
            pixelate: {
                dailyState: input.topMenu.pixelate.dailyState || null,
                state: input.topMenu.pixelate.state || null,
            },
            mismatch: {
                dailyState: input.topMenu.mismatch.dailyState || null,
                state: input.topMenu.mismatch.state || null,
            },
            music: {
                dailyState: input.topMenu.music.dailyState || null,
                state: input.topMenu.music.state || null,
            },
            tournament: {
                dailyState: input.topMenu.tournament.dailyState || null,
                state: input.topMenu.tournament.state || null,
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
}