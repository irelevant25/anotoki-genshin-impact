<?php

/**
 * What the audit log, the migration list and the dashboard answer with.
 *
 * Each is assembled by its endpoint rather than read from a table: the log
 * joins usernames in and decodes its JSON, the migration list is the filesystem
 * checked against the table, and the dashboard is a dozen counts in one reply.
 */

// ── Audit log ─────────────────────────────────────────────────────────────────

/**
 * One logged change.
 *
 * Two things differ from the `audit_logs` row: the username is joined in, and
 * `changes` is decoded - the column stores it as JSON text.
 */
class AuditLogEntry extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $table_name,
        public readonly string $record_id,
        /** INSERT | UPDATE | DELETE */
        public readonly string $action,
        public readonly ?int $changed_by,
        public readonly ?string $changed_by_username,
        public readonly string $changed_at,
        /**
         * Column to { old, new }. Absent on an insert, which logs the whole row.
         *
         * @var array<string, mixed>
         */
        public readonly ?array $changes,
    ) {
    }
}

class AuditLogPage extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var AuditLogEntry[] */
        public readonly array $items,
    ) {
    }
}

/** An account, reduced to what the audit filter needs to name it. */
class AuditLogUser extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $username,
    ) {
    }
}

class AuditLogFilters extends ResponseShape
{
    public function __construct(
        /** @var string[] */
        public readonly array $tables,
        /** @var string[] */
        public readonly array $actions,
        /** @var AuditLogUser[] */
        public readonly array $users,
    ) {
    }
}

// ── Migrations ────────────────────────────────────────────────────────────────

class MigrationEntry extends ResponseShape
{
    public function __construct(
        /** `{database}:{filename}` - unique only within its database. */
        public readonly string $id,
        public readonly string $database,
        public readonly string $filename,
        public readonly ?string $applied_at,
        /** applied | pending | applied (file missing) */
        public readonly string $status,
        public readonly ?int $size,
    ) {
    }
}

class MigrationFile extends ResponseShape
{
    public function __construct(
        public readonly string $database,
        public readonly string $filename,
        public readonly int $size,
        public readonly string $content,
    ) {
    }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/** One row of the content counts, and where to go to edit it. */
class DashboardContent extends ResponseShape
{
    public function __construct(
        public readonly string $label,
        public readonly string $table,
        public readonly string $route,
        public readonly string $icon,
        public readonly int $total,
    ) {
    }
}

/** Records missing something they ought to have. */
class DashboardGap extends ResponseShape
{
    public function __construct(
        public readonly string $label,
        public readonly string $route,
        public readonly int $missing,
        public readonly int $total,
    ) {
    }
}

class DashboardFeedbackType extends ResponseShape
{
    public function __construct(
        public readonly string $type,
        public readonly int $total,
    ) {
    }
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
    ) {
    }
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
    ) {
    }
}

class DashboardActivity extends ResponseShape
{
    public function __construct(
        public readonly int $today,
        public readonly int $last7,
        public readonly int $last30,
        /** @var DashboardChange[] */
        public readonly array $recent,
    ) {
    }
}

class DashboardLanguage extends ResponseShape
{
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly string $native_name,
        public readonly bool $enabled,
        public readonly int $translated,
    ) {
    }
}

class DashboardTranslations extends ResponseShape
{
    public function __construct(
        public readonly int $keys,
        /** @var DashboardLanguage[] */
        public readonly array $languages,
    ) {
    }
}

class DashboardStats extends ResponseShape
{
    public function __construct(
        /** @var DashboardContent[] */
        public readonly array $content,
        /** @var DashboardGap[] Biggest job first. */
        public readonly array $gaps,
        /** @var DashboardFeedback */
        public readonly object $feedback,
        /** @var DashboardActivity */
        public readonly object $activity,
        /** @var DashboardTranslations */
        public readonly object $translations,
        /** @var DashboardAssets */
        public readonly object $assets,
    ) {
    }
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
        /** @var AssetFormatCount[] The three biggest by size. */
        public readonly array $formats,
        /** @var AssetConversionCount */
        public readonly object $images,
        /** @var AssetConversionCount */
        public readonly object $audio,
        public readonly string $generated_at,
        public readonly int $age,
    ) {
    }
}
