/**
 * Quiz Manager Class
 * Handles common functionality for all quiz types
 */

class QuizManager {
    static TriesDisplayMethodEnum = {
        Icons: 'tries-icons',
        Characters: 'tries-characters',
        None: 'none'
    };

    static PreviewTypeEnum = {
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
        this.triesDisplayMethod = QuizManager.TriesDisplayMethodEnum.Icons;
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

        // Remove any existing event listeners
        this._removeEventListeners();

        // Add event listeners
        this._addEventListeners();

        // Initialize components
        this.autocompleteInit();
        this.triesDisplayInit();
        this.triesScoreReset();
    }

    /**
     * Removes existing event listeners
     * @private
     */
    _removeEventListeners() {
        this.menuItemElement.removeEventListener('click', this._boundPrepareQuestion);
        this.nextButtonElement?.removeEventListener('click', this._boundPrepareQuestion);
        this.autocompleteDropdownElement?.removeEventListener('mouseover', this._boundMarkActiveItemOfAutocomplete);
        this.autocompleteInputElement?.removeEventListener('keydown', this._boundMarkActiveItemOfAutocomplete);
    }

    /**
     * Adds event listeners
     * @private
     */
    _addEventListeners() {
        this._boundPrepareQuestion = this.prepareQuestion.bind(this);
        this._boundMarkActiveItemOfAutocomplete = this.markActiveItemOfAutocomplete.bind(this);

        this.menuItemElement.addEventListener('click', this._boundPrepareQuestion);
        this.nextButtonElement?.addEventListener('click', this._boundPrepareQuestion);
        this.autocompleteDropdownElement?.addEventListener('mouseover', this._boundMarkActiveItemOfAutocomplete);
        this.autocompleteInputElement?.addEventListener('keydown', this._boundMarkActiveItemOfAutocomplete);
    }

    /**
     * Marks the active item in autocomplete dropdown
     * 
     * @param {Event} event - Mouse or keyboard event
     */
    markActiveItemOfAutocomplete(event) {
        if (event instanceof MouseEvent) {
            const element = event.target.closest('.autocomplete-item');
            if (!element) return;

            this.containerElement.querySelectorAll('div.dropdown-menu div.autocomplete-item')
                .forEach(item => item.classList.remove('active'));
            element.classList.add('active');
        }
        else if (event instanceof KeyboardEvent) {
            const currentActiveElement = this.autocompleteDropdownElement.querySelector('div.autocomplete-item.active');
            if (!currentActiveElement) return;

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
                    return;
            }

            if (newActiveElement) {
                currentActiveElement.classList.remove('active');
                newActiveElement.classList.add('active');
                newActiveElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    /**
     * Initializes the autocomplete functionality
     */
    autocompleteInit() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.autocompleteInputElement?.contains(e.target) &&
                !this.autocompleteDropdownElement?.contains(e.target)) {
                this.autocompleteDropdownElement?.classList.remove('show');
            }
        });

        this.autocompleteInputElement?.addEventListener('input', () => {
            this.autocompleteFilter();
        });

        this.autocompleteInputElement?.addEventListener('click', () => {
            this.autocompleteFilter();
        });
    }

    /**
     * Gets the URL for a character icon
     * 
     * @param {string} characterName - Name of the character
     * @returns {string} URL of the character icon
     */
    getCharacterIconImageUrl(characterName) {
        return CHARACTERS.find(character => character.name === characterName)?.icon;
    }

    /**
     * Filters the autocomplete dropdown based on input
     */
    autocompleteFilter() {
        const query = this.autocompleteInputElement?.value.toLowerCase();
        const filteredData = CHARACTERS.filter(character =>
            character.name.toLowerCase().includes(query));

        // Clear existing options
        Array.from(this.autocompleteDropdownElement?.children ?? [])
            .forEach(item => item.remove());

        if (filteredData.length) {
            // Add new options
            filteredData.forEach(character => {
                const option = document.createElement('div');
                option.classList.add('autocomplete-item');
                option.innerHTML = `
                    <img src="${this.getCharacterIconImageUrl(character.name)}" alt="${character.name}">
                    <span>${character.name}</span>
                `;
                option.addEventListener('click', () => {
                    this.autocompleteInputElement.value = '';
                    this.autocompleteDropdownElement.classList.remove('show');
                    this.triesDisplay(character);
                });
                this.autocompleteDropdownElement.appendChild(option);
            });

            // Show dropdown and highlight first item
            this.autocompleteDropdownElement.classList.add('show');
            this.autocompleteDropdownElement.children[0].classList.add('active');
        } else {
            this.autocompleteDropdownElement.classList.remove('show');
        }
    }

    /**
     * Initializes the tries display
     */
    triesDisplayInit() {
        if (!this.triesDisplayElement) return;

        // Remove existing classes
        this.triesDisplayElement.classList.remove(QuizManager.TriesDisplayMethodEnum.Icons);
        this.triesDisplayElement.classList.remove(QuizManager.TriesDisplayMethodEnum.Characters);
        this.triesDisplayElement.classList.remove(QuizManager.TriesDisplayMethodEnum.None);

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
            imgElement.src = this.getCharacterIconImageUrl(answer);
        } else {
            imgElement.src = this.getCharacterIconImageUrl(selectedCharacter.name);
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

        if (this.triesDisplayMethod === QuizManager.TriesDisplayMethodEnum.Icons) {
            this.triesDisplayIcons(selectedCharacter);
        } else if (this.triesDisplayMethod === QuizManager.TriesDisplayMethodEnum.Characters) {
            this.triesDisplayCharacters(selectedCharacter);
        } else if (this.triesDisplayMethod === QuizManager.TriesDisplayMethodEnum.None) {
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
        if (this.autocompleteInputElement) this.autocompleteInputElement.value = '';
        if (this.nextButtonElement) this.nextButtonElement.style.display = 'none';
        if (this.autocompleteElement) this.autocompleteElement.style.display = 'block';

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
        if (this.autocompleteElement) {
            this.autocompleteElement.style.display = 'none';
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