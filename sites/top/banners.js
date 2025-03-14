(() => {
    'use strict';

    class QuizManager {
        constructor(idSelector, options = {}, daily = false) {
            this.idSelector = idSelector;
            this.daily = daily;
            this.options = options;

            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            this.autocompleteContainerElement = this.containerElement.querySelector('div[name="autocomplete"]');
            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            // this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
            this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
            this.triesScoreCurrentElement = this.containerElement.querySelector('div.tries-score > p[name="tries-current"]');
            this.triesScoreMaxElement = this.containerElement.querySelector('div.tries-score > p[name="tries-max"]');

            this.nextButtonElement?.addEventListener('click', () => {
                this.state = null;
                this.init();
            });

            new Autocomplete(this.autocompleteContainerElement, (selectedCharacter) => {
                this.tries.push(selectedCharacter.name);
                this.triesDisplayCharacters(selectedCharacter);
                this.saveState();
            });
            
            this.state = storageManager.getTopMenuBannersState(this.daily);
        }

        init() {
            this.triesMax = this.state ? this.state.triesMax : this.options.triesMax ?? 5;
            this.triesEffects = this.state?.triesEffects ?? this.options.triesEffects ?? [];
            this.tries = this.state?.tries ?? [];
            this.questionEntity = this.state ? CHARACTERS.find(character => character.name === this.state.questionEntity) : getRandomCharacter();
            this.isQuestionComplete = this.state ? this.state.isQuestionComplete : false;

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
                tries: this.tries
            };
            storageManager.saveTopMenuBannersState(this.state, this.daily);
        }

        applyEffects() {
            const currentTry = this.tries.length;

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
            
            const currentTry = this.tries.length;            
            this.triesScoreCurrentElement.textContent = currentTry;
            imgElement.src = getCharacterIconImageUrl(success ? answer : selectedCharacter.name);
            emptyTryElement.appendChild(imgElement);

            if (success || currentTry === this.triesMax) {
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
    }

    window.BannersQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.banners;
        new QuizManager(config.id, config).init();
        console.log('Banners quiz initialized');
    });
})();