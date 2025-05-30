const MENU_ITEMS_TOP = {
    daily: {
        id: 'site-daily',
        title: 'Daily',
        badgeIcon: true,
        helpIcon: true,
        modalTitle: 'About Daily',
        modalContent: html`
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
        `,
    },
    quizzes: {
        id: 'site-quizzes',
        title: 'Quizzes',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Quizzes',
        modalContent: html`
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
        `,
    },
    games: {
        id: 'site-games',
        title: 'Games',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Games',
        modalContent: html`
            <div class="mb-4">
                <h6 class="fw-bold">What are the Games?</h6>
                <p>Games are made for fun and to challenge your knowledge of the game. Possible games include <b>Tournament</b> and <b>Minesweeper</b>.</p>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Each game has its own rules</li>
                    <li>Read it by clicking on question mark above their icon.</li>
                </ol>
            </div>
        `,
    },
    database: {
        id: 'site-database',
        title: 'Database',
    },
};
