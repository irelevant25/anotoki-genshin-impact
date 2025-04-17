const SITES_TOP_QUIZZES_PIXELATE = {
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
            <div :class="['level-' + difficultyString, { 'd-none': daily }]" name="quiz-difficulty-display">
                <span class="recommended-ar">{{ difficultyString }}</span>
            </div>
            <canvas name="question" class="d-block mx-auto" width="256" height="256" ref="canvas"></canvas>
            <div class="pt-3 search-container">
                <div name="autocomplete" v-show="!isQuestionComplete" ref="autocomplete"></div>
                <button class="btn btn-primary ms-3 next-button" v-show="!daily && isQuestionComplete" @click="resetQuiz">Next</button>
            </div>
            <div class="d-flex justify-content-center tries-score my-2">
                Tries:
                <p name="tries-current">{{ tries.length }}</p>
                /
                <p name="tries-max">{{ triesMax }}</p>
            </div>
            <div name="tries-display" class="d-flex justify-content-center tries-characters">
                <div class="try" v-for="(tryChar, index) in displayTries" :key="index">
                    <img v-if="tryChar" :src="getCharacterIconImageUrl(tryChar)" />
                </div>
            </div>
            <img name="answer-success" class="d-block mx-auto" :src="isQuestionComplete ? questionEntity?.wish : ''" />
        </div>
    `,

    data() {
        const siteId = 'pixelate';
        const config = APP_CONFIG.topMenu[siteId];
        const state = storageManager.getTopMenuPixelateState(this.daily);
        const difficulty = state?.difficulty || (this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() || 1);

        return {
            siteId,
            config,
            questionEntity: state ? CHARACTERS.find((character) => character.name === state.questionEntity) : getRandomCharacter(),
            tries: state?.tries || [],
            triesMax: state?.triesMax || config[difficulty]?.triesMax || 5,
            triesEffects: state?.triesEffects || config[difficulty]?.triesEffects || [],
            isQuestionComplete: state?.isQuestionComplete || false,
            difficulty,
            autocompleteInstance: null,
        };
    },

    computed: {
        isSuccess() {
            return this.tries.length > 0 && this.questionEntity?.name === this.tries[this.tries.length - 1];
        },

        difficultyString() {
            return difficultyFromNumberToString(this.difficulty);
        },

        displayTries() {
            const result = Array(this.triesMax).fill(null);
            this.tries.forEach((tryName, index) => {
                if (index < this.triesMax) result[index] = tryName;
            });
            return result;
        },
    },

    watch: {
        tries: {
            handler(newTries) {
                if (newTries.length > 0) {
                    if (this.isSuccess || newTries.length >= this.triesMax) {
                        this.endQuestion();
                    }
                    this.applyEffects();
                }
                this.saveState();
            },
            deep: true,
        },
    },

    mounted() {
        this.autocompleteInstance = new Autocomplete(this.$refs.autocomplete, this.handleCharacterSelection);
        this.startQuestion();
        this.applyEffects();
        if (!this.state) this.saveState();
    },

    methods: {
        handleCharacterSelection(selectedCharacter) {
            this.tries.push(selectedCharacter.name);
        },

        getCharacterIconImageUrl: (characterName) => getCharacterIconImageUrl(characterName),

        resetQuiz() {
            Object.assign(this, {
                tries: [],
                isQuestionComplete: false,
                questionEntity: getRandomCharacter(),
                triesMax: this.config[this.difficulty].triesMax || 5,
                triesEffects: this.config[this.difficulty].triesEffects || [],
            });
            this.startQuestion();
            this.saveState();
        },

        applyEffects() {
            const currentTry = this.tries.length;
            let size = this.triesEffects.find((x) => x.try === currentTry)?.data;
            if (this.isQuestionComplete) size = 175;
            this.pixelateImage(this.$refs.canvas, this.questionEntity.icon, size, size);
        },

        startQuestion() {
            if (this.questionEntity) {
                this.pixelateImage(
                    this.$refs.canvas,
                    this.questionEntity.icon,
                    this.triesEffects.find((x) => x.try === this.tries.length)?.data || 10,
                    this.triesEffects.find((x) => x.try === this.tries.length)?.data || 10
                );
            }
        },

        endQuestion() {
            this.isQuestionComplete = true;
            storageManager.saveStats(this.siteId, this.questionEntity.name, this.isSuccess, this.difficulty);
        },

        saveState() {
            if (this.isQuestionComplete && this.onCompleteQuestion) this.onCompleteQuestion(this.questionEntity, this.difficulty, this.isSuccess);
            storageManager.saveTopMenuPixelateState(
                {
                    triesMax: this.triesMax,
                    triesEffects: this.triesEffects,
                    questionEntity: this.questionEntity?.name,
                    isQuestionComplete: this.isQuestionComplete,
                    tries: this.tries,
                    difficulty: this.difficulty,
                },
                this.daily
            );
        },

        pixelateImage(canvas, imgUrl, width, height) {
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = 175;
            canvas.height = 175;

            // Create offscreen canvas for low resolution
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width;
            offCanvas.height = height;
            const offCtx = offCanvas.getContext('2d');

            // Load the image
            const img = new Image();
            img.src = imgUrl;

            img.onload = function () {
                // Draw at low resolution
                offCtx.drawImage(img, 0, 0, width, height);

                // Clear main canvas and set settings
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled = false; // Disable smoothing for pixelated look

                // Draw the low-res image scaled up
                ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
            };
        },
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const quiz = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_QUIZZES_PIXELATE, {}),
        },
        template: html` <base-component :daily="false"></base-component> `,
    });
    quiz.mount('#site-quizzes #site-pixelate');
});
