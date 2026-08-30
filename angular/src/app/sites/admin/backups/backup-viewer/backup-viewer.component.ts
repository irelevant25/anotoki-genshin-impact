import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { AdminApiService, BackupDatabase, BackupEntry } from '../../services/admin-api.service';

/**
 * One backup in full: what went into each database's dump, and how to get the
 * files off the server.
 *
 * The table counts are the point of opening this. A dump file's size tells you
 * almost nothing — "did the characters actually make it in" is a row count.
 */
@Component({
  selector: 'app-backup-viewer',
  templateUrl: './backup-viewer.component.html',
  styleUrls: ['./backup-viewer.component.scss'],
  imports: [DatePipe, DecimalPipe, ModalComponent, ButtonComponent],
})
export class BackupViewerComponent extends AbstractModalComponent {
  private readonly _api = inject(AdminApiService);

  /** Set by the opener before the modal renders. */
  readonly backup = signal<BackupEntry | null>(null);

  /** Which databases have their table list expanded. */
  readonly expanded = signal<Set<string>>(new Set());

  /** Which database is being downloaded, so its button can say so. */
  readonly downloading = signal<string | null>(null);

  readonly title = computed(() => {
    const backup = this.backup();
    return backup ? `Backup ${backup.id}` : 'Backup';
  });

  readonly totalRows = computed(() =>
    (this.backup()?.databases ?? []).reduce((sum, database) => sum + (database.rows ?? 0), 0),
  );

  isExpanded(alias: string): boolean {
    return this.expanded().has(alias);
  }

  toggle(alias: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(alias)) {
        next.add(alias);
      }
      return next;
    });
  }

  download(database: BackupDatabase): void {
    const backup = this.backup();
    if (!backup || this.downloading()) {
      return;
    }

    this.downloading.set(database.alias);
    this._api.downloadBackup(backup.id, database.alias).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        this._save(blob, `${backup.id}-${database.alias}.dump`);
        this.cd.markForCheck();
      },
      error: () => {
        this.downloading.set(null);
        this.notificationService.showError('Failed to download the dump');
      },
    });
  }

  /** The pg_restore line for this dump, so it can be copied rather than recalled. */
  restoreCommand(database: BackupDatabase): string {
    return `pg_restore --clean --if-exists -d ${database.name} ${this.backup()?.id}-${database.alias}.dump`;
  }

  copyRestoreCommand(database: BackupDatabase): void {
    navigator.clipboard.writeText(this.restoreCommand(database)).then(
      () => this.notificationService.showSuccess('Command copied'),
      () => this.notificationService.showError('Could not copy'),
    );
  }

  formatSize(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) {
      return '—';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDuration(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined) {
      return '—';
    }
    return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
  }

  private _save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    // Revoked on the next tick: releasing it immediately can cancel the
    // download in some browsers before it has started reading.
    setTimeout(() => URL.revokeObjectURL(url));
  }
}
