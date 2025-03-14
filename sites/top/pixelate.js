(() => {
    'use strict';

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
                this.triesDisplayCharacters(selectedCharacter);
            });

            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
            this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
            this.triesScoreCurrentElement = this.containerElement.querySelector('div.tries-score > p[name="tries-current"]');
            this.triesScoreMaxElement = this.containerElement.querySelector('div.tries-score > p[name="tries-max"]');

            this.menuItemElement?.addEventListener('click', () => this.startQuestion());
            this.nextButtonElement?.addEventListener('click', () => this.startQuestion());
        }

        applyEffects() {
            const currentTry = Number(this.triesScoreCurrentElement.textContent);
            let size = this.triesEffects.find(x => x.try === currentTry)?.data;
            if (this.isQuestionComplete) size = 175;
            this.pixelateImage(this.questionElement, this.questionEntity.icon, size, size);
        }

        triesDisplayCharacters(selectedCharacter) {
            const answer = this.questionEntity.name;
            const success = selectedCharacter.name === answer;
            const imgElement = document.createElement('img');
            const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(img))`);

            this.triesScoreCurrentElement.textContent = Number(this.triesScoreCurrentElement.textContent) + 1;
            imgElement.src = getCharacterIconImageUrl(success ? answer : selectedCharacter.name);
            emptyTryElement.appendChild(imgElement);

            if (success || Number(this.triesScoreCurrentElement.textContent) === this.triesMax) {
                this.endQuestion(CHARACTERS.find(character => character.name === answer));
            }
            this.applyEffects();
        }

        defaultState() {
            this.isQuestionComplete = false;
            this.answerSuccessElement.src = '';
            this.nextButtonElement.style.display = 'none';
            this.autocompleteContainerElement.style.display = 'block';

            this.triesScoreCurrentElement.textContent = 0;
            this.triesScoreMaxElement.textContent = this.triesMax;

            this.triesDisplayElement.innerHTML = '';
            for (let i = 0; i < this.triesMax; i++) {
                const tryElement = document.createElement('div');
                tryElement.classList.add('try');
                this.triesDisplayElement.appendChild(tryElement);
            }
        }

        startQuestion(character) {
            this.defaultState();
            this.questionEntity = character ?? getRandomCharacter();
            this.applyEffects();
        }

        endQuestion(character) {
            this.answerSuccessElement.src = character.wish;
            if (!this.daily) this.nextButtonElement.style.display = 'inherit';
            this.autocompleteContainerElement.style.display = 'none';
            this.isQuestionComplete = true;
        }

        pixelateImage(canvas, imgUrl, width, height) {
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
    }

    window.PixelateQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.pixelate;
        const quizManager = new QuizManager(config.id);
        quizManager.init({
            triesMax: config.triesMax,
            triesEffects: config.triesEffects
        });
        console.log('Pixelate quiz initialized');
    });
})();