<?php

class QuizStatsHistory extends DbModel
{
    public function __construct(
        public readonly int $user_id,
        public readonly int $character_id,
        public readonly int $quiz_id,
        public readonly int $wins,
        public readonly int $losses,
    ) {}
}
