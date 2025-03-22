const MENU_ITEMS_TOP = {
    daily: {
        id: "site-daily",
        title: "Daily",
        badgeIcon: true,
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
    quizzes: {
        id: "site-quizzes",
        title: "Quizzes",
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Quizzes",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What are the Quizzes?</h6>
                <p>Quizzes are a series of questions that test your knowledge of the game. Possible quizzes include <b>banners</b>, <b>pixelate</b>, <b>mismatch</b> and <b>music</b>.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Each quiz has a time limit</li>
                    <li>Each quiz has a difficulty level</li>
                    <li>You can only attempt in a daily quizz once per day.</li>
                    <li>Reset of daily is at 00:00 UTC.</li>    
                </ol>
            </div>
        `
    },
    tournament: {
        id: "site-tournament",
        title: "Tournament",
        badgeIcon: false,
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