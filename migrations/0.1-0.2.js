function migration_01_to_02(input) {
    return {
        version: '0.2',
        stats: {
            // 1, 2 and 3  (1 - easy, 2 - medium, 3 - hard), [0, 0] - [looses, wins]
            characters: CHARACTERS.map(x => ({
                name: x.name,
                banners: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                pixelate: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                mismatch: { 1: [0, 0], 2: [0, 0], 3: [0, 0] },
                music: { 1: [0, 0], 2: [0, 0], 3: [0, 0] }
            })),
            // array of objects d - date and q - quizzes { d: string date 'YYYY-MM-DD', q: array of quiz names (strings) } with q suffix
            // '1' or '2' or '3' for difficulty (1 - easy, 2 - medium, 3 - hard) }
            // and with prefix
            // '-' if not completed or '+' if completed
            daily: [],
        },
        bottomMenu: {
            background: input.background || '',
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
            }
        }
    };
}