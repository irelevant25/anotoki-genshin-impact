const CHANGELOG = [
    {
        version: "0.7",
        date: "2025-04-17",
        changes: {
            added: [
                "Implemented minesweeper game",
                "Added feedback section",
                "Added GitHub icon with redirect on the bottom menu"
            ],
            fixed: [],
            updated: [
                "Major refactoring to Vue 3 (no build framework) for future optimizations and new features.",
            ]
        }
    },
    {
        version: "0.6",
        date: "2025-04-06",
        changes: {
            added: [
                "New quiz: character special dish",
                "new quiz: character voice over"
            ],
            fixed: [
                "Issue with daily after difficulty change.",
            ],
            updated: [
                "Big optimization of all assets by reducing their size about 85%.",
                "Loading backgrounds only when needed.",
                "Optimizing database by loading selected character instead of whole database."
            ]
        }
    },
    {
        version: "0.5",
        date: "2025-03-17",
        changes: {
            added: [
                "Daily/Dailies",
                "Difficulties",
                "Saving progress for the sites: Daily, Banners, Pixelate, Mismatch and Music.",
                "Add demo music, special dish, banner, affiliations and titles to the Database character header.",
                "Add new tab Build to the Database with infographic.",
                "Data migrations after visiting the website after new updates."
            ],
            fixed: [
                "Disable 'click' event in Mismatch after result.",
            ],
            updated: [
                "Change design/visibility of the custom music player.",
                "Optimizing big characters data. Split to two (characters and database) and load database only if needed.",
                "Download external libs and use them from website."
            ]
        }
    },
    {
        version: "0.4",
        date: "2025-03-12",
        changes: {
            added: [
                "Music quiz.",
                "Database for characters information."
            ],
            fixed: [
                "Not showing content after manual opening What's new modal.",
            ],
            updated: [
                "Wider modals.",
                "Change margins and sizes of the images in quizzes so there are not scrollbar anymore.",
                "Adding responsiveness for lower resolution for bottom menu.",
            ]
        }
    },
    {
        version: "0.3",
        date: "2025-03-07",
        changes: {
            added: [
                "Character tournament.",
                "Menu tooltips with modals for additional information on menu items.",
                "New background “Liyue” and “Arlecchino”.",
                "Saving and loading of background and version settings.",
                "Notification for new versions.",
                "Bottom menu item called “What's New”.",

            ],
            fixed: [
                "Issue with incrementing tries in the mismatch quiz."
            ],
            updated: [
                "Removed “rarity” as an indicator in the mismatch quiz.",
                "Tweaked the UI and changed how backgrounds are previewed.",
                "Redefined the bottom menu and moved the background content from the top to the bottom.",
                "Redesigned the way backgrounds are displayed.",
                "Optimized background page by displaying a low-resolution preview of the original image for faster loading."
            ]
        }
    },
    {
        version: "0.2",
        date: "2025-02-26",
        changes: {
            added: [
                "Score display. Characters tries display.",
                "Difficulties per try in banner quiz.",
                "Character pixelate quiz.",
                "Character mismatch quiz.",
            ],
            fixed: [],
            updated: [
                "Beautified the UI of the change log.",
            ],
        },
    },
    {
        version: "0.1",
        date: "2025-02-22",
        changes: {
            added: [
                "Initial release of the quiz website.",
            ],
            fixed: [],
            updated: [],
        },
    }
];