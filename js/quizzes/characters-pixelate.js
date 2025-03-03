/**
 * Characters Pixelate Quiz Implementation
 * Initializes and configures the pixelate quiz
 */

(() => {
    'use strict';

    let quizManager;

    /**
     * Pixelates an image on a canvas
     * 
     * @param {HTMLCanvasElement} canvas - The canvas to draw on
     * @param {string} imgUrl - URL of the image to pixelate
     * @param {number} width - Pixelation width
     * @param {number} height - Pixelation height
     */
    function pixelateImage(canvas, imgUrl, width, height) {
        const ctx = canvas.getContext("2d");

        // Set canvas dimensions
        canvas.width = 256;
        canvas.height = 256;

        // Create offscreen canvas for low resolution
        const offCanvas = document.createElement("canvas");
        offCanvas.width = width;
        offCanvas.height = height;
        const offCtx = offCanvas.getContext("2d");

        // Load the image
        const img = new Image();
        img.src = imgUrl;

        img.onload = function () {
            // Draw at low resolution
            offCtx.drawImage(img, 0, 0, width, height);

            // Clear main canvas and set settings
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;  // Disable smoothing for pixelated look

            // Draw the low-res image scaled up
            ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
        };
    }

    /**
     * Initializes the pixelate quiz
     */

    window.initializePixelateQuiz = function () {
        const config = APP_CONFIG.quizzes.charactersPixelate;

        quizManager = new QuizManager(config.id);

        // Set up the effects callback
        quizManager.effectsAppliedCallback = (questionCharacter, currentTry) => {
            // Calculate pixel size based on current try
            const pixelSizes = config.pixelSizes || [7, 11, 15, 19, 23];
            let size = pixelSizes[currentTry] || pixelSizes[0];

            // Full resolution when complete
            if (quizManager.isQuestionComplete) size = 256;

            // Apply pixelation
            pixelateImage(quizManager.questionElement, questionCharacter.icon, size, size);
        };

        // Initialize with configuration
        quizManager.init({
            triesMax: config.triesMax,
            triesDisplayMethod: config.triesDisplayMethod
        });

        console.log('Pixelate quiz initialized');
    }
})();