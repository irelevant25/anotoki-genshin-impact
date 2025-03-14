(() => {
    'use strict';

    let levelContainerElement;
    let levelsDifficultiesElement;

    function render(level) {
        levelContainerElement.innerHTML += `
            <div class="domain-level level-${level.name}" data-difficulty="${level.name}">
                <div class="level-header">
                    <!-- <span class="level-number">${level.numer}</span> -->
                    <div class="level-icon">${level.icon}</div>
                </div>
                <span class="recommended-ar">${capitalize(level.name)}</span>
                <div class="level-content">
                    <div class="level-banner">${level.subtitle}</div>
                    <div class="level-name">${level.title}</div>
                    <div class="level-description">${level.description}</div>
                </div>
            </div>
        `;
        let html = '';
        html += `
            <div class="quiz-selection" id="${level.name}-quizzes">
                <h3 class="quiz-selection-title"></h3>
                <div class="quiz-list">
        `;
        level.quizzes.forEach(quiz => {
            html += `
                <div class="quiz-card quiz-${level.name}" data-quiz="${quiz.name}">
                    <div class="quiz-header">
                        <div class="quiz-title">${quiz.title}</div>
                    </div>
                    <div class="quiz-content">
                        <div class="quiz-description">${quiz.description}</div>
                        <div class="quiz-obstacles">
                        <div class="obstacle-title">Challenges:</div>
            `;
            quiz.difficulties.forEach(difficulty => {
                html += `
                    <div class="obstacle-item">
                        <span class="obstacle-icon">✦</span>
                        <span>${difficulty}</span>
                    </div>
                `;
            });
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
        levelsDifficultiesElement.innerHTML += html;
    }

    function init() {
        DIFFICULTIES.forEach(level => {
            render(level);
        });

        // Get all elements
        const levelCards = document.querySelectorAll('.domain-level');
        const quizCards = document.querySelectorAll('.quiz-card');
        const easyQuizzes = document.getElementById('easy-quizzes');
        const mediumQuizzes = document.getElementById('medium-quizzes');
        const hardQuizzes = document.getElementById('hard-quizzes');

        let selectedDifficulty = null;
        let selectedQuiz = null;

        // Add click event to each level card
        levelCards.forEach(card => {
            card.addEventListener('click', function () {
                // Hide all quiz selections first
                easyQuizzes.style.display = 'none';
                mediumQuizzes.style.display = 'none';
                hardQuizzes.style.display = 'none';

                // Remove selected class from all cards
                levelCards.forEach(c => {
                    c.classList.remove('selected');
                });

                // Add selected class to clicked card
                this.classList.add('selected');

                // Store selected difficulty
                selectedDifficulty = this.dataset.difficulty;

                // Show appropriate quiz selection
                if (selectedDifficulty === 'easy') {
                    easyQuizzes.style.display = 'block';
                } else if (selectedDifficulty === 'medium') {
                    mediumQuizzes.style.display = 'block';
                } else if (selectedDifficulty === 'hard') {
                    hardQuizzes.style.display = 'block';
                }

                // Clear previously selected quiz
                quizCards.forEach(q => {
                    q.classList.remove('selected');
                });
                selectedQuiz = null;
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        levelContainerElement = document.querySelector(`#${MENU_ITEMS_BOTTOM.difficulties.id}-modal-content .domain-levels`);
        levelsDifficultiesElement = document.querySelector(`#${MENU_ITEMS_BOTTOM.difficulties.id}-modal-content div[name="levels-difficulties"]`);
        init();
    });
})();