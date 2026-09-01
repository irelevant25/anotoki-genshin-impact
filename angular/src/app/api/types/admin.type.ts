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

/**
 * One logged change.
 *
 * Two things differ from the `audit_logs` row: the endpoint joins the username
 * in, and it decodes `changes`, which the column stores as JSON text.
 */
export interface AuditLogEntry extends Omit<AuditLog, 'changes'> {
  changed_by_username: string | null;
  /** Column -> { old, new }. Absent on an insert, which logs the whole row. */
  changes: Record<string, unknown> | null;
}

export interface AuditLogQuery {
  table?: string;
  action?: string;
  user?: string;
  recordId?: string;
  from?: string;
  to?: string;
  page: number;
}

export interface AuditLogPage {
  total: number;
  page: number;
  pageSize: number;
  items: AuditLogEntry[];
}

export interface AuditLogFilters {
  tables: string[];
  actions: string[];
  users: { id: number; username: string }[];
}

// ── Migrations ────────────────────────────────────────────────────────────────

export interface MigrationEntry {
  /** `{database}:{filename}` - a migration is only unique within its database. */
  id: string;
  database: string;
  filename: string;
  applied_at: string | null;
  status: 'applied' | 'pending' | 'applied (file missing)';
  size: number | null;
}

/**
 * Query parameters, not path segments: a URI ending in `.sql` is intercepted by
 * PHP's built-in server before it ever reaches the router.
 */
export interface MigrationFileQuery {
  database: string;
  filename: string;
}

export interface MigrationFile {
  database: string;
  filename: string;
  size: number;
  content: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  content: { label: string; table: string; route: string; icon: string; total: number }[];
  /** Records missing something they ought to have, biggest job first. */
  gaps: { label: string; route: string; missing: number; total: number }[];
  feedback: {
    total: number;
    new: number;
    last7: number;
    last30: number;
    byType: { type: string; total: number }[];
  };
  activity: {
    today: number;
    last7: number;
    last30: number;
    recent: {
      id: number;
      table_name: string;
      record_id: string;
      action: string;
      changed_at: string;
      changed_by_username: string | null;
    }[];
  };
  translations: {
    keys: number;
    languages: { code: string; name: string; native_name: string; enabled: boolean; translated: number }[];
  };
}
