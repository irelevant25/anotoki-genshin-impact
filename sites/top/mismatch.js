/**
 * Characters Mismatch Quiz Implementation
 * Initializes and configures the mismatch quiz
 */

(() => {
    'use strict';

    let quizManager;

    /**
     * Quiz Manager Class
     * Handles common functionality for all quiz types
     */

    class QuizManager {
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
            this.daily = true;
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
        init({ daily = this.daily } = {}) {
            // Set properties
            this.daily = daily;

            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);

            this._boundPrepareQuestion = this.prepareQuestion.bind(this);
            this.menuItemElement.addEventListener('click', this._boundPrepareQuestion);
            this.nextButtonElement?.addEventListener('click', this._boundPrepareQuestion);
        }

        /**
         * Sets the quiz to its default state
         */
        defaultState() {
            if (this.answerSuccessElement) this.answerSuccessElement.src = '';
            if (this.nextButtonElement) this.nextButtonElement.style.display = 'none';
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
                this.nextButtonElement.style.display = 'inline';
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

    /**
     * Gets all combinations of elements taken count at a time
     * 
     * @param {Array} array - Array of elements
     * @param {number} count - Number of elements to take
     * @returns {Array} Array of combinations
     */
    function getCombinations(array, count) {
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

    /**
     * Builds a frequency map for a property in an array of objects
     * 
     * @param {Array} arr - Array of objects
     * @param {string} prop - Property name
     * @returns {Object} Frequency map
     */
    function frequency(arr, prop) {
        const freq = {};
        for (const obj of arr) {
            freq[obj[prop]] = (freq[obj[prop]] || 0) + 1;
        }
        return freq;
    }

    /**
     * Generates a random quiz set for the mismatch quiz
     * 
     * @param {number} count - Number of options to include
     * @returns {Object} Quiz set with options and answer
     */
    function getRandomQuizSet(count = 4) {
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
                const triples = getCombinations(majorityCandidates, count - 1);
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
                            const freqQ = frequency(candidateSet, q);
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

    /**
     * Initializes the mismatch quiz
     */
    window.initializeMismatch = function () {
        const config = APP_CONFIG.topMenu.mismatch;

        quizManager = new QuizManager(config.id);

        // Set up the question callback
        quizManager.questionCallback = () => {
            // Clear previous question
            quizManager.questionElement.innerHTML = "";

            // Generate a new quiz set
            const quizSet = getRandomQuizSet(4);

            // Add character options to the UI
            quizSet.options.forEach(character => {
                const image = document.createElement("img");
                image.src = character.icon;
                image.alt = character.name;
                image.title = character.name;
                image.addEventListener('click', () => {
                    quizManager.endStateQuestion(quizSet.answer);
                });
                quizManager.questionElement.appendChild(image);
            });

            // Log quiz info for debugging
            console.log("Quiz Options:", quizSet.options);
            console.log("Odd One Out (Answer):", quizSet.answer);
            console.log("Quiz based on property:", quizSet.quizProperty, "with common value:", quizSet.commonValue);

            return quizSet.answer;
        };

        // Initialize with configuration
        quizManager.init();

        console.log('Mismatch quiz initialized');
    }
})();