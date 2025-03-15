const MENU_ITEMS_TOP = {
    daily: {
        id: "site-daily",
        title: "Daily",
        notificationIcon: true,
        helpIcon: true,
        modalTitle: "About Daily",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Daily?</h6>
                <p>Two random quizzes will be displayed each day with only one question. Possible quizzes include <b>banners</b>, <b>pixelate</b>, <b>mismatch</b> and <b>music</b>.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How it Works</h6>
                <ol>
                    <li>Two random quizzes will be displayed each day</li>
                    <li>Each question has a time limit</li>
                    <li>Each question has a difficulty level</li>
                    <li>You can only attempt in a daily quizz once per day.</li>
                    <li>Reset of daily is at 00:00 UTC.</li>
                    <li>After completing all daily quizzes, you can still play the quizzes separately.</li>
                </ol>
            </div>
        `
    },
    banners: {
        id: "site-banners",
        title: "Banners",
        notificationIcon: false,
        helpIcon: true,
        modalTitle: "About Banners",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Banners Quiz?</h6>
                <p>Test your knowledge by identifying characters from their namecards/banners. These are the decorative banners players receive after reaching Friendship Level 10 with a character.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>A character's namecard banner will be displayed with visual effects</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the banner becomes clearer</li>
                </ol>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">Difficulty Progression</h6>
                <ul>
                    <li><span class="badge bg-danger">Hard</span> - First attempt: Banner is grayscale, blurred, and partially hidden</li>
                    <li><span class="badge bg-warning">Medium</span> - Second attempt: Banner is grayscale and blurred</li>
                    <li><span class="badge bg-info">Easy</span> - Third attempt: Banner is grayscale only</li>
                </ul>
            </div>
        `
    },
    pixelate: {
        id: "site-pixelate",
        title: "Pixelate",
        notificationIcon: false,
        helpIcon: true,
        modalTitle: "About Characters Pixelate",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Characters Pixelate Quiz?</h6>
                <p>Challenge yourself to identify characters from their heavily pixelated portraits. The fewer guesses you need, the more skilled you are!</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>A character's portrait will be displayed with extreme pixelation</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the pixelation reduces gradually</li>
                </ol>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">Pixelation Levels</h6>
                <ul>
                    <li><span class="badge bg-danger">Level 1</span> - 7×7 pixels (extremely pixelated)</li>
                    <li><span class="badge bg-warning">Level 2</span> - 11×11 pixels</li>
                    <li><span class="badge bg-info">Level 3</span> - 15×15 pixels</li>
                    <li><span class="badge bg-success">Level 4</span> - 19×19 pixels</li>
                    <li><span class="badge bg-primary">Level 5</span> - 23×23 pixels</li>
                </ul>
            </div>
            
            <div>
                <h6 class="fw-bold">Scoring</h6>
                <p>The earlier you guess correctly, the more impressive your character recognition skills!</p>
            </div>
        `
    },
    mismatch: {
        id: "site-mismatch",
        title: "Mismatch",
        notificationIcon: false,
        helpIcon: true,
        modalTitle: "About Characters Mismatch",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Characters Mismatch Quiz?</h6>
                <p>Test your character knowledge by finding the "odd one out" among four character icons. One character doesn't belong with the others based on a common attribute.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Four character icons will be displayed</li>
                    <li>Three characters share a common attribute (element, weapon type, or region)</li>
                    <li>One character is different - click on the character that doesn't belong</li>
                    <li>You have only one attempt per question</li>
                </ol>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">Possible Categories</h6>
                <ul>
                    <li><span class="fw-semibold">Element:</span> Find the character with a different element</li>
                    <li><span class="fw-semibold">Weapon Type:</span> Find the character using a different weapon</li>
                    <li><span class="fw-semibold">Region:</span> Find the character from a different region</li>
                </ul>
            </div>
            
            <div>
                <h6 class="fw-bold">Challenge Level</h6>
                <p>The quiz is designed to be challenging - the selection is randomized and the category isn't revealed. You need to analyze the characters and discover the pattern yourself!</p>
            </div>
        `
    },
    music: {
        id: "site-music",
        title: "Music",
        notificationIcon: false,
        helpIcon: true,
        modalTitle: "About Music Quiz",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Music Quiz?</h6>
                <p>Test your music knowledge by identifying characters from their demo music.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Music players will be displayed</li>
                    <li>Click the play button to listen to the music</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the music becomes longer</li>
                </ol>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">Difficulty Progression</h6>
                <ul>
                    <li><span class="badge bg-danger">Very hard</span> - First attempt: Music is only 5 seconds long</li>
                    <li><span class="badge bg-danger">Hard</span> - First attempt: Music is 10 seconds long</li>
                    <li><span class="badge bg-warning">Medium</span> - Second attempt: Music is 15 seconds long</li>
                    <li><span class="badge bg-info">Easy</span> - Third attempt: Music is 20 seconds long</li>
                    <li><span class="badge bg-info">Very easy</span> - Third attempt: Music is without a length limit</li>
                </ul>
            </div>
        `
    },
    tournament: {
        id: "site-tournament",
        title: "Tournament",
        notificationIcon: false,
        helpIcon: true,
        modalTitle: "About Characters Tournament",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Character Tournament?</h6>
                <p>Pit your favorite characters against each other in a tournament-style competition. Characters are randomly selected and matched up, and you decide who advances to the next round!</p>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Select the number of characters to include in the tournament</li>
                    <li>Choose your preferred tournament type</li>
                    <li>Click "Start Tournament" to begin</li>
                    <li>For each match-up, select your preferred character to advance</li>
                    <li>Continue until the tournament concludes and winners are displayed</li>
                </ol>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold">Tournament Types</h6>
                <ul>
                    <li><span class="badge bg-primary">Single Elimination</span> Characters compete in a knockout format. Lose once and you're out. Only the champion is displayed at the end.</li>
                    <li><span class="badge bg-primary">Double Elimination</span> Characters get a second chance after their first loss. The top 3 winners are displayed at the end.</li>
                    <li><span class="badge bg-primary">Round-Robin (all-play-all)</span> Every character plays against every other character once. All characters are ranked by points at the end (1 point per win).</li>
                </ul>
            </div>

            <div>
                <h6 class="fw-bold">Tournament Settings</h6>
                <p>Before starting, you can customize your tournament with these options:</p>
                <ul>
                    <li><span class="badge bg-success">Number of Characters</span> Select how many characters will participate</li>
                    <li><span class="badge bg-primary">Tournament Type</span> Choose the format that determines how matches are structured</li>
                </ul>
            </div>
        `
    }
};