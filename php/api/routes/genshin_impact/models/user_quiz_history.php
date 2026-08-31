<?php

class UserQuizHistory extends DbModel
{
    public function __construct(
        public readonly int  $user_id,
        public readonly int  $character_id,
        public readonly int  $quiz_id,
        public readonly bool $win,
        // Same omission as QuizStatsHistory - NOT NULL in the table, missing
        // here. `difficulty` is the column added alongside, so a result can say
        // how hard the question was.
        public readonly int  $attempts = 0,
        public readonly ?int $difficulty = null,
    ) {}
}
