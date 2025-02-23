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

    constructor(idSelector) {
        if (!idSelector) {
            throw new Error('idSelector is required');
        }
        this.idSelector = idSelector;
    }

    init({ triesMax = this.triesMax, daily = this.daily, triesDisplayMethod = this.triesDisplayMethod } = {}) {
        this.triesMax = triesMax;
        this.daily = daily;
        this.triesDisplayMethod = triesDisplayMethod;

        this.containerElement = document.querySelector(`#${this.idSelector}`);
        this.autocompleteElement = this.containerElement.querySelector('div[name="autocomplete"]');
        this.autocompleteInputElement = this.containerElement.querySelector('input');
        this.autocompleteDropdownElement = this.containerElement.querySelector('div.dropdown-menu');
        this.questionElement = this.containerElement.querySelector('img[name="question"]');
        this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
        this.nextButtonElement = this.containerElement.querySelector('button');
        this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
        this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
        this.triesScoreCurrentElement = this.containerElement.querySelector('div[name="tries-score"] > p[name="tries-current"]');
        this.triesScoreMaxElement = this.containerElement.querySelector('div[name="tries-score"] > p[name="tries-max"]');
        
        this.menuItemElement.removeEventListener('click', this.prepareQuestion);
        this.nextButtonElement.removeEventListener('click', this.prepareQuestion);
        this.autocompleteDropdownElement.removeEventListener('mouseover', this.markActiveCharacter);
        this.autocompleteInputElement.removeEventListener('keydown', this.markActiveCharacter);

        this.menuItemElement.addEventListener('click', this.prepareQuestion.bind(this));
        this.nextButtonElement.addEventListener('click', this.prepareQuestion.bind(this));
        this.autocompleteDropdownElement.addEventListener('mouseover', this.markActiveCharacter.bind(this));
        this.autocompleteInputElement.addEventListener('keydown', this.markActiveCharacter.bind(this));

        this.autocompleteInit();
        this.triesDisplayInit();
        this.triesScoreReset();
    }

    markActiveCharacter(event) {
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
        return data.find(character => character.name === characterName)?.icon;
    }

    autocompleteFilter() {
        const query = this.autocompleteInputElement.value.toLowerCase();
        const filteredData = data.filter(item => item.name.toLowerCase().includes(query));

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
            this.endStateQuestion(data.find(character => character.name === answer));
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
            this.endStateQuestion(data.find(character => character.name === answer));
        }
    }

    triesScoreUpdate() {
        const currentTries = this.containerElement.querySelectorAll('div.try > *').length;
        this.triesScoreCurrentElement.textContent = currentTries;
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
        this.triesDisplayElement.querySelectorAll('div.try > *').forEach(element => element.remove());
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
        this.questionElement.src = character.namecard_banner;
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
    }
}