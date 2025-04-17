const SITES_TOP_QUIZZES_VOICE = {
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
            <p class="d-inline-flex justify-content-center my-0">
                <span name="question" :class="questionTextClasses">{{ questionText }}</span>
            </p>
            <div class="player-container d-block mx-auto" :class="playerContainerClasses">
                <!-- Hidden audio element -->
                <audio ref="audioElement" preload="metadata" @loadedmetadata="onAudioLoadedMetadata" @play="onAudioPlay" @pause="onAudioPause" @timeupdate="onAudioTimeUpdate"></audio>

                <!-- Custom progress bar -->
                <div class="progress-container">
                    <div name="progressBar" class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                </div>

                <!-- Time display -->
                <div class="time-display">
                    <span name="currentTime">{{ currentTimeFormatted }}</span>
                    <span name="duration">{{ durationFormatted }}</span>
                </div>

                <!-- Controls -->
                <div class="controls">
                    <button name="playButton" class="btn" @click="playAudio" :disabled="isPlaying">Play</button>
                    <button name="pauseButton" class="btn" @click="pauseAudio" :disabled="!isPlaying">Pause</button>
                    <button name="restartButton" class="btn" @click="restartAudio">Restart</button>
                </div>
            </div>
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
        const siteId = 'voice';
        const config = APP_CONFIG.topMenu[siteId];
        const state = storageManager.getTopMenuVoiceState(this.daily);
        const difficulty = state?.difficulty || (this.daily ? storageManager.getTopMenuDailyState().difficulty : storageManager.getDifficulty() || 1);

        return {
            siteId,
            config,
            questionEntity: state ? CHARACTERS.find((character) => character.name === state.questionEntity) : getRandomCharacter(),
            questionText: '',
            tries: state?.tries || [],
            triesMax: state?.triesMax || config[difficulty]?.triesMax || 5,
            triesEffects: state?.triesEffects || config[difficulty]?.triesEffects || [],
            isQuestionComplete: state?.isQuestionComplete || false,
            difficulty,
            autocompleteInstance: null,

            // Audio player related
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            progressPercentage: 0,
            rafId: null,
            startTime: 0,
            endTime: 0,

            // Classes for effects
            questionTextClasses: [],
            playerContainerClasses: [],
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

        currentTimeFormatted() {
            return this.formatTime(this.currentTime - this.startTime);
        },

        durationFormatted() {
            return this.formatTime(this.endTime - this.startTime);
        },
    },

    watch: {
        tries: {
            handler(newTries) {
                if (newTries.length > 0) {
                    this.refreshPlayerTime();
                    this.applyEffects();
                    if (this.isSuccess || newTries.length >= this.triesMax) {
                        this.endQuestion();
                    }
                }
                this.saveState();
            },
            deep: true,
        },
    },

    mounted() {
        this.autocompleteInstance = new Autocomplete(this.$refs.autocomplete, this.handleCharacterSelection);
        this.startQuestion();
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
                isPlaying: false,
                currentTime: 0,
                progressPercentage: 0,
                questionTextClasses: [],
                playerContainerClasses: [],
            });

            this.startQuestion();
            this.saveState();
        },

        startQuestion() {
            this.$refs.audioElement.src = this.questionEntity.voice_over.audio;
            this.questionText = this.questionEntity.voice_over.text;
            this.applyEffects();
        },

        endQuestion() {
            this.isQuestionComplete = true;
            this.refreshPlayerTime();
            storageManager.saveStats(this.siteId, this.questionEntity.name, this.isSuccess, this.difficulty);
        },

        saveState() {
            if (this.isQuestionComplete && this.onCompleteQuestion) this.onCompleteQuestion(this.questionEntity, this.difficulty, this.isSuccess);
            storageManager.saveTopMenuVoiceState(
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

        applyEffects() {
            this.questionTextClasses = [];
            this.playerContainerClasses = [];

            if (!this.isQuestionComplete) {
                const effects = this.triesEffects.find((x) => x.try === this.tries.length);
                if (effects && effects.class) {
                    const classes = effects.class.split(' ');
                    this.questionTextClasses = classes;
                    this.playerContainerClasses = classes;
                }
            }
        },

        onAudioLoadedMetadata() {
            this.duration = this.$refs.audioElement.duration;
            this.refreshPlayerTime();
        },

        onAudioPlay() {
            this.isPlaying = true;
            this.rafId = requestAnimationFrame(this.updateProgress);
        },

        onAudioPause() {
            this.isPlaying = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        },

        onAudioTimeUpdate() {
            const audio = this.$refs.audioElement;
            if (!audio) return;
            this.currentTime = audio.currentTime;

            if (audio.currentTime >= this.endTime) {
                this.pauseAudio();
                this.restartAudio();
            }
        },

        updateProgress() {
            const audio = this.$refs.audioElement;

            // Calculate relative position within the clip
            const relativePosition = audio.currentTime - this.startTime;
            const clipDuration = this.endTime - this.startTime;

            if (relativePosition >= 0) {
                // Update progress bar
                this.progressPercentage = (relativePosition / clipDuration) * 100;

                // Stop playback if we've reached the end time
                if (audio.currentTime >= this.endTime) {
                    this.pauseAudio();
                    return;
                }
            }

            // Continue animation loop if audio is playing
            if (this.isPlaying) {
                this.rafId = requestAnimationFrame(this.updateProgress);
            }
        },

        playAudio() {
            const audio = this.$refs.audioElement;
            if (audio.currentTime >= this.endTime) {
                audio.currentTime = this.startTime;
            }
            audio.play();
        },

        pauseAudio() {
            this.$refs.audioElement.pause();
        },

        restartAudio() {
            const audio = this.$refs.audioElement;
            audio.currentTime = this.startTime;
            this.progressPercentage = 0;
            this.currentTime = this.startTime;
        },

        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        },

        refreshPlayerTime() {
            const audio = this.$refs.audioElement;
            if (!audio) return;

            this.startTime = 0;

            // voice.js has a slightly different effect calculation than music.js
            const currentTryEffectData = this.triesEffects.find((x) => x.try === this.tries.length)?.data ?? 1;
            const newEndTime = audio.duration * currentTryEffectData;

            this.endTime = this.isQuestionComplete || newEndTime > audio.duration ? audio.duration : newEndTime;

            audio.currentTime = this.startTime;
            this.currentTime = this.startTime;
            this.progressPercentage = 0;
        },
    },

    beforeUnmount() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        const audio = this.$refs.audioElement;
        if (audio) {
            audio.pause();
            audio.src = '';
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const quiz = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_QUIZZES_VOICE, {}),
        },
        template: html` <base-component :daily="false"></base-component> `,
    });
    quiz.mount('#site-quizzes #site-voice');
});
