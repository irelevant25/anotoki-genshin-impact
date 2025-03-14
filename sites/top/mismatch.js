(() => {
    'use strict';

    class QuizManager {
        constructor(idSelector, daily = false) {
            this.idSelector = idSelector;
            this.daily = daily;

            // Default properties
            this.questionEntity = null;
            this.isQuestionComplete = false;
        }

        init() {
            // Get DOM elements
            this.containerElement = document.querySelector(`#${this.idSelector}`);
            this.questionElement = this.containerElement.querySelector('[name="question"]');
            this.answerSuccessElement = this.containerElement.querySelector('img[name="answer-success"]');
            this.nextButtonElement = this.containerElement.querySelector('button.next-button');
            this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);

            this.menuItemElement?.addEventListener('click', () => this.startQuestion());
            this.nextButtonElement?.addEventListener('click', () => this.startQuestion());
        }

        defaultState() {
            this.answerSuccessElement.src = '';
            this.nextButtonElement.style.display = 'none';
        }

        startQuestion() {
            this.defaultState();
            this.isQuestionComplete = false;

            // Clear previous question
            this.questionElement.innerHTML = "";

            // Generate a new quiz set
            const quizSet = this.getRandomQuizSet(4);

            // Add character options to the UI
            quizSet.options.forEach(character => {
                const image = document.createElement("img");
                image.src = character.icon;
                image.alt = character.name;
                image.title = character.name;
                image.addEventListener('click', () => {
                    this.endQuestion(quizSet.answer);
                });
                this.questionElement.appendChild(image);
            });

            // Log quiz info for debugging
            console.log("Quiz Options:", quizSet.options);
            console.log("Odd One Out (Answer):", quizSet.answer);
            console.log("Quiz based on property:", quizSet.quizProperty, "with common value:", quizSet.commonValue);

            this.questionEntity = quizSet.answer;
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

    window.MismatchQuizManager = QuizManager;

    document.addEventListener('DOMContentLoaded', () => {
        const config = APP_CONFIG.topMenu.mismatch;
        const quizManager = new QuizManager(config.id);
        quizManager.init();
        console.log('Mismatch quiz initialized');
    });
})();