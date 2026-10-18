import { computed, Directive, inject, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmService } from '@anotoki/lib/ui/dialog';
import { ToastService } from '@anotoki/lib/ui/toast';

/** Sorts version strings numerically ("1.10" after "1.9"), newest first. */
export function compareVersionsDesc(a: string | undefined, b: string | undefined): number {
  const left = String(a ?? '')
    .split('.')
    .map(Number);
  const right = String(b ?? '')
    .split('.')
    .map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] || 0) - (left[i] || 0);
    if (diff) {
      return diff;
    }
  }
  return 0;
}

/** Value read from a filter input, normalised for a case-insensitive "contains". */
export function contains(haystack: unknown, needle: unknown): boolean {
  const text = String(needle ?? '')
    .trim()
    .toLowerCase();
  return (
    !text ||
    String(haystack ?? '')
      .toLowerCase()
      .includes(text)
  );
}

/** Multiselect values arrive as mixed primitives; compare them as strings. */
export function includedIn(value: unknown, selected: (string | number | boolean)[] | null | undefined): boolean {
  const list = (selected ?? []).map((entry) => String(entry));
  return list.length === 0 || list.includes(String(value ?? ''));
}

/**
 * Shared behaviour for the admin list pages: loading, delete - after the kit's
 * question, its focus on No - and building filter options out of the rows
 * that were actually loaded.
 */
@Directive()
export abstract class AdminListComponent<TRow extends { id: number }> {
  rows = signal<TRow[]>([]);
  loading = signal(false);

  /** Plural, lower case - used in notifications. */
  abstract readonly entityLabel: string;
  /** Rows after filtering, provided by the concrete list. */
  abstract readonly filtered: Signal<TRow[]>;

  protected readonly notify = inject(ToastService);
  private readonly _confirm = inject(ConfirmService);

  protected abstract fetch(): Observable<TRow[]>;
  protected abstract remove(id: number): Observable<unknown>;

  load(): void {
    this.loading.set(true);
    this.fetch().subscribe({
      next: (data) => {
        this.rows.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error(`Failed to load ${this.entityLabel}`);
      },
    });
  }

  /** Asks first (the kit's question), then deletes. */
  async confirmDelete(id: number, name?: string | null): Promise<void> {
    if (await this._confirm.ask({ title: `Delete ${name || `#${id}`}?`, confirmLabel: 'Delete', tone: 'danger' })) {
      this.delete(id);
    }
  }

  delete(id: number): void {
    this.remove(id).subscribe({
      next: () => {
        this.load();
        this.notify.success('Deleted');
      },
      error: (error) => {
        this.notify.error(error?.error?.error ?? error?.error?.message ?? 'Failed to delete');
      },
    });
  }

  /** Distinct non-empty values of a column, for a filter dropdown. */
  protected distinct(field: keyof TRow & string, sort: (a: string, b: string) => number = (a, b) => a.localeCompare(b)): Signal<string[]> {
    return computed(() => {
      const values = this.rows()
        .map((row) => (row as Record<string, unknown>)[field])
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => String(value));
      return [...new Set(values)].sort(sort);
    });
  }

  getRarityStars(rarity: number | null | undefined): string {
    return '★'.repeat(Number(rarity) || 0);
  }
}
