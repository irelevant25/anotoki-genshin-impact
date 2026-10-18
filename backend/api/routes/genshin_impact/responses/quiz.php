<?php

/**
 * What the quiz endpoints answer with.
 *
 * A saved game's `state` is deliberately opaque: it is the front end's own
 * shape, stored as it arrives. What is in it is the browser's business; only
 * who it belongs to is the server's.
 */

class QuizProgress extends ResponseShape
{
    public function __construct(
        /** The quiz's name, which is what the URL uses. */
        public readonly string $quiz,
        /**
         * The front end's own shape, stored as it arrives and handed back
         * untouched. Nothing on this side reads into it.
         *
         * @var array<string, mixed>
         */
        public readonly array $state,
        public readonly bool $is_daily,
    ) {}
}

class QuizProgressSaved extends ResponseShape
{
    public function __construct(public readonly string $quiz, public readonly bool $is_daily) {}
}

class QuizProgressDeleted extends ResponseShape
{
    public function __construct(public readonly int $deleted) {}
}

/**
 * What a carry of the browser's games did (POST /api/quiz/progress/carry), and
 * the player's saved games after it - so the page needs no second read.
 */
class QuizCarryResult extends ResponseShape
{
    public function __construct(
        /** Games written: the player had none for that quiz, or only a daily of another day. */
        public readonly int $carried,
        /** Games left out because the player already has their own for that quiz - theirs stays. */
        public readonly int $kept,
        /** Dailies of another day than today (UTC), which never move. */
        public readonly int $stale,
        /** Quizzes this site does not know (any more). */
        public readonly int $unknown,
        /** Games nobody has played yet - a fresh draw - which are not worth keeping. */
        public readonly int $unplayed,
        /** @var QuizProgress[] Every saved game of the player, after the carry. */
        public readonly array $games,
        /**
         * True when nothing was carried because the sign-in was a silent one
         * (the IAM's sign-in hint) and the account already has something here:
         * the browser keeps its games (the owner's decision of 2026-10-11).
         * The counts are then 0, and `games` the account's own.
         */
        public readonly bool $stayed,
    ) {}
}

class QuizResultAck extends ResponseShape
{
    public function __construct(public readonly bool $recorded) {}
}

/** A player's totals for one character in one quiz. */
class QuizStatsRow extends ResponseShape
{
    public function __construct(
        public readonly string $quiz,
        public readonly int $character_id,
        public readonly string $character_name,
        public readonly ?string $icon_name,
        public readonly int $wins,
        public readonly int $losses,
        public readonly int $attempts,
    ) {}
}

/**
 * A voice over drawn at random, with the character it belongs to.
 *
 * Only lines with both English audio and English text are drawn, and the
 * Travellers are left out - one character across twelve rows would meet
 * themselves.
 */
class QuizVoiceOverRound extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $type,
        public readonly string $title_english,
        public readonly string $text_english,
        public readonly string $audio_english,
        public readonly int $character_id,
        public readonly string $character_name,
        public readonly ?string $icon_name,
        public readonly ?string $wish_icon_name,
        public readonly int $rarity,
        public readonly string $element,
    ) {}
}

/**
 * A player's totals for one quiz at one difficulty.
 *
 * quiz_stats_history cannot answer this: it is keyed on the user, the character
 * and the quiz, so a hard win and an easy one land in the same row and add up
 * to a total that has forgotten which was which. The per-question log kept the
 * difficulty, so these are aggregated from there instead.
 */
class QuizDifficultyRow extends ResponseShape
{
    public function __construct(
        public readonly string $quiz,
        /**
         * 1 easy, 2 medium, 3 hard - the numbers the front end's config is
         * keyed by. Null on questions answered before the column was added.
         */
        public readonly ?int $difficulty,
        public readonly int $wins,
        public readonly int $losses,
        public readonly int $attempts,
    ) {}
}

/** A day a player answered something, and how much of it they got right. */
class QuizActivityDay extends ResponseShape
{
    public function __construct(
        /** The day as YYYY-MM-DD. Days with nothing on them are not sent. */
        public readonly string $day,
        public readonly int $played,
        public readonly int $wins,
    ) {}
}

/** One finished question, with enough of the character to draw them. */
class QuizRecentResult extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $quiz,
        public readonly int $character_id,
        public readonly string $character_name,
        public readonly ?string $icon_name,
        public readonly bool $win,
        public readonly int $attempts,
        public readonly ?int $difficulty,
        public readonly string $created_at,
    ) {}
}
