const SITES_BOTTOM_DIFFICULTY = Vue.createApp({
    template: html`
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Select Difficulty</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4 difficulty-container">
                    <div class="difficulty-section difficulty-levels">
                        <!-- Render difficulty levels dynamically -->
                        <div
                            v-for="level in difficulties"
                            :key="level.id"
                            :class="['difficulty-level', 'level-' + level.name, {'selected': selectedDifficulty === level.id}]"
                            :data-difficulty="level.id"
                            @click="showLevel(level.id)"
                        >
                            <div :class="['backdrop', {'d-none': selectedDifficulty === level.id}]"></div>
                            <div class="level-header">
                                <div class="level-icon" v-html="level.icon"></div>
                            </div>
                            <span class="recommended-ar">{{ capitalize(level.name) }}</span>
                            <div class="level-content">
                                <div class="level-banner">{{ level.subtitle }}</div>
                                <div class="level-name">{{ level.title }}</div>
                                <div class="level-description">{{ level.description }}</div>
                            </div>
                        </div>
                    </div>
                    <div name="levels-difficulties">
                        <div
                            v-for="level in difficulties"
                            :key="level.id"
                            :id="level.name + '-quizzes'"
                            class="quiz-selection"
                            :style="{ display: selectedDifficulty === level.id ? 'block' : 'none' }"
                        >
                            <h3 class="quiz-selection-title"></h3>
                            <div class="quiz-list">
                                <div v-for="quiz in level.quizzes" :key="quiz.title" :class="['quiz-card', 'quiz-' + level.name]">
                                    <div class="quiz-header">
                                        <div class="quiz-title">{{ quiz.title }}</div>
                                    </div>
                                    <div class="quiz-content">
                                        <div class="quiz-description">{{ quiz.description }}</div>
                                        <div class="quiz-obstacles">
                                            <div class="obstacle-title">Challenges:</div>
                                            <div v-for="difficulty in quiz.difficulties" :key="difficulty" class="obstacle-item">
                                                <span class="obstacle-icon">✦</span>
                                                <span>{{ difficulty }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p :class="['text-center', 'text-danger', 'mt-3', {'d-none': selectedDifficulty}]" name="validation">Please, select a difficulty level.</p>
                    <button class="btn btn-primary d-flex mx-auto" @click="saveDifficulty">Submit</button>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            difficulties: DIFFICULTIES,
            selectedDifficulty: null,
            modal: null,
        };
    },

    mounted() {
        this.initializeModal();
        this.loadSavedDifficulty();
    },

    methods: {
        initializeModal() {
            this.modal = new bootstrap.Modal(this.$el.parentElement);
        },

        loadSavedDifficulty() {
            const savedDifficulty = storageManager.getDifficulty();
            this.showLevel(Number(savedDifficulty));
        },

        showLevel(difficultyId) {
            this.selectedDifficulty = difficultyId;
        },

        saveDifficulty() {
            storageManager.saveDifficulty(this.selectedDifficulty);
            this.modal.hide();
        },

        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    SITES_BOTTOM_DIFFICULTY.mount('#site-difficulties-modal');
});
