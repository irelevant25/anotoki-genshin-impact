const QUIZZES = {
    banners: {
        id: 'site-banners',
        title: 'Banners',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Banners',
        cardImage: 'assets/character/wish/Venti.avif',
        cardInfo: 'Test your knowledge by identifying characters from their namecards/banners.',
        modalContent: html`
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
        `,
    },
    pixelate: {
        id: 'site-pixelate',
        title: 'Pixelate',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Characters Pixelate',
        cardImage: 'assets/character/wish/Kinich.avif',
        cardInfo: 'Challenge yourself to identify characters from their heavily pixelated portraits.',
        modalContent: html`
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
        `,
    },
    mismatch: {
        id: 'site-mismatch',
        title: 'Mismatch',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Characters Mismatch',
        cardImage: 'assets/character/wish/Arlecchino.avif',
        cardInfo: 'Test your character knowledge by finding the "odd one out" among four character icons.',
        modalContent: html`
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
        `,
    },
    music: {
        id: 'site-music',
        title: 'Music',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Music Quiz',
        cardImage: 'assets/character/wish/Xinyan.avif',
        cardInfo: 'Test your music knowledge by identifying characters from their demo music.',
        modalContent: html`
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
        `,
    },
    dish: {
        id: 'site-dish',
        title: 'Dish',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Dish',
        cardImage: 'assets/character/wish/Xiangling.avif',
        cardInfo: 'Test your knowledge by identifying characters from their dish.',
        modalContent: html`
            <div class="mb-4">
                <h6 class="fw-bold">What is the Dish Quiz?</h6>
                <p>Test your knowledge by identifying characters from their dish.</p>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>A character's dish will be displayed with visual effects</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the dish becomes clearer</li>
                </ol>
            </div>
        `,
    },
    voice: {
        id: 'site-voice',
        title: 'Voice',
        badgeIcon: false,
        helpIcon: true,
        modalTitle: 'About Voice Quiz',
        cardImage: 'assets/character/wish/Yun Jin.avif',
        cardInfo: 'Test your voice knowledge by identifying characters from their voice.',
        modalContent: html`
            <div class="mb-4">
                <h6 class="fw-bold">What is the Voice Quiz?</h6>
                <p>Test your voice knowledge by identifying characters from their voice.</p>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Voice line will be displayed</li>
                    <li>Voice over as a music player will be displayed</li>
                    <li>Click the play button to listen to the voice</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the voice line and voice over becomes longer</li>
                </ol>
            </div>
        `,
    },
};
