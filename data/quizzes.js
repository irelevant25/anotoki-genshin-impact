const QUIZZES = {
    banners: {
        id: "site-banners",
        title: "Banners",
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Banners",
        cardImage: 'assets/character/wish/Venti.avif',
        cardInfo: 'Test your knowledge by identifying characters from their namecards/banners.',
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
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Characters Pixelate",
        cardImage: 'assets/character/wish/Kinich.avif',
        cardInfo: 'Challenge yourself to identify characters from their heavily pixelated portraits.',
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
                    <li><span class="badge bg-danger">Level 1</span> - 7x7 pixels (extremely pixelated)</li>
                    <li><span class="badge bg-warning">Level 2</span> - 11x11 pixels</li>
                    <li><span class="badge bg-info">Level 3</span> - 15x15 pixels</li>
                    <li><span class="badge bg-success">Level 4</span> - 19x19 pixels</li>
                    <li><span class="badge bg-primary">Level 5</span> - 23x23 pixels</li>
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
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Characters Mismatch",
        cardImage: 'assets/character/wish/Arlecchino.avif',
        cardInfo: 'Test your character knowledge by finding the "odd one out" among four character icons.',
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
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Music Quiz",
        cardImage: 'assets/character/wish/Xinyan.avif',
        cardInfo: 'Test your music knowledge by identifying characters from their demo music.',
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
    dish: {
        id: "site-dish",
        title: "Dish",
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Dish",
        cardImage: 'assets/character/wish/Xiangling.avif',
        cardInfo: 'Test your knowledge by identifying characters from their namecards/dish.',
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Dish Quiz?</h6>
                <p>Test your knowledge by identifying characters from their namecards/dish. These are the decorative dish players receive after reaching Friendship Level 10 with a character.</p>
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
    voice: {
        id: "site-voice",
        title: "Voice",
        badgeIcon: false,
        helpIcon: true,
        modalTitle: "About Voice Quiz",
        cardImage: 'assets/character/wish/Yun Jin.avif',
        cardInfo: 'Test your voice knowledge by identifying characters from their demo voice.',
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Voice Quiz?</h6>
                <p>Test your voice knowledge by identifying characters from their demo voice.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Play</h6>
                <ol>
                    <li>Voice players will be displayed</li>
                    <li>Click the play button to listen to the voice</li>
                    <li>Type or select a character name from the dropdown</li>
                    <li>You have up to 5 attempts to guess correctly</li>
                    <li>With each failed attempt, the voice becomes longer</li>
                </ol>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">Difficulty Progression</h6>
                <ul>
                    <li><span class="badge bg-danger">Very hard</span> - First attempt: Voice is only 5 seconds long</li>
                    <li><span class="badge bg-danger">Hard</span> - First attempt: Voice is 10 seconds long</li>
                    <li><span class="badge bg-warning">Medium</span> - Second attempt: Voice is 15 seconds long</li>
                    <li><span class="badge bg-info">Easy</span> - Third attempt: Voice is 20 seconds long</li>
                    <li><span class="badge bg-info">Very easy</span> - Third attempt: Voice is without a length limit</li>
                </ul>
            </div>
        `
    },
};