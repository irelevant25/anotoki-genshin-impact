(() => {
    'use strict';
    let quizManager;

    class QuizManager {
        constructor(idSelector, daily) {
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
            this.questionElement.src = this.questionEntity.namecard_banner;
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

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.banners;

        quizManager = new QuizManager(config.id);

        // Initialize with configuration
        quizManager.init({
            triesMax: config.triesMax,
            triesEffects: config.triesEffects
        });

        console.log('Banners quiz initialized');
    });
})();