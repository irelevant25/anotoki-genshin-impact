/**
 * Modal Content
 * Contains content for the modals
 */
const MENU_ITEMS = {
    quizBanners: {
        id: "quiz-banners",
        title: "Banners",
        helpIconPlacement: "left",
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
    quizCharactersPixelate: {
        id: "quiz-characters-pixelate",
        title: "Characters pixelate",
        helpIconPlacement: "left",
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
    quizCharactersMismatch: {
        id: "quiz-characters-mismatch",
        title: "Characters mismatch",
        helpIconPlacement: "left",
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
    backgroundImage: {
        id: "background-image",
        title: "Background",
        helpIconPlacement: "left",
        modalTitle: "About Background",
        modalContent: `
            <div class="mb-4">
                <h6 class="fw-bold">What is the Background Feature?</h6>
                <p>Customize your quiz experience by choosing different character-themed wallpapers as the app background.</p>
            </div>
            
            <div class="mb-4">
                <h6 class="fw-bold">How to Use</h6>
                <ol>
                    <li>Click on the "Background" menu item to view available wallpapers</li>
                    <li>Browse through the character thumbnails</li>
                    <li>Click on any character thumbnail to set their wallpaper as the background</li>
                    <li>The background will instantly change to your selection</li>
                </ol>
            </div>
            
            <div>
                <h6 class="fw-bold">Available Backgrounds</h6>
                <p>Backgrounds are available for characters that have wallpaper assets. The selection varies depending on the assets included in your installation.</p>
                <p class="text-muted fst-italic">Note: You can continue playing quizzes with any background of your choice.</p>
            </div>
        `
    }
};

// Load modal content function
window.loadModalContent = function () {
    Object.keys(MENU_ITEMS).forEach(key => {
        const modalId = `${key}-modal`;
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            const modalTitle = modal.querySelector('.modal-title');

            if (modalBody) modalBody.innerHTML = MENU_ITEMS[key].content;
            if (modalTitle) modalTitle.textContent = MENU_ITEMS[key].title;
        }
    });
};

// Call this function on initial page load
document.addEventListener('DOMContentLoaded', window.loadModalContent);