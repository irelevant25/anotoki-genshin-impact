/**
 * Audit logs, migrations, and the admin landing page.
 *
 * Hand-written: each of these is assembled by its endpoint rather than read
 * from a table - the log joins usernames in and decodes its JSON, the migration
 * list is the filesystem checked against the table, and the dashboard is a
 * dozen counts in one response.
 */

import { AuditLog } from '../models';

// ── Audit logs ────────────────────────────────────────────────────────────────

export interface AuditLogQuery {
  table?: string;
  action?: string;
  user?: string;
  recordId?: string;
  /**
   * The entity a change belongs to rather than the row it touched: a
   * character's talents and voice overs are logged under their own tables, and
   * these two gather them back into one history.
   */
  entityTable?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page: number;
}

// ── Migrations ────────────────────────────────────────────────────────────────

/**
 * Query parameters, not path segments: a URI ending in `.sql` is intercepted by
 * PHP's built-in server before it ever reaches the router.
 */
export interface MigrationFileQuery {
  database: string;
  filename: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

