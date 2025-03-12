/**
 * Characters Pixelate Quiz Implementation
 * Initializes and configures the pixelate quiz
 */

(() => {
    'use strict';

    let quizManager;

    /**
     * Quiz Manager Class
     * Handles common functionality for all quiz types
     */

    class QuizManager {
        static TRIES_DISPLAY_METHOD = {
            Icons: 'tries-icons',
            Characters: 'tries-characters',
            None: 'none'
        };

        static PREVIEW_TYPES = {
            Wish: 'wish',
            InGame: 'ingame',
            Card: 'card',
            Icon: 'icon',
        };

        /**
         * Creates a new QuizManager instance
         * 
         * @param {string} idSelector - ID of the quiz container
         */
        constructor(idSelector) {
            if (!idSelector) {
                throw new Error('idSelector is required');
            }
            this.idSelector = idSelector;

            // Default properties
            this.triesMax = 5;
            this.daily = true;
            this.triesDisplayMethod = QuizManager.TRIES_DISPLAY_METHOD.Icons;
            this.triesEffects = [];
            this.questionCallback = null;
            this.effectsAppliedCallback = null;
            this.questionEntity = null;
            this.isQuestionComplete = false;
        }

        /**
         * Initializes the quiz manager
         * 
         * @param {Object} options - Initialization options
         */
        init({ triesMax = this.triesMax, daily = this.daily, triesDisplayMethod = this.triesDisplayMethod, triesEffects = this.triesEffects } = {}) {
            // Set properties
            this.triesMax = triesMax;
            this.daily = daily;
            this.triesDisplayMethod = triesDisplayMethod;
            this.triesEffects = triesEffects;

            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            
            this.autocompleteContainerElement = this.containerElement.querySelector('div[name="autocomplete"]');
            new Autocomplete(this.autocompleteContainerElement, (selectedCharacter) => {
                this.triesDisplay(selectedCharacter);
            });

            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
            this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
            this.triesScoreCurrentElement = this.containerElement.querySelector('div.tries-score > p[name="tries-current"]');
            this.triesScoreMaxElement = this.containerElement.querySelector('div.tries-score > p[name="tries-max"]');

            this._boundPrepareQuestion = this.prepareQuestion.bind(this);
            this.menuItemElement.addEventListener('click', this._boundPrepareQuestion);
            this.nextButtonElement?.addEventListener('click', this._boundPrepareQuestion);

            // Initialize components
            this.triesDisplayInit();
            this.triesScoreReset();
        }

        /**
         * Initializes the tries display
         */
        triesDisplayInit() {
            if (!this.triesDisplayElement) return;

            // Remove existing classes
            this.triesDisplayElement.classList.remove(QuizManager.TRIES_DISPLAY_METHOD.Icons);
            this.triesDisplayElement.classList.remove(QuizManager.TRIES_DISPLAY_METHOD.Characters);
            this.triesDisplayElement.classList.remove(QuizManager.TRIES_DISPLAY_METHOD.None);

            // Add appropriate class
            this.triesDisplayElement.classList.add(this.triesDisplayMethod);
        }

        /**
         * Applies visual effects based on current try
         */
        applyEffects() {
            const currentTry = Number(this.triesScoreCurrentElement.textContent);

            // Remove all classes
            this.triesEffects.forEach(effect => {
                effect.class?.split(" ").forEach(cls => this.questionElement.classList.remove(cls));
            });

            // Apply effects only if the question is not complete
            if (!this.isQuestionComplete) {
                // Add effects for current try
                const effects = this.triesEffects.find(x => x.try === currentTry);
                if (effects) {
                    effects.class?.split(" ").forEach(cls => this.questionElement.classList.add(cls));
                }
            }

            // Call callback if defined
            if (this.effectsAppliedCallback) {
                this.effectsAppliedCallback(this.questionEntity, this.triesEffects.find(x => x.try === currentTry));
            }
        }

        /**
         * Resets the tries score
         */
        triesScoreReset() {
            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = 0;
            }
            if (this.triesScoreMaxElement) {
                this.triesScoreMaxElement.textContent = this.triesMax;
            }
        }

        /**
         * Displays icons for tries
         * 
         * @param {Object} selectedCharacter - The character selected by the user
         */
        triesDisplayIcons(selectedCharacter) {
            const answer = this.questionEntity.name;
            const success = selectedCharacter.name === answer;
            const iconElement = document.createElement('i');
            const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(i))`);

            if (success) {
                iconElement.classList.add('bi', 'bi-check-lg', 'text-success');
            } else {
                iconElement.classList.add('bi', 'bi-x-lg', 'text-danger');
            }

            emptyTryElement.appendChild(iconElement);

            if (success || Number(this.triesScoreCurrentElement.textContent) === this.triesMax) {
                this.endStateQuestion(CHARACTERS.find(character => character.name === answer));
            }
        }

        /**
         * Displays character icons for tries
         * 
         * @param {Object} selectedCharacter - The character selected by the user
         */
        triesDisplayCharacters(selectedCharacter) {
            const answer = this.questionEntity.name;
            const success = selectedCharacter.name === answer;
            const imgElement = document.createElement('img');
            const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(img))`);

            if (success) {
                imgElement.src = getCharacterIconImageUrl(answer);
            } else {
                imgElement.src = getCharacterIconImageUrl(selectedCharacter.name);
            }

            emptyTryElement.appendChild(imgElement);

            if (success || Number(this.triesScoreCurrentElement.textContent) === this.triesMax) {
                this.endStateQuestion(CHARACTERS.find(character => character.name === answer));
            }
        }

        /**
         * Updates the tries score
         */
        triesScoreUpdate() {
            const currentTries = Number(this.triesScoreCurrentElement.textContent) + 1;
            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = currentTries;
            }
        }

        /**
         * Displays tries based on the selected display method
         * 
         * @param {Object} selectedCharacter - The character selected by the user
         */
        triesDisplay(selectedCharacter) {
            this.triesScoreUpdate();

            if (this.triesDisplayMethod === QuizManager.TRIES_DISPLAY_METHOD.Icons) {
                this.triesDisplayIcons(selectedCharacter);
            } else if (this.triesDisplayMethod === QuizManager.TRIES_DISPLAY_METHOD.Characters) {
                this.triesDisplayCharacters(selectedCharacter);
            } else if (this.triesDisplayMethod === QuizManager.TRIES_DISPLAY_METHOD.None) {
                const answer = this.questionEntity.name;
                const success = selectedCharacter.name === answer;

                if (success || Number(this.triesScoreCurrentElement.textContent) === this.triesMax) {
                    this.endStateQuestion(CHARACTERS.find(character => character.name === answer));
                }
            }

            this.applyEffects();
        }

        /**
         * Resets the tries display
         */
        triesDisplayReset() {
            if (!this.triesDisplayElement) return;

            // Clear existing tries
            this.triesDisplayElement.innerHTML = '';

            // Create new empty tries
            for (let i = 0; i < this.triesMax; i++) {
                const tryElement = document.createElement('div');
                tryElement.classList.add('try');
                this.triesDisplayElement.appendChild(tryElement);
            }
        }

        /**
         * Sets the quiz to its default state
         */
        defaultState() {
            if (this.answerSuccessElement) this.answerSuccessElement.src = '';
            if (this.nextButtonElement) this.nextButtonElement.style.display = 'none';
            if (this.autocompleteContainerElement) this.autocompleteContainerElement.style.display = 'block';

            this.triesDisplayReset();
            this.triesScoreReset();
        }

        /**
         * Sets up the question
         */
        startStateQuestion() {
            this.isQuestionComplete = false;

            if (this.questionCallback) {
                this.questionEntity = this.questionCallback();
            } else {
                this.questionEntity = getRandomCharacter();
            }

            this.applyEffects();
        }

        /**
         * Shows the end state when the question is complete
         * 
         * @param {Object} character - The correct character
         */
        endStateQuestion(character) {
            if (this.answerSuccessElement) {
                this.answerSuccessElement.src = character.wish;
            }
            if (this.nextButtonElement) {
                this.nextButtonElement.style.display = 'inherit';
            }
            if (this.autocompleteContainerElement) {
                this.autocompleteContainerElement.style.display = 'none';
            }
            this.isQuestionComplete = true;
        }

        /**
         * Prepares the next question
         * 
         * @param {Event} menuItem - The event object
         */
        prepareQuestion(menuItem) {
            if (menuItem &&
                menuItem.currentTarget.localName !== 'button' &&
                !menuItem.currentTarget.classList.contains('active')) {
                return;
            }

            this.defaultState();
            this.startStateQuestion();
        }
    }

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
        canvas.width = 175;
        canvas.height = 175;

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

    window.initializePixelate = function () {
        const config = APP_CONFIG.topMenu.pixelate;

        quizManager = new QuizManager(config.id);

        // Set up the effects callback
        quizManager.effectsAppliedCallback = (questionCharacter, effect) => {
            // Calculate pixel size based on current try
            let size = effect?.data;

            // Full resolution when complete
            if (quizManager.isQuestionComplete) size = 175;

            // Apply pixelation
            pixelateImage(quizManager.questionElement, questionCharacter.icon, size, size);
        };

        // Initialize with configuration
        quizManager.init({
            triesMax: config.triesMax,
            triesDisplayMethod: config.triesDisplayMethod,
            triesEffects: config.triesEffects
        });

        console.log('Pixelate quiz initialized');
    }
})();