(() => {
    'use strict';

    let containerElement;
    let dailyQuiz;
    let dailyQuizzesElement;

    function renderQuiz(quiz) {
        const config = APP_CONFIG.topMenu[quiz];
        dailyQuiz.id = `daily-${quiz}`;
        dailyQuiz.innerHTML = document.querySelector(`#${MENU_ITEMS_TOP[quiz].id}`).innerHTML;
        let quizManager;

        if (quiz === 'banners') {
            quizManager = new BannersQuizManager(dailyQuiz.id, true);
            quizManager.init({
                triesMax: config.triesMax,
                triesEffects: config.triesEffects
            });
        }
        else if (quiz === 'pixelate') {
            quizManager = new PixelateQuizManager(dailyQuiz.id, true);
            quizManager.init({
                triesMax: config.triesMax,
                triesEffects: config.triesEffects
            });
        }
        else if (quiz === 'mismatch') {
            quizManager = new MismatchQuizManager(dailyQuiz.id, true);
            quizManager.init({
                triesMax: config.triesMax,
                triesEffects: config.triesEffects
            });
        }
        else if (quiz === 'music') {
            quizManager = new MusicQuizManager(dailyQuiz.id, true);
        }

        quizManager?.startQuestion(getRandomCharacter());
    }

    document.addEventListener('DOMContentLoaded', () => {
        const dailies = 2;
        let quizPool = shuffleArray(['banners', 'pixelate', 'mismatch', 'music']);

        const dailyQuizzes = [];
        for (let i = 0; i < dailies; i++) {
            dailyQuizzes.push(quizPool.pop());
        }

        console.log(dailyQuizzes);

        containerElement = document.querySelector(`#${MENU_ITEMS_TOP.daily.id}`);
        dailyQuiz = containerElement.querySelector('div[name="quiz"]');
        dailyQuizzesElement = containerElement.querySelector('[name="daily-quizzes"]');

        dailyQuizzes.forEach((quiz) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-primary');
            button.dataset.quiz = quiz;
            button.textContent = quiz;
            button.addEventListener('click', () => renderQuiz(quiz));
            dailyQuizzesElement.appendChild(button);
        });

        // save today's generated daily
        // save state of quiz
        // change button color when quiz is completed
    });
})();