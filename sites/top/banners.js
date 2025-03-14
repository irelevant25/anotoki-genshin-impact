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
            this.questionElement.src = this.questionEntity.namecard_banner;
            this.applyEffects();
        }

        endQuestion(character) {
            this.answerSuccessElement.src = character.wish;
            if (!this.daily) this.nextButtonElement.style.display = 'inherit';
            this.autocompleteContainerElement.style.display = 'none';
            this.isQuestionComplete = true;
        }
    }

    window.BannersQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.banners;
        const quizManager = new QuizManager(config.id);
        quizManager.init({
            triesMax: config.triesMax,
            triesEffects: config.triesEffects
        });
        console.log('Banners quiz initialized');
    });
})();