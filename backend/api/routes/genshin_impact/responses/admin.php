<?php

/**
 * What the dashboard answers with.
 *
 * Assembled by its endpoint rather than read from a table: the dashboard is a
 * dozen counts in one reply. (The admin tools' answers - the audit log, the
 * error log, feedback, backups, the file explorer, the people - are the anotoki
 * library's own, as the Migrations page's are.)
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────

/** One row of the content counts, and where to go to edit it. */
class DashboardContent extends ResponseShape
{
    public function __construct(public readonly string $label, public readonly string $table, public readonly string $route, public readonly string $icon, public readonly int $total) {}
}

/** Records missing something they ought to have. */
class DashboardGap extends ResponseShape
{
    public function __construct(public readonly string $label, public readonly string $route, public readonly int $missing, public readonly int $total) {}
}

class DashboardFeedbackType extends ResponseShape
{
    public function __construct(public readonly string $type, public readonly int $total) {}
}

class DashboardFeedback extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $new,
        public readonly int $last7,
        public readonly int $last30,
        /** @var DashboardFeedbackType[] */
        public readonly array $byType,
    ) {}
}

class DashboardChange extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $table_name,
        public readonly string $record_id,
        public readonly string $action,
        public readonly string $changed_at,
        public readonly ?string $changed_by_username,
    ) {}
}

class DashboardActivity extends ResponseShape
{
    public function __construct(
        public readonly int $today,
        public readonly int $last7,
        public readonly int $last30,
        /** @var DashboardChange[] */
        public readonly array $recent,
    ) {}
}

class DashboardLanguage extends ResponseShape
{
    public function __construct(public readonly string $code, public readonly string $name, public readonly string $native_name, public readonly bool $enabled, public readonly int $translated) {}
}

class DashboardTranslations extends ResponseShape
{
    public function __construct(
        public readonly int $keys,
        /** @var DashboardLanguage[] */
        public readonly array $languages,
    ) {}
}

class DashboardStats extends ResponseShape
{
    public function __construct(
        /** @var DashboardContent[] */
        public readonly array $content,
        /** @var DashboardGap[] Biggest job first. */
        public readonly array $gaps,
        /** @var DashboardFeedback|null The ADMIN's alone: null for an EDITOR (the admin tools are the ADMIN's). */
        public readonly ?object $feedback,
        /** @var DashboardActivity|null The ADMIN's alone: null for an EDITOR (the audit log is the ADMIN's). */
        public readonly ?object $activity,
        /** @var DashboardTranslations */
        public readonly object $translations,
        /** @var DashboardAssets */
        public readonly object $assets,
        /** @var DashboardVisitors */
        public readonly object $visitors,
    ) {}
}

/**
 * People playing without signing in (api/visitors.php): how many the server
 * keeps now, against the ceiling past which it turns new ones away - the
 * figure to watch, since nothing else on the site shows it.
 */
class DashboardVisitors extends ResponseShape
{
    public function __construct(
        /** False while migration users/045 waits: nobody is kept as a visitor yet, and the counts are 0. */
        public readonly bool $available,
        /** Visitors the server keeps now. */
        public readonly int $count,
        /** Questions they answered, in the quiz history. */
        public readonly int $results,
        /** The ceiling (`max_visitors`): past it, new visitors are refused - those already there keep playing. */
        public readonly int $max,
        /** Days a visitor is kept after their last visit (`keep_days`). */
        public readonly int $keep_days,
    ) {}
}

/**
 * The asset tree in three numbers and a short list.
 *
 * The same survey the Files page draws in full, cut down to what a card holds:
 * how much there is, and how much of it has no converted twin. Cached for a
 * day, so `age` is how old the answer is rather than how long it took.
 */
class DashboardAssets extends ResponseShape
{
    public function __construct(
        public readonly int $total_files,
        public readonly int $total_bytes,
        /** @var AssetFormatCount[] Every extension in the tree, biggest first. */
        public readonly array $formats,
        /** @var AssetConversionCount */
        public readonly object $images,
        /** @var AssetConversionCount */
        public readonly object $audio,
        /** @var AssetCatalogueCounts Files on disk the database has never heard of. */
        public readonly object $catalogue,
        public readonly string $generated_at,
        public readonly int $age,
    ) {}
}
