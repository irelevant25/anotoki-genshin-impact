<?php

class QuizStatsHistory extends DbModel
{
    public function __construct(
        public readonly int $user_id,
        public readonly int $character_id,
        public readonly int $quiz_id,
        public readonly int $wins,
        public readonly int $losses,
        // NOT NULL in the table and absent from this model until now, so a
        // POST here was rejected as an unknown field and, had it got past that,
        // would have failed the constraint.
        public readonly int $attempts = 0,
    ) {}
}
