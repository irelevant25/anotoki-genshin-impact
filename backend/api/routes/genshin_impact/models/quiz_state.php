<?php

class QuizState extends DbModel
{
    public function __construct(
        public readonly int     $user_id,
        public readonly int     $quiz_id,
        // ?array, not ?object: the body parser decodes JSON into associative
        // arrays, so an object here made every POST carrying a state fail with
        // a TypeError. Every other jsonb column in these models is ?array.
        public readonly ?array  $state    = null,
        public readonly ?bool   $is_daily = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['state'];
    }
}
