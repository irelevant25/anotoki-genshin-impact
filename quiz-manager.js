class QuizManager {
    // Static properties
    static TriesDisplayMethodEnum = {
        Icons: 'tries-icons',
        Characters: 'tries-characters',
    };

    // Instance properties
    triesMax = 5;
    daily = true;
    triesDisplayMethod = QuizManager.TriesDisplayMethodEnum.Icons;
    triesEffects = []; // structure example: { try: 1, class: 'trieda1 trieda2'}
    questionCallback = null;
    effectsAppliedCallback = null;
    questionEntity = null;

    constructor(idSelector) {
        if (!idSelector) {
            throw new Error('idSelector is required');
        }
        this.idSelector = idSelector;
    }

    init({ triesMax = this.triesMax, daily = this.daily, triesDisplayMethod = this.triesDisplayMethod, triesEffects = this.triesEffects } = {}) {
        this.triesMax = triesMax;
        this.daily = daily;
        this.triesDisplayMethod = triesDisplayMethod;
        this.triesEffects = triesEffects;

        this.containerElement = document.querySelector(`#${this.idSelector}`);
        this.autocompleteElement = this.containerElement.querySelector('div[name="autocomplete"]');
        this.autocompleteInputElement = this.containerElement.querySelector('input');
        this.autocompleteDropdownElement = this.containerElement.querySelector('div.dropdown-menu');
        this.questionElement = this.containerElement.querySelector('[name="question"]');
        this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
        this.nextButtonElement = this.containerElement.querySelector('button');
        this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
        this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
        this.triesScoreCurrentElement = this.containerElement.querySelector('div[name="tries-score"] > p[name="tries-current"]');
        this.triesScoreMaxElement = this.containerElement.querySelector('div[name="tries-score"] > p[name="tries-max"]');

        this.menuItemElement.removeEventListener('click', this.prepareQuestion);
        this.nextButtonElement.removeEventListener('click', this.prepareQuestion);
        this.autocompleteDropdownElement.removeEventListener('mouseover', this.markActiveItemOfAutocomplete);
        this.autocompleteInputElement.removeEventListener('keydown', this.markActiveItemOfAutocomplete);

        this.menuItemElement.addEventListener('click', this.prepareQuestion.bind(this));
        this.nextButtonElement.addEventListener('click', this.prepareQuestion.bind(this));
        this.autocompleteDropdownElement.addEventListener('mouseover', this.markActiveItemOfAutocomplete.bind(this));
        this.autocompleteInputElement.addEventListener('keydown', this.markActiveItemOfAutocomplete.bind(this));

        this.autocompleteInit();
        this.triesDisplayInit();
        this.triesScoreReset();
    }

    markActiveItemOfAutocomplete(event) {
        if (event instanceof MouseEvent) {
            const element = event.target;
            if (!element.classList.contains('autocomplete-item')) {
                return;
            }
            this.containerElement.querySelectorAll('div.dropdown-menu div.autocomplete-item').forEach(item => item.classList.remove('active'));
            element.classList.add('active');
        }
        else if (event instanceof KeyboardEvent) {
            const currentActiveElement = this.autocompleteDropdownElement.querySelector('div.autocomplete-item.active');
            if (!currentActiveElement) {
                return;
            }
            let newActiveElement;
            switch (event.key) {
                case 'ArrowUp':
                    newActiveElement = currentActiveElement.previousElementSibling;
                    break;
                case 'ArrowDown':
                    newActiveElement = currentActiveElement.nextElementSibling;
                    break;
                case 'Enter':
                    currentActiveElement.click();
                    break;
            }
            if (newActiveElement) {
                currentActiveElement.classList.remove('active');
                newActiveElement.classList.add('active');
                newActiveElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    autocompleteInit() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.autocompleteInputElement.contains(e.target) && !this.autocompleteDropdownElement.contains(e.target)) {
                this.autocompleteDropdownElement.classList.remove('show');
            }
        });

        this.autocompleteInputElement.addEventListener('input', () => {
            this.autocompleteFilter();
        });

        this.autocompleteInputElement.addEventListener('click', () => {
            this.autocompleteFilter();
        });
    }

    getCharacterIconImageUrl(characterName) {
        return characters.find(character => character.name === characterName)?.icon;
    }

    autocompleteFilter() {
        const query = this.autocompleteInputElement.value.toLowerCase();
        const filteredData = characters.filter(character => character.name.toLowerCase().includes(query));

        Array.from(this.autocompleteDropdownElement.children).forEach(item => item.remove());
        if (filteredData.length) {
            filteredData.forEach(character => {
                const option = document.createElement('div');
                option.classList.add('autocomplete-item');
                option.innerHTML = `<img src="${this.getCharacterIconImageUrl(character.name)}" alt="${character.name}"><span>${character.name}</span>`;
                option.addEventListener('click', () => {
                    this.autocompleteInputElement.value = '';
                    this.autocompleteDropdownElement.classList.remove('show');
                    this.triesDisplay(character);
                });
                this.autocompleteDropdownElement.appendChild(option);
            });
            this.autocompleteDropdownElement.classList.add('show');
            this.autocompleteDropdownElement.children[0].classList.add('active');
        } else {
            this.autocompleteDropdownElement.classList.remove('show');
        }
    }

    triesDisplayInit() {
        this.triesDisplayElement.classList.remove(QuizManager.TriesDisplayMethodEnum.Icons);
        this.triesDisplayElement.classList.remove(QuizManager.TriesDisplayMethodEnum.Characters);
        this.triesDisplayElement.classList.add(this.triesDisplayMethod);
    }

    get isQuestionComplete() { 
        return this.autocompleteElement.style.display === 'none';
    }

    applyEffects(currentTry) {
        // remove all effects
        this.triesEffects.forEach(effect => {
            effect.class.split(" ").forEach(effect => this.questionElement.classList.remove(effect));
        });

        // apply effects only if the question is not complete
        if (!this.isQuestionComplete) {
            // add effects for try
            const effects = this.triesEffects.find(x => x.try === currentTry);
            if (effects) {
                effects.class.split(" ").forEach(effect => this.questionElement.classList.add(effect));
            }
        }

        if (this.effectsAppliedCallback) {
            this.effectsAppliedCallback(this.questionEntity, currentTry);
        }
    }

    triesScoreReset() {
        this.triesScoreCurrentElement.textContent = 0;
        this.triesScoreMaxElement.textContent = this.triesMax;
    }

    triesDisplayIcons(selectedCharacter) {
        const answer = this.questionElement.dataset.answer;
        const success = selectedCharacter.name === answer;
        const iconElement = document.createElement('i');
        const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(i))`);
        if (success) {
            iconElement.classList.add('bi', 'bi-check-lg', 'text-success');
        }
        else {
            iconElement.classList.add('bi', 'bi-x-lg', 'text-danger');
        }
        emptyTryElement.appendChild(iconElement);
        if (success || this.containerElement.querySelectorAll('div.try i').length === 5) {
            this.endStateQuestion(characters.find(character => character.name === answer));
        }
    }

    triesDisplayCharacters(selectedCharacter) {
        const answer = this.questionElement.dataset.answer;
        const success = selectedCharacter.name === answer;
        const imgElement = document.createElement('img');
        const emptyTryElement = this.containerElement.querySelector(`div.try:not(:has(img))`);
        if (success) {
            imgElement.src = this.getCharacterIconImageUrl(answer);
        }
        else {
            imgElement.src = this.getCharacterIconImageUrl(selectedCharacter.name);
        }
        emptyTryElement.appendChild(imgElement);
        if (success || this.containerElement.querySelectorAll('div.try img').length === 5) {
            this.endStateQuestion(characters.find(character => character.name === answer));
        }
    }

    triesScoreUpdate() {
        const currentTries = this.containerElement.querySelectorAll('div.try > *').length;
        this.triesScoreCurrentElement.textContent = currentTries;
        this.applyEffects(currentTries);
    }

    triesDisplay(selectedCharacter) {
        if (this.triesDisplayMethod === QuizManager.TriesDisplayMethodEnum.Icons) {
            this.triesDisplayIcons(selectedCharacter);
        }
        else if (this.triesDisplayMethod === QuizManager.TriesDisplayMethodEnum.Characters) {
            this.triesDisplayCharacters(selectedCharacter);
        }
        this.triesScoreUpdate();
    }

    triesDisplayReset() {
        this.triesDisplayElement.querySelectorAll('& > *').forEach(element => element.remove());
        for (let i = 0; i < this.triesMax; i++) {
            const tryElement = document.createElement('div');
            tryElement.classList.add('try');
            this.triesDisplayElement.appendChild(tryElement);
        }
    }

    defaultState() {
        this.answerSuccessElement.src = '';
        this.autocompleteInputElement.value = '';
        this.nextButtonElement.style.display = 'none';
        this.autocompleteElement.style.display = 'block';
        this.triesDisplayReset();
        this.triesScoreReset();
    }

    startStateQuestion(character) {
        this.questionEntity = character;
        if (this.questionCallback) {
            this.questionCallback(character);
        }
        this.questionElement.dataset.answer = character.name;
        this.defaultState();
    }

    endStateQuestion(character) {
        this.answerSuccessElement.src = character.wish;
        this.nextButtonElement.style.display = 'inherit';
        this.autocompleteElement.style.display = 'none';
    }

    prepareQuestion(menuItem) {
        if (menuItem && menuItem.currentTarget.localName !== 'button' && !menuItem.currentTarget.classList.contains('active')) return;
        else this.defaultState();
        const randomCharacter = getRandomCharacter();
        this.startStateQuestion(randomCharacter);
        this.triesScoreUpdate();
    }
}