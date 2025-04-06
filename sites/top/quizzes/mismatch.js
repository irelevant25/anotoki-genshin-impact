(() => {
    'use strict';

    class QuizManager {
        isSuccess;

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
            this.nextButtonElement?.addEventListener('click', () => this.startQuestion());
            this.levelElement = this.containerElement.querySelector('div[name="quiz-difficulty-display"]');

            this.nextButtonElement?.addEventListener('click', () => {
                this.state = null;
                this.init();
            });

            this.state = storageManager.getTopMenuMismatchState(this.daily);
        }

        init() {
            this.isQuestionComplete = this.state ? this.state.isQuestionComplete : false;
            this.difficulty = this.state ? this.state.difficulty : this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() ?? 1;
            this.choicesAmount = this.state ? this.state.choicesAmount : this.options[this.difficulty].choicesAmount ?? 4;
            this.quizSet = this.state?.quizSet ? {
                options: this.state.quizSet.options.map(x => CHARACTERS.find(character => character.name === x)),
                answer: CHARACTERS.find(character => character.name === this.state.quizSet.answer),
                commonValue: this.state.quizSet.commonValue,
                quizProperty: this.state.quizSet.quizProperty
            } : this.getRandomQuizSet(this.choicesAmount);

            if (!this.daily) {
                this.levelElement.className = '';
                this.levelElement.classList.add(`level-${difficultyFromNumberToString(this.difficulty)}`);
                this.levelElement.querySelector('span').textContent = difficultyFromNumberToString(this.difficulty);
            }

            this.defaultState();
            this.startQuestion();
            if (this.isQuestionComplete) this.endQuestion(this.quizSet.answer);
            if (!this.state) this.saveState();
        }

        saveState() {
            this.state = {
                isQuestionComplete: this.isQuestionComplete,
                choicesAmount: this.choicesAmount,
                quizSet: {
                    options: this.quizSet.options.map(x => x.name),
                    answer: this.quizSet.answer.name,
                    commonValue: this.quizSet.commonValue,
                    quizProperty: this.quizSet.quizProperty
                },
                difficulty: this.difficulty
            };
            if (this.isQuestionComplete && this.onCompleteQuestion) this.onCompleteQuestion(this.quizSet.answer, this.difficulty, this.isSuccess);
            storageManager.saveTopMenuMismatchState(this.state, this.daily);
        }

        defaultState() {
            this.answerSuccessElement.src = '';
            this.nextButtonElement.style.display = 'none';
        }

        startQuestion() {
            // Clear previous question
            this.questionElement.innerHTML = "";

            // Add character options to the UI
            this.quizSet.options.forEach(character => {
                const image = document.createElement("img");
                image.src = character.icon;
                image.alt = character.name;
                image.title = character.name;
                image.addEventListener('click', () => {
                    if (this.isQuestionComplete) return;
                    this.endQuestion(this.quizSet.answer);
                    this.isSuccess = character.name === this.quizSet.answer.name;
                    this.saveState();
                });
                this.questionElement.appendChild(image);
            });

            // Log quiz info for debugging
            console.log("Quiz Options:", this.quizSet.options);
            console.log("Odd One Out (Answer):", this.quizSet.answer);
            console.log("Quiz based on property:", this.quizSet.quizProperty, "with common value:", this.quizSet.commonValue);
        }

        endQuestion(character) {
            this.answerSuccessElement.src = character.wish;
            if (!this.daily) this.nextButtonElement.style.display = 'inline';
            this.isQuestionComplete = true;
        }

        // Gets all combinations of elements taken count at a time
        getCombinations(array, count) {
            const results = [];

            function combine(start, combo) {
                if (combo.length === count) {
                    results.push(combo.slice());
                    return;
                }
                for (let i = start; i < array.length; i++) {
                    combo.push(array[i]);
                    combine(i + 1, combo);
                    combo.pop();
                }
            }

            combine(0, []);
            return results;
        }

        // Builds a frequency map for a property in an array of objects
        frequency(arr, prop) {
            const freq = {};
            for (const obj of arr) {
                freq[obj[prop]] = (freq[obj[prop]] || 0) + 1;
            }
            return freq;
        }

        // Generates a random quiz set for the mismatch quiz
        getRandomQuizSet(count = 4) {
            // Properties to use for quiz
            const properties = ["element", "weapon_type", "region"];
            const shuffledProperties = shuffleArray([...properties]);

            // Try each property
            for (const p of shuffledProperties) {
                // Get distinct values for property
                const distinctValues = shuffleArray([...new Set(CHARACTERS.map(c => c[p]))]);

                for (const v of distinctValues) {
                    // Find characters with this property value
                    const majorityCandidates = CHARACTERS.filter(c => c[p] === v);
                    if (majorityCandidates.length < count - 1) continue;

                    // Generate combinations of count-1 characters
                    const triples = this.getCombinations(majorityCandidates, count - 1);
                    const shuffledTriples = shuffleArray([...triples]);

                    for (const triple of shuffledTriples) {
                        // Find candidates with different property value
                        const oddCandidates = CHARACTERS.filter(c => c[p] !== v);
                        const shuffledOddCandidates = shuffleArray([...oddCandidates]);

                        for (const odd of shuffledOddCandidates) {
                            const candidateSet = [...triple, odd];

                            // Verify the set has good distribution of other properties
                            let valid = true;
                            for (const q of properties) {
                                if (q === p) continue;
                                const freqQ = this.frequency(candidateSet, q);
                                const maxFreq = Math.max(...Object.values(freqQ));
                                if (maxFreq >= count - 1) {
                                    valid = false;
                                    break;
                                }
                            }

                            if (valid) {
                                // Return the quiz set
                                const options = shuffleArray(candidateSet);
                                return {
                                    options,         // Quiz options
                                    answer: odd,     // Odd one out
                                    quizProperty: p, // Property for the quiz
                                    commonValue: v   // Common value
                                };
                            }
                        }
                    }
                }
            }

            console.warn("No valid random quiz set found.");
            return null;
        }
    }

    function init() {
        const siteName = 'mismatch';
        const config = APP_CONFIG.topMenu[siteName];
        new QuizManager(config.id, config, false, (questionEntity, difficulty, isSuccess) => {
            storageManager.saveStats(siteName, questionEntity.name, isSuccess, difficulty);
        }).init();
    }

    window.MismatchQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector(`[data-id="${MENU_ITEMS_TOP.quizzes.id}"`).addEventListener('click', () => {
            document.querySelector(`[data-id="${QUIZZES.mismatch.id}"]`).addEventListener('click', init, { once: true });
        }, { once: true });
    });
})();