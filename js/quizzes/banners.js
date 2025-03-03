/**
 * Banners Quiz Implementation
 * Initializes and configures the banners quiz
 */

(() => {
    'use strict';
    let quizManager;

    /**
     * Initializes the banners quiz
     */
    window.initializeBannersQuiz = function () {
        const config = APP_CONFIG.quizzes.banners;

        quizManager = new QuizManager(config.id);

        // Set up the question callback
        quizManager.questionCallback = () => {
            const character = getRandomCharacter();
            quizManager.questionElement.src = character.namecard_banner;
            return character;
        };

        // Initialize with configuration
        quizManager.init({
            triesMax: config.triesMax,
            triesDisplayMethod: config.triesDisplayMethod,
            triesEffects: config.triesEffects
        });

        console.log('Banners quiz initialized');
    }
})();