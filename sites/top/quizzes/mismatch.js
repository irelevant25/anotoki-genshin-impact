const SITES_TOP_QUIZZES_MISMATCH = {
    props: {
        daily: {
            type: Boolean,
            default: false,
        },
        onCompleteQuestion: {
            type: Function,
            default: null,
        },
    },

    template: html`
        <div class="quiz-container">
            <div :class="levelClass" name="quiz-difficulty-display" v-if="!daily">
                <span class="recommended-ar">{{ difficultyText }}</span>
            </div>
            <div name="question" class="mx-auto character-grid">
                <img v-for="character in quizSet.options" :src="character.icon" :alt="character.name" :title="character.name" @click="handleCharacterClick(character)" />
            </div>
            <button class="btn btn-primary my-3 next-button" v-show="isQuestionComplete && !daily" @click="startNextQuestion">Next</button>
            <img name="answer-success" class="d-block mx-auto" :src="answerImageSrc" />
        </div>
    `,

    data() {
        return {
            options: {},
            isQuestionComplete: false,
            difficulty: 1,
            choicesAmount: 4,
            quizSet: {
                options: [],
                answer: null,
                commonValue: '',
                quizProperty: '',
            },
            answerImageSrc: '',
            isSuccess: false,
            state: null,
        };
    },

    computed: {
        levelClass() {
            return this.daily ? '' : `level-${difficultyFromNumberToString(this.difficulty)}`;
        },
        difficultyText() {
            return difficultyFromNumberToString(this.difficulty);
        },
    },

    mounted() {
        this.initializeQuiz();
    },

    methods: {
        initializeQuiz() {
            const siteName = 'mismatch';
            const config = APP_CONFIG.topMenu[siteName];
            this.options = config;
            this.state = storageManager.getTopMenuMismatchState(this.daily);
            this.init();
        },

        init() {
            this.isQuestionComplete = this.state ? this.state.isQuestionComplete : false;
            this.difficulty = this.state ? this.state.difficulty : this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() ?? 1;

            this.choicesAmount = this.state ? this.state.choicesAmount : this.options[this.difficulty]?.choicesAmount ?? 4;

            if (this.state?.quizSet) {
                this.quizSet = {
                    options: this.state.quizSet.options.map((x) => CHARACTERS.find((character) => character.name === x)),
                    answer: CHARACTERS.find((character) => character.name === this.state.quizSet.answer),
                    commonValue: this.state.quizSet.commonValue,
                    quizProperty: this.state.quizSet.quizProperty,
                };
            } else {
                this.quizSet = this.getRandomQuizSet(this.choicesAmount);
            }

            this.answerImageSrc = '';

            // console.log('Quiz Options:', this.quizSet.options);
            // console.log('Odd One Out (Answer):', this.quizSet.answer);
            // console.log('Quiz based on property:', this.quizSet.quizProperty, 'with common value:', this.quizSet.commonValue);

            if (this.isQuestionComplete) {
                this.endQuestion(this.quizSet.answer);
            }

            if (!this.state) {
                this.saveState();
            }
        },

        saveState() {
            this.state = {
                isQuestionComplete: this.isQuestionComplete,
                choicesAmount: this.choicesAmount,
                quizSet: {
                    options: this.quizSet.options.map((x) => x.name),
                    answer: this.quizSet.answer.name,
                    commonValue: this.quizSet.commonValue,
                    quizProperty: this.quizSet.quizProperty,
                },
                difficulty: this.difficulty,
            };
            if (this.isQuestionComplete && this.onCompleteQuestion) this.onCompleteQuestion(this.quizSet.answer, this.difficulty, this.isSuccess);
            storageManager.saveTopMenuMismatchState(this.state, this.daily);
        },

        startNextQuestion() {
            this.state = null;
            this.init();
        },

        handleCharacterClick(character) {
            if (this.isQuestionComplete) return;
            this.endQuestion(this.quizSet.answer);
            this.isSuccess = character.name === this.quizSet.answer.name;
            this.saveState();
        },

        endQuestion(character) {
            this.answerImageSrc = character.wish;
            this.isQuestionComplete = true;
        },

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
        },

        // Builds a frequency map for a property in an array of objects
        frequency(arr, prop) {
            const freq = {};
            for (const obj of arr) {
                freq[obj[prop]] = (freq[obj[prop]] || 0) + 1;
            }
            return freq;
        },

        // Generates a random quiz set for the mismatch quiz
        getRandomQuizSet(count = 4) {
            // Properties to use for quiz
            const properties = ['element', 'weapon_type', 'region'];
            const shuffledProperties = shuffleArray([...properties]);

            // Step 1: Find viable property-value combinations
            const viableOptions = [];

            for (const prop of shuffledProperties) {
                // Count distribution of each property value
                const valueDistribution = {};
                for (const char of CHARACTERS) {
                    const value = char[prop];
                    valueDistribution[value] = (valueDistribution[value] || 0) + 1;
                }

                // Get values that have enough characters (at least count-1)
                for (const [value, frequency] of Object.entries(valueDistribution)) {
                    if (frequency >= count - 1) {
                        viableOptions.push({ property: prop, value });
                    }
                }
            }

            // Step 2: Try each viable option until we find a valid quiz
            const shuffledOptions = shuffleArray(viableOptions);

            for (const { property, value } of shuffledOptions) {
                // Get matching characters for the majority set
                const matchingChars = CHARACTERS.filter((char) => char[property] === value);

                // Get non-matching characters for the odd one out
                const nonMatchingChars = CHARACTERS.filter((char) => char[property] !== value);

                // Skip if we don't have enough characters
                if (matchingChars.length < count - 1 || nonMatchingChars.length === 0) {
                    continue;
                }

                // Try a limited number of random combinations
                const maxAttempts = 30;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    // Randomly select count-1 characters with matching property
                    const majority = this.selectRandomSubset(matchingChars, count - 1);

                    // Randomly select an odd character
                    const oddOneOut = this.selectRandom(nonMatchingChars);

                    // Create the full candidate set
                    const candidateSet = [...majority, oddOneOut];

                    // Verify the set has good distribution of other properties
                    let valid = true;
                    for (const prop of properties) {
                        if (prop === property) continue;

                        // Check frequencies of values for this property
                        const freqMap = this.frequency(candidateSet, prop);
                        const maxFreq = Math.max(...Object.values(freqMap));

                        // If any value appears count-1 or more times, it's not valid
                        if (maxFreq >= count - 1) {
                            valid = false;
                            break;
                        }
                    }

                    if (valid) {
                        // Return the valid quiz set
                        const options = shuffleArray(candidateSet);
                        return {
                            options, // Quiz options
                            answer: oddOneOut, // Odd one out
                            quizProperty: property, // Property for the quiz
                            commonValue: value, // Common value
                        };
                    }
                }
            }

            console.warn('No valid random quiz set found.');
            return null;
        },

        // Helper method to select a random subset of an array
        selectRandomSubset(array, size) {
            const shuffled = shuffleArray([...array]);
            return shuffled.slice(0, size);
        },

        // Helper method to select a random element from an array
        selectRandom(array) {
            return array[Math.floor(Math.random() * array.length)];
        },
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const quiz = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_QUIZZES_MISMATCH, {}),
        },
        template: html` <base-component :daily="false"></base-component> `,
    });
    quiz.mount('#site-quizzes #site-mismatch');
});
