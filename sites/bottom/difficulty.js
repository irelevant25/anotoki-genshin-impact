(() => {
    'use strict';

    let containerElement;
    let levelContainerElement;
    let levelsDifficultiesElement;
    let selectedDifficulty;
    let modal;

    function render(level) {
        levelContainerElement.innerHTML += `
            <div class="difficulty-level level-${level.name}" data-difficulty="${level.id}">
                <div class="backdrop"></div>
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
                <div class="quiz-card quiz-${level.name}">
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

    function showLevel(difficulty) {
        selectedDifficulty = difficulty;

        const levelCards = containerElement.querySelectorAll('.difficulty-level');
        const quizCards = containerElement.querySelectorAll('.quiz-card');
        const easyQuizzes = containerElement.querySelector('#easy-quizzes');
        const mediumQuizzes = containerElement.querySelector('#medium-quizzes');
        const hardQuizzes = containerElement.querySelector('#hard-quizzes');
        const validationElement = containerElement.querySelector('[name="validation"]');
        const cardLevelElement = containerElement.querySelector(`[data-difficulty="${selectedDifficulty}"]`);
        
        validationElement.classList.add('d-none');

        // Hide all quiz selections first
        easyQuizzes.style.display = 'none';
        mediumQuizzes.style.display = 'none';
        hardQuizzes.style.display = 'none';

        // Remove selected class from all cards
        levelCards.forEach(c => {
            c.classList.remove('selected');
            c.querySelector('div.backdrop').classList.remove('d-none');
        });

        // Add selected class to clicked card
        cardLevelElement.classList.add('selected');
        cardLevelElement.querySelector('div.backdrop').classList.add('d-none');

        // Show appropriate quiz selection
        if (selectedDifficulty === '1') {
            easyQuizzes.style.display = 'block';
        } else if (selectedDifficulty === '2') {
            mediumQuizzes.style.display = 'block';
        } else if (selectedDifficulty === '3') {
            hardQuizzes.style.display = 'block';
        }

        // Clear previously selected quiz
        quizCards.forEach(q => {
            q.classList.remove('selected');
        });
    }

    function init() {
        DIFFICULTIES.forEach(level => {
            render(level);
        });

        // Get all elements
        const levelCards = containerElement.querySelectorAll('.difficulty-level');
        const buttonElement = containerElement.querySelector(`div.difficulty-container button`);

        // Add click event to each level card
        levelCards.forEach(card => {
            card.addEventListener('click', (event) => showLevel(event.currentTarget.dataset.difficulty));
        });

        buttonElement.addEventListener('click', function () {
            if (selectedDifficulty) {
                storageManager.saveDifficulty(selectedDifficulty);
                modal.hide();
            }
        });

        selectedDifficulty = storageManager.getDifficulty();
        if (selectedDifficulty) showLevel(selectedDifficulty);
    }

    document.addEventListener('DOMContentLoaded', () => {
        containerElement = document.querySelector(`#${MENU_ITEMS_BOTTOM.difficulties.id}-modal`);
        modal = new bootstrap.Modal(containerElement)
        levelContainerElement = containerElement.querySelector('.difficulty-levels');
        levelsDifficultiesElement = containerElement.querySelector('div[name="levels-difficulties"]');
        init();
    });
})();