<?php

class QuizState extends DbModel
{
    public function __construct(
        public readonly int     $user_id,
        public readonly int     $quiz_id,
        public readonly ?object $state    = null,
        public readonly ?bool   $is_daily = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['state'];
    }
}
