<?php

/**
 * What the quiz levels' routes answer with (routes/users/endpoints/quiz_levels.php).
 * The levels themselves are the frontend's shape - quiz-levels.ts, QUIZ_LEVELS:
 * {quiz: {"1" | "2" | "3": level}} - held to api/quiz_levels.php's rules, which
 * a constructor here cannot spell out; they are free-form in the shapes.
 */

/** `GET /api/quiz/levels` - the levels every quiz plays. */
class QuizLevelsInForce extends ResponseShape
{
    public function __construct(
        /**
         * The eight quizzes' three levels as the admin panel's Quiz levels page saved them - or null: the built-in
         * levels (the frontend's QUIZ_LEVELS) are in force, as they are while nothing is saved.
         *
         * @var array<string, mixed>
         */
        public readonly ?array $levels,
    ) {}
}

/** One thing the rules say of a set of levels, and where it is. */
class QuizLevelProblem extends ResponseShape
{
    public function __construct(
        /** The quiz it is about (banners, pixelate, mismatch, music, dish, voice, splash, constellation) - null: the levels as a whole. */
        public readonly ?string $quiz,
        /** The level: "1" (Easy), "2" (Medium) or "3" (Hard) - null: the quiz as a whole. */
        public readonly ?string $level,
        /** The step, by its try (0 up: how many wrong guesses before it - 0 to 4, 0 to 2 in Splash and Constellation) - null: the level as a whole. */
        public readonly ?int $try,
        /** What is wrong, in English. */
        public readonly string $message,
    ) {}
}

/** `GET`, `PUT` and `DELETE /api/admin/quiz-levels` - the Quiz levels page's view. */
class QuizLevelsEditorView extends ResponseShape
{
    public function __construct(
        /**
         * What is saved, as it was saved - null: nothing is, and the built-in levels are in force.
         *
         * @var array<string, mixed>
         */
        public readonly ?array $levels,
        /** When it was saved (ISO 8601, UTC); null while nothing is. */
        public readonly ?string $updated_at,
        /** @var QuizLevelProblem[] What the rules say of what is saved now: none while it is in force. */
        public readonly array $problems,
    ) {}
}

/** `POST /api/admin/quiz-levels/check` - what the rules say of levels, nothing kept. */
class QuizLevelsCheck extends ResponseShape
{
    public function __construct(
        /** @var QuizLevelProblem[] None: they may be saved. */
        public readonly array $problems,
    ) {}
}
