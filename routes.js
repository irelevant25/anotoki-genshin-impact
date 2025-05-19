// Main router object
const ROUTER = {
    // Current route state
    currentRoute: {
        path: window.location.pathname,
        params: {},
        query: {},
    },

    exception: [
        {
            code: '400',
            component: EXCEPTION_COMPONENT,
            title: '400: Something went wrong',
        },
        {
            code: '404',
            component: EXCEPTION_COMPONENT,
            title: '404: Page not found',
        },
    ],

    // Route definitions
    routes: [
        {
            path: '',
            component: HOME_COMPONENT,
            title: 'Home',
        },
        {
            path: MENU_ITEMS_TOP.daily.id,
            component: SITES_TOP_DAILY_COMPONENT,
            title: MENU_ITEMS_TOP.daily.title,
        },
        {
            path: MENU_ITEMS_TOP.quizzes.id,
            component: SITES_TOP_QUIZZES_COMPONENT,
            title: MENU_ITEMS_TOP.quizzes.title,
            children: [
                {
                    path: QUIZZES.banners.id,
                    component: SITES_TOP_QUIZZES_BANNERS_COMPONENT,
                    title: QUIZZES.banners.title,
                },
                {
                    path: QUIZZES.pixelate.id,
                    component: SITES_TOP_QUIZZES_PIXELATE_COMPONENT,
                    title: QUIZZES.pixelate.title,
                },
                {
                    path: QUIZZES.mismatch.id,
                    component: SITES_TOP_QUIZZES_MISMATCH_COMPONENT,
                    title: QUIZZES.mismatch.title,
                },
                {
                    path: QUIZZES.music.id,
                    component: SITES_TOP_QUIZZES_MUSIC_COMPONENT,
                    title: QUIZZES.music.title,
                },
                {
                    path: QUIZZES.voice.id,
                    component: SITES_TOP_QUIZZES_VOICE_COMPONENT,
                    title: QUIZZES.voice.title,
                },
                {
                    path: QUIZZES.dish.id,
                    component: SITES_TOP_QUIZZES_DISH_COMPONENT,
                    title: QUIZZES.dish.title,
                },
            ],
        },
        {
            path: MENU_ITEMS_TOP.games.id,
            component: SITES_TOP_GAMES_COMPONENT,
            title: MENU_ITEMS_TOP.games.title,
            children: [
                {
                    path: GAMES.minesweeper.id,
                    component: SITES_TOP_GAMES_MINESWEEPER_COMPONENT,
                    title: GAMES.minesweeper.title,
                },
                {
                    path: GAMES.tournament.id,
                    component: SITES_TOP_GAMES_TOURNAMENT_COMPONENT,
                    title: GAMES.tournament.title,
                },
            ],
        },
        {
            path: MENU_ITEMS_TOP.database.id,
            component: SITES_TOP_DATABASE_COMPONENT,
            title: MENU_ITEMS_TOP.database.title,
            children: [
                {
                    path: DATABASE.characters.id,
                    component: SITES_TOP_DATABASE_CHARACTERS_FILTER_COMPONENT,
                    title: DATABASE.characters.title,
                    children: [
                        {
                            path: ':character',
                            component: SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT,
                            title: 'Character Detail',
                        },
                    ],
                },
                {
                    path: DATABASE.materials.id,
                    component: SITES_TOP_DATABASE_MATERIALS_FILTER_COMPONENT,
                    title: DATABASE.materials.title,
                    children: [
                        {
                            path: ':name',
                            component: SITES_TOP_DATABASE_MATERIALS_DETAIL_COMPONENT,
                            title: 'Materials Detail',
                        },
                    ],
                },
                {
                    path: DATABASE.weapons.id,
                    component: SITES_TOP_DATABASE_WEAPONS_FILTER_COMPONENT,
                    title: DATABASE.weapons.title,
                    children: [
                        {
                            path: ':name',
                            component: SITES_TOP_DATABASE_MATERIALS_DETAIL_COMPONENT,
                            title: 'Weapons Detail',
                        },
                    ],
                },
                {
                    path: DATABASE.wishes.id,
                    component: SITES_TOP_DATABASE_WISHES_COMPONENT,
                    title: DATABASE.wishes.title,
                },
            ],
        },

        // OLD IMPLEMENTATION => REFACTOR THE DEFINITIONS OF THESE ROUTES
        // // Bottom menu routes
        // {
        //     path: '/difficulties',
        //     handler: () => openBottomModal('difficulties'),
        //     title: 'Difficulties',
        // },
        // {
        //     path: '/backgrounds',
        //     handler: () => openBottomModal('backgrounds'),
        //     title: 'Backgrounds',
        // },
        // {
        //     path: '/versions',
        //     handler: () => openBottomModal('versions'),
        //     title: 'Versions',
        // },
        // {
        //     path: '/whatsnew',
        //     handler: () => openBottomModal('whatsnew'),
        //     title: "What's New",
        // },
        // {
        //     path: '/feedback',
        //     handler: () => openBottomModal('feedback'),
        //     title: 'Feedback',
        // },

        // // Dynamic routes example
        // {
        //     path: '/database/character/:name',
        //     handler: (params) => openDatabaseWithCharacter(params.name),
        //     title: 'Character Database',
        // },
    ],
};
