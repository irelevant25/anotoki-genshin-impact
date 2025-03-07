/**
 * Changelog Content
 * Contains content for the changelog
 */
const CHANGELOG = [
    {
        version: "0.3",
        date: "2025-03-07",
        changes: {
            added: [
                "Character tournament.",
                "Menu tooltips with modals for additional information on menu items.",
                "New background “Liyue” and “Arlecchino”",
                "Saving and loading of background and version settings.",
                "Notification for new versions.",
                "Bottom menu item called “What’s New.”",

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