import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { BackupApiService, BackupDatabase, BackupEntry } from '../../../../api';
import { RoleService } from '../../../../shared/local-lib/services/role.service';
import { Roles } from '../../../../shared/local-lib/services/options-helper.service';
import { RestoreConfirmComponent } from '../restore-confirm/restore-confirm.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';

/** The one database's dump, as the backend names it (BACKUP_ALIAS in backups.php). */
const BACKUP_ALIAS = 'genshin';

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
  imports: [AppDatePipe, DecimalPipe, ModalComponent, ButtonComponent],
})
export class BackupViewerComponent extends AbstractModalComponent {
  private readonly _backupApi = inject(BackupApiService);
  private readonly _roles = inject(RoleService);

  /** Handing over a dump, or replacing a database with one, is admin work. */
  readonly canManage = computed(() => this._roles.hasRole(Roles.ADMIN));

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
    this._backupApi.downloadBackup(backup.id, database.alias).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        this._save(blob, `${backup.id}-${database.alias}.dump`);
      },
      error: () => {
        this.downloading.set(null);
        this.notificationService.showError('Failed to download the dump');
      },
    });
  }

  /**
   * Opens the confirmation that stands between this and a replaced database.
   *
   * Everything that makes the restore safe lives in there, and the server
   * checks it again regardless - this only opens a door.
   */
  restore(database: BackupDatabase): void {
    const backup = this.backup();
    if (!backup) {
      return;
    }

    const modal = this.modalService.open<RestoreConfirmComponent>(RestoreConfirmComponent, { size: '4', scrollable: true });
    modal.componentInstance.backup.set(backup);
    modal.componentInstance.alias.set(database.alias);
    modal.componentInstance.start();

    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((restored) => {
      // A restore leaves a fresh safety backup behind, so the list underneath
      // is out of date the moment one finishes.
      if (restored) {
        this.closeModal(true);
      }
    });
  }

  /**
   * Whether this dump can be put back from here: the one-database dump only.
   * Each half of a backup from when the site had two databases would leave the
   * one database disagreeing with itself about which migrations ran.
   */
  restorable(database: BackupDatabase): boolean {
    return database.alias === BACKUP_ALIAS;
  }

  /**
   * The pg_restore line for this dump, so it can be copied rather than recalled.
   * Half of an old two-database backup goes into a database of its own - into
   * the live one, `--clean` would drop and recreate its record of migrations.
   */
  restoreCommand(database: BackupDatabase): string {
    const file = `${this.backup()?.id}-${database.alias}.dump`;
    return this.restorable(database)
      ? `pg_restore --clean --if-exists -d ${database.name} ${file}`
      : `pg_restore -d <a new, empty database> ${file}`;
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
