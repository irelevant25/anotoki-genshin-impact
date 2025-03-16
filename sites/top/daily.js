(() => {
    'use strict';

    let containerElement;
    let dailyQuiz;
    let dailyQuizzesElement;
    let dailyQuizzes;
    let badgeElement;
    let levelElement;

    function updateBadge() {
        const doneNotifications = storageManager.data.topMenu.daily.done;
        const remainingDailies = dailyQuizzes.length - doneNotifications.length;
        badgeElement.textContent = remainingDailies;
        if (remainingDailies === 0) badgeElement.classList.remove('visible');
        else badgeElement.classList.add('visible');
        dailyQuizzesElement.querySelectorAll('button').forEach((item, index) => item.classList.toggle('done', doneNotifications.includes(dailyQuizzes[index])));
    }

    function updateStats(quizName, character, difficulty, isSuccess) {
        storageManager.saveStats(quizName, character.name, isSuccess, difficulty, true, dailyQuizzes);
        updateBadge();
    }

    function renderQuiz(quizName) {
        const config = APP_CONFIG.topMenu[quizName];
        dailyQuiz.id = `daily-${quizName}`;
        dailyQuiz.innerHTML = document.querySelector(`#${MENU_ITEMS_TOP[quizName].id}`).innerHTML;

        if (quizName === 'banners') {
            new BannersQuizManager(dailyQuiz.id, config, true, (...args) => updateStats(quizName, ...args)).init();
        }
        else if (quizName === 'pixelate') {
            new PixelateQuizManager(dailyQuiz.id, config, true, (...args) => updateStats(quizName, ...args)).init();
        }
        else if (quizName === 'mismatch') {
            new MismatchQuizManager(dailyQuiz.id, config, true, (...args) => updateStats(quizName, ...args)).init();
        }
        else if (quizName === 'music') {
            new MusicQuizManager(dailyQuiz.id, config, true, (...args) => updateStats(quizName, ...args)).init();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const date = getTodayString();
        const dailies = 2;
        const state = storageManager.getTopMenuDailyState();
        const difficulty = state ? state.difficulty : storageManager.getDifficulty() ?? 1;
        let quizPool = shuffleArray(['banners', 'pixelate', 'mismatch', 'music']);

        dailyQuizzes = [];
        if (state && state.date === date) dailyQuizzes.push(...state.dailyQuizzes);
        else {
            for (let i = 0; i < dailies; i++) {
                dailyQuizzes.push(quizPool.pop());
            }
            Object.values(storageManager.data.topMenu).forEach((item) => {
                if (item.dailyState) item.dailyState = null;
            });
            storageManager.saveData();
            storageManager.saveTopMenuDailyState({
                date,
                dailyQuizzes,
                done: [],
                difficulty
            });
        }

        containerElement = document.querySelector(`#${MENU_ITEMS_TOP.daily.id}`);
        dailyQuiz = containerElement.querySelector('div[name="quiz"]');
        dailyQuizzesElement = containerElement.querySelector('[name="daily-quizzes"]');
        badgeElement = document.querySelector(`#${MENU_ITEMS_TOP.daily.id}-badge-icon div.badge-daily`);
        levelElement = containerElement.querySelector('div[name="quiz-difficulty-display"]');

        dailyQuizzes.forEach((quiz) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-primary');
            button.dataset.quiz = quiz;
            button.textContent = quiz;
            button.addEventListener('click', () => renderQuiz(quiz));
            dailyQuizzesElement.appendChild(button);
        });

        levelElement.className = '';
        levelElement.classList.add(`level-${difficultyFromNumberToString(difficulty)}`);
        levelElement.querySelector('span').textContent = difficultyFromNumberToString(difficulty);

        updateBadge();
    });
})();