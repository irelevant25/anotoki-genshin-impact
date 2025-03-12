(() => {
    'use strict';

    let quizManager;

    class QuizManager {
        constructor(idSelector, daily = false) {
            this.idSelector = idSelector;
            this.daily = daily;

            // Default properties
            this.triesMax = 5;
            this.triesEffects = [];
            this.questionEntity = null;
            this.isQuestionComplete = false;
        }

        init({ triesMax = this.triesMax, triesEffects = this.triesEffects } = {}) {
            // Set properties
            this.triesMax = triesMax;
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
            this.triesScoreReset();
        }

        applyEffects() {
            const currentTry = Number(this.triesScoreCurrentElement.textContent);
            let size = this.triesEffects.find(x => x.try === currentTry)?.data;                  
            if (quizManager.isQuestionComplete) size = 175;
            pixelateImage(quizManager.questionElement, this.questionEntity.icon, size, size);
        }

        triesScoreReset() {
            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = 0;
            }
            if (this.triesScoreMaxElement) {
                this.triesScoreMaxElement.textContent = this.triesMax;
            }
        }

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

        triesScoreUpdate() {
            const currentTries = Number(this.triesScoreCurrentElement.textContent) + 1;
            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = currentTries;
            }
        }

        triesDisplay(selectedCharacter) {
            this.triesScoreUpdate();
            this.triesDisplayCharacters(selectedCharacter);
            this.applyEffects();
        }

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

        defaultState() {
            if (this.answerSuccessElement) this.answerSuccessElement.src = '';
            if (this.nextButtonElement) this.nextButtonElement.style.display = 'none';
            if (this.autocompleteContainerElement) this.autocompleteContainerElement.style.display = 'block';

            this.triesDisplayReset();
            this.triesScoreReset();
        }

        startStateQuestion() {
            this.isQuestionComplete = false;
            this.questionEntity = getRandomCharacter();
            this.applyEffects();
        }

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

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.pixelate;
        quizManager = new QuizManager(config.id);
        quizManager.init({
            triesMax: config.triesMax,
            triesEffects: config.triesEffects
        });
        console.log('Pixelate quiz initialized');
    });
})();