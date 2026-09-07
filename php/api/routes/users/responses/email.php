<?php

/**
 * What the admin Email Log answers with - a record of messages the API sent.
 *
 * Metadata only, on purpose (see the 039_email_log migration): no bodies, and a
 * subject only for the kinds whose subject is not sensitive.
 */

class EmailLogEntry extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $recipient,
        /** confirmation | password_reset | login_code (and any future kind). */
        public readonly string $kind,
        /** Null for kinds whose subject carries something secret (the sign-in code). */
        public readonly ?string $subject,
        /** sent | failed */
        public readonly string $status,
        public readonly ?string $error,
        public readonly ?int $user_id,
        /** Resolved for display; null if the account is gone or it was to a non-user. */
        public readonly ?string $username,
        public readonly string $created_at,
    ) {
    }
}

class EmailLogPage extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var EmailLogEntry[] */
        public readonly array $items,
    ) {
    }
}

/** The distinct values the log holds, for the page's filter dropdowns. */
class EmailLogFilters extends ResponseShape
{
    public function __construct(
        /** @var string[] */
        public readonly array $kinds,
        /** @var string[] */
        public readonly array $statuses,
    ) {
    }
}
