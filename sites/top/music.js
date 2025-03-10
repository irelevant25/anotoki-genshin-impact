/**
 * Banners Quiz Implementation
 * Initializes and configures the banners quiz
 */

(() => {
    'use strict';

    class QuizManager {
        constructor() {
            this.idSelector = APP_CONFIG.topMenu.music.id;

            // Default properties
            this.triesMax = APP_CONFIG.topMenu.music.triesMax ?? 5;
            this.daily = true;
            this.triesEffects = APP_CONFIG.topMenu.music.triesEffects ?? [];
            this.questionEntity = null;
            this.rafId;
            this.startTime = 0;
            this.endTime = 0;

            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            this.autocompleteElement = this.containerElement.querySelector('div[name="autocomplete"]');
            this.autocompleteInputElement = this.containerElement.querySelector('input');
            this.autocompleteDropdownElement = this.containerElement.querySelector('div.dropdown-menu');
            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
            this.triesDisplayElement = this.containerElement.querySelector('div[name="tries-display"]');
            this.triesScoreCurrentElement = this.containerElement.querySelector('div.tries-score > p[name="tries-current"]');
            this.triesScoreMaxElement = this.containerElement.querySelector('div.tries-score > p[name="tries-max"]');
            this.audioElement = this.containerElement.querySelector('audio');
            this.progressBar = this.containerElement.querySelector('[name="progressBar"]');
            this.currentTimeDisplay = this.containerElement.querySelector('[name="currentTime"]');
            this.durationDisplay = this.containerElement.querySelector('[name="duration"]');
            this.playButton = this.containerElement.querySelector('[name="playButton"]');
            this.pauseButton = this.containerElement.querySelector('[name="pauseButton"]');
            this.restartButton = this.containerElement.querySelector('[name="restartButton"]');

            this._boundPrepareQuestion = this.prepareQuestion.bind(this);
            this._boundMarkActiveItemOfAutocomplete = this.markActiveItemOfAutocomplete.bind(this);
            this.menuItemElement.addEventListener('click', this._boundPrepareQuestion);
            this.nextButtonElement?.addEventListener('click', this._boundPrepareQuestion);
            this.autocompleteDropdownElement?.addEventListener('mouseover', this._boundMarkActiveItemOfAutocomplete);
            this.autocompleteInputElement?.addEventListener('keydown', this._boundMarkActiveItemOfAutocomplete);
            this.audioElement.addEventListener('loadedmetadata', function () {
                this.refreshPlayerTime();
            }.bind(this));
            this.audioElement.addEventListener('play', function () {
                this.rafId = requestAnimationFrame(this.updateProgress.bind(this));
            }.bind(this));
            this.audioElement.addEventListener('pause', function () {
                cancelAnimationFrame(this.rafId);
            }.bind(this));
            this.audioElement.addEventListener('timeupdate', function () {
                if (this.audioElement.currentTime >= this.endTime) {
                    this.audioElement.pause();
                    this.playButton.disabled = false;
                    this.pauseButton.disabled = true;
                    this.restartButton.click();
                }
            }.bind(this));
            this.playButton.addEventListener('click', function () {
                if (this.audioElement.currentTime >= this.endTime) {
                    this.audioElement.currentTime = this.startTime;
                }
                this.audioElement.play();
                this.playButton.disabled = true;
                this.pauseButton.disabled = false;
                requestAnimationFrame(this.updateProgress.bind(this));
            }.bind(this));
            this.pauseButton.addEventListener('click', function () {
                this.audioElement.pause();
                this.playButton.disabled = false;
                this.pauseButton.disabled = true;
            }.bind(this));
            this.restartButton.addEventListener('click', function () {
                this.audioElement.currentTime = this.startTime;
                this.progressBar.style.width = '0%';
                this.currentTimeDisplay.textContent = '00:00';

                if (!this.audioElement.paused) {
                    this.audioElement.play();
                }
            }.bind(this));

            // Initialize components
            this.autocompleteInit();
        }

        refreshPlayerTime(done = false) {
            const currentTry = Number(this.triesScoreCurrentElement.textContent);
            const endTime = this.triesEffects.find(x => x.try === currentTry)?.data || 0;

            this.startTime = 0;
            this.endTime = done ? this.audioElement.duration : endTime;
            this.audioElement.currentTime = this.startTime;
            this.durationDisplay.textContent = this.formatTime(this.endTime);
        }

        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        updateProgress() {
            // Calculate relative position within the clip
            const relativePosition = this.audioElement.currentTime - this.startTime;
            const clipDuration = this.endTime - this.startTime;

            if (relativePosition >= 0) {
                // Update progress bar
                const progressPercentage = (relativePosition / clipDuration) * 100;
                this.progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

                // Update current time display (less frequently to avoid performance issues)
                if (Math.floor(relativePosition * 4) % 4 === 0) {
                    this.currentTimeDisplay.textContent = this.formatTime(relativePosition);
                }

                // Stop playback if we've reached the end time
                if (this.audioElement.currentTime >= this.endTime) {
                    this.audioElement.pause();
                    this.playButton.disabled = false;
                    this.pauseButton.disabled = true;
                    cancelAnimationFrame(this.rafId);
                    return;
                }
            }

            // Continue animation loop if audio is playing
            if (!this.audioElement.paused) {
                this.rafId = requestAnimationFrame(this.updateProgress.bind(this));
            }
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
                        this.triesDisplayCharacters(character);
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

        triesDisplayCharacters(selectedCharacter) {
            const currentTries = Number(this.triesScoreCurrentElement.textContent) + 1;
            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = currentTries;
            }

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
                this.refreshPlayerTime(true);
            } else {
                this.refreshPlayerTime();
            }
        }

        triesDisplayReset() {
            if (!this.triesDisplayElement) return;

            this.triesDisplayElement.innerHTML = '';

            for (let i = 0; i < this.triesMax; i++) {
                const tryElement = document.createElement('div');
                tryElement.classList.add('try');
                this.triesDisplayElement.appendChild(tryElement);
            }
        }

        defaultState() {
            if (this.answerSuccessElement) this.answerSuccessElement.src = '';
            if (this.autocompleteInputElement) this.autocompleteInputElement.value = '';
            if (this.nextButtonElement) this.nextButtonElement.style.display = 'none';
            if (this.autocompleteElement) this.autocompleteElement.style.display = 'block';

            this.triesDisplayReset();

            if (this.triesScoreCurrentElement) {
                this.triesScoreCurrentElement.textContent = 0;
            }
            if (this.triesScoreMaxElement) {
                this.triesScoreMaxElement.textContent = this.triesMax;
            }
        }

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
        }

        prepareQuestion(menuItem) {
            if (menuItem &&
                menuItem.currentTarget.localName !== 'button' &&
                !menuItem.currentTarget.classList.contains('active')) {
                return;
            }

            this.defaultState();

            this.questionEntity = getRandomCharacter(x => x.demo_music !== null);
            this.audioElement.src = this.questionEntity.demo_music;
        }
    }

    /**
     * Initializes the banners quiz
     */
    window.initializeMusic = function () {
        new QuizManager();
        console.log('Banners quiz initialized');
    }
})();