<?php

/**
 * What POST /api/visitor/move answers with: what of this browser's visitor
 * became the signed-in person's (api/visitors.php, visitorMove()).
 */

/** The visitor's saved games, one per quiz and kind (free / daily), and where each went. */
class VisitorMoveGames extends ResponseShape
{
    public function __construct(
        /** Games now the person's: they had none for that quiz, or only a daily of another day. */
        public readonly int $moved,
        /** Games left behind because the person has their own for that quiz - theirs stays. */
        public readonly int $kept,
        /** The visitor's dailies of another day than today (UTC), which never move. */
        public readonly int $stale,
    ) {}
}

class VisitorMoveResult extends ResponseShape
{
    public function __construct(
        /**
         * Whether the key was a visitor's. False when nobody has it (any
         * more) - moved already by another tab, deleted after keep_days
         * unseen - which is no error: everything else is then 0.
         */
        public readonly bool $found,
        /** @var VisitorMoveGames The visitor's saved games. */
        public readonly object $games,
        /** Finished questions moved into the person's statistics, every one (their totals added to the person's). */
        public readonly int $results,
        /**
         * True when nothing moved because the sign-in was a silent one (the
         * IAM's sign-in hint) and the account already has something here: the
         * visitor stays as it was, and its key still opens it on this browser
         * (the owner's decision of 2026-10-11). Everything else is then 0.
         */
        public readonly bool $stayed,
    ) {}
}
