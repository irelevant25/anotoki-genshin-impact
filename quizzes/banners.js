document.addEventListener('DOMContentLoaded', () => {
    const triesEffects = [
        { try: 0, class: 'difficulty-1 difficulty-2 difficulty-3' },
        { try: 1, class: 'difficulty-1 difficulty-2' },
        { try: 2, class: 'difficulty-1' },
    ];
    const triesDisplayMethod = QuizManager.TriesDisplayMethodEnum.Characters;
    const quizManager = new QuizManager('quiz-banners');
    quizManager.questionCallback = () => {
        const character = getRandomCharacter();
        quizManager.questionElement.src = character.namecard_banner;
        return character;
    };
    quizManager.init({ triesDisplayMethod, triesEffects });
});