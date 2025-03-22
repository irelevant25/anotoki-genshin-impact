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

            this.autocompleteContainerElement = this.containerElement.querySelector('div[name="autocomplete"]');
            new Autocomplete(this.autocompleteContainerElement, (selectedCharacter) => {
                this.tries.push(selectedCharacter.name);
                this.triesDisplayCharacters(selectedCharacter);
                this.saveState();
            });

            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            // this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);
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
            this.levelElement = this.containerElement.querySelector('div[name="quiz-difficulty-display"]');

            this.nextButtonElement?.addEventListener('click', () => {
                this.state = null;
                this.init();
            });
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

            this.state = storageManager.getTopMenuMusicState(this.daily);
        }

        init() {
            this.isQuestionComplete = this.state ? this.state.isQuestionComplete : false;
            this.difficulty = this.state ? this.state.difficulty : this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() ?? 1;
            this.triesMax = this.state ? this.state.triesMax : this.options[this.difficulty].triesMax ?? 5;
            this.triesEffects = this.state?.triesEffects ?? this.options[this.difficulty].triesEffects ?? [];
            this.tries = this.state?.tries ?? [];
            this.questionEntity = this.state ? CHARACTERS.find(character => character.name === this.state.questionEntity) : getRandomCharacter(x => x.demo_music !== null);

            if (!this.daily) {
                this.levelElement.className = '';
                this.levelElement.classList.add(`level-${difficultyFromNumberToString(this.difficulty)}`);
                this.levelElement.querySelector('span').textContent = difficultyFromNumberToString(this.difficulty);
            }

            this.rafId;
            this.startTime = 0;
            this.endTime = 0;

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
            storageManager.saveTopMenuMusicState(this.state, this.daily);
        }

        refreshPlayerTime() {
            const currentTry = Number(this.triesScoreCurrentElement.textContent);
            this.startTime = 0;
            this.endTime = this.isQuestionComplete ? this.audioElement.duration : this.triesEffects.find(x => x.try === currentTry)?.data ?? this.audioElement.duration;
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
            this.refreshPlayerTime();
        }

        defaultState() {
            this.answerSuccessElement.src = '';
            this.nextButtonElement.style.display = 'none';
            this.autocompleteContainerElement.style.display = 'block';
            this.playButton.disabled = false;
            this.pauseButton.disabled = true;

            this.triesDisplayElement.innerHTML = '';
            for (let i = 0; i < this.triesMax; i++) {
                const tryElement = document.createElement('div');
                tryElement.classList.add('try');
                this.triesDisplayElement.appendChild(tryElement);
            }

            this.triesScoreCurrentElement.textContent = 0;
            this.triesScoreMaxElement.textContent = this.triesMax;
        }

        startQuestion() {
            this.audioElement.src = this.questionEntity.demo_music;
        }

        endQuestion(character) {
            this.answerSuccessElement.src = character.wish;
            if (!this.daily) this.nextButtonElement.style.display = 'inherit';
            this.autocompleteContainerElement.style.display = 'none';
            this.isQuestionComplete = true;
        }
    }

    window.MusicQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        const siteName = 'music';
        const config = APP_CONFIG.topMenu[siteName];
        new QuizManager(config.id, config, false, (questionEntity, difficulty, isSuccess) => {
            storageManager.saveStats(siteName, questionEntity.name, isSuccess, difficulty);
        }).init();
        console.log('Pixelate quiz initialized');
    });
})();