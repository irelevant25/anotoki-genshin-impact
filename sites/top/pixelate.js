(() => {
    'use strict';

    class QuizManager {
        get isSuccess() {
            return this.questionEntity.name === this.tries[this.tries.length - 1];
        }

        constructor(idSelector, options = {}, daily = false, onCompleteQuestion) {
            this.idSelector = idSelector;
            this.daily = daily;
            this.options = options;
            this.onCompleteQuestion = onCompleteQuestion;

            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            // this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
            this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
            this.triesScoreCurrentElement = this.containerElement.querySelector('div.tries-score > p[name="tries-current"]');
            this.triesScoreMaxElement = this.containerElement.querySelector('div.tries-score > p[name="tries-max"]');
            this.autocompleteContainerElement = this.containerElement.querySelector('div[name="autocomplete"]');
            this.levelElement = this.containerElement.querySelector('div[name="quiz-difficulty-display"]');

            this.nextButtonElement?.addEventListener('click', () => {
                this.state = null;
                this.init();
            });

            new Autocomplete(this.autocompleteContainerElement, (selectedCharacter) => {
                this.tries.push(selectedCharacter.name);
                this.triesDisplayCharacters(selectedCharacter);
                this.saveState();
            });

            this.state = storageManager.getTopMenuPixelateState(this.daily);
        }

        init() {
            this.isQuestionComplete = this.state ? this.state.isQuestionComplete : false;
            this.difficulty = this.state ? this.state.difficulty : this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() ?? 1;
            this.triesMax = this.state ? this.state.triesMax : this.options[this.difficulty].triesMax ?? 5;
            this.triesEffects = this.state?.triesEffects ?? this.options[this.difficulty].triesEffects ?? [];
            this.tries = this.state?.tries ?? [];
            this.questionEntity = this.state ? CHARACTERS.find(character => character.name === this.state.questionEntity) : getRandomCharacter();

            if (!this.daily) {
                this.levelElement.className = '';
                this.levelElement.classList.add(`level-${difficultyFromNumberToString(this.difficulty)}`);
                this.levelElement.querySelector('span').textContent = difficultyFromNumberToString(this.difficulty);
            }

            this.defaultState();
            this.startQuestion();
            this.tries.forEach(character => this.triesDisplayCharacters(CHARACTERS.find(x => x.name === character)));
            if (!this.state) this.saveState();
        }

        saveState() {
            this.state = {
                triesMax: this.triesMax,
                triesEffects: this.triesEffects,
                questionEntity: this.questionEntity.name,
                isQuestionComplete: this.isQuestionComplete,
                tries: this.tries,
                difficulty: this.difficulty
            };
            if (this.isQuestionComplete && this.onCompleteQuestion) this.onCompleteQuestion(this.questionEntity, this.difficulty, this.isSuccess);
            storageManager.saveTopMenuPixelateState(this.state, this.daily);
        }

        applyEffects() {
            const currentTry = this.tries.length;
            let size = this.triesEffects.find(x => x.try === currentTry)?.data;
            if (this.isQuestionComplete) size = 175;
            this.pixelateImage(this.questionElement, this.questionEntity.icon, size, size);
        }

        triesDisplayCharacters(selectedCharacter) {
            const answer = this.questionEntity.name;
            const imgElement = document.createElement('img');
            const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(img))`);

            const currentTry = this.tries.length;
            this.triesScoreCurrentElement.textContent = currentTry;
            imgElement.src = getCharacterIconImageUrl(selectedCharacter.name);
            emptyTryElement.appendChild(imgElement);

            if (this.isSuccess || currentTry === this.triesMax) {
                this.endQuestion(CHARACTERS.find(character => character.name === answer));
            }
            this.applyEffects();
        }

        defaultState() {
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

        startQuestion() {
            this.questionElement.src = this.questionEntity.namecard_banner;
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
        const siteName = 'pixelate';
        const config = APP_CONFIG.topMenu[siteName];
        new QuizManager(config.id, config, false, (questionEntity, difficulty, isSuccess) => {
            storageManager.saveStats(siteName, questionEntity.name, isSuccess, difficulty);
        }).init();
        console.log('Pixelate quiz initialized');
    });
})();