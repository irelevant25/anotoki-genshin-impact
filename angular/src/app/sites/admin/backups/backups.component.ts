import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { AdminApiService, BackupEntry, BackupStatus } from '../services/admin-api.service';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { Roles } from '../../../shared/local-lib/services/options-helper.service';
import { BackupViewerComponent } from './backup-viewer/backup-viewer.component';
import { BackupConfirmComponent } from './backup-confirm/backup-confirm.component';

/**
 * Whole-database backups.
 *
 * One row per backup, one dump file inside it per database. Making, downloading
 * and restoring them are admin-only; an editor sees the list and nothing else.
 */
@Component({
  selector: 'app-admin-backups',
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.scss'],
  imports: [DatePipe, DecimalPipe, ButtonComponent, LoaderComponent],
})
export class BackupsComponent extends AbstractModalComponent implements OnInit, OnDestroy {
  private readonly _api = inject(AdminApiService);
  private readonly _roles = inject(RoleService);

  /**
   * Backups are System: an editor may look at the list, and that is all.
   * The server enforces it either way; hiding the buttons is so nobody is
   * offered something that will only refuse them.
   */
  readonly canManage = this._roles.hasRole(Roles.ADMIN);

  readonly backups = signal<BackupEntry[]>([]);
  readonly status = signal<BackupStatus | null>(null);
  readonly busy = signal(false);
  readonly creating = signal(false);
  readonly description = signal<string | number | null | undefined>('');
  readonly deleteConfirm = signal<string | null>(null);

  /**
   * Seconds spent on the backup running right now.
   *
   * A button that sits there for three seconds with nothing to show for it
   * reads as a page that has hung, which is when people press it again.
   */
  readonly elapsed = signal(0);
  private _timer?: ReturnType<typeof setInterval>;

  /** Why the button is off, or null when it is not. */
  readonly blockedReason = computed(() => {
    const status = this.status();
    if (!status) {
      return null;
    }
    if (!status.supported) {
      return `Backups are only implemented for PostgreSQL, and this install is on ${status.driver ?? 'another driver'}.`;
    }
    if (!status.pg_dump) {
      return 'pg_dump was not found on this server. Install the PostgreSQL client tools, or point config/backup.local.php at them.';
    }
    if (!status.writable) {
      return `The backup directory is not writable: ${status.directory}`;
    }
    return null;
  });

  readonly totalSize = computed(() => this.backups().reduce((sum, backup) => sum + (backup.size ?? 0), 0));

  /** A backup that is not "complete" is one to look at rather than rely on. */
  readonly troubled = computed(() => this.backups().filter((backup) => backup.status !== 'complete').length);

  ngOnInit(): void {
    this.loadStatus();
    this.load();
  }

  override ngOnDestroy(): void {
    this._stopTimer();
    super.ngOnDestroy();
  }

  load(): void {
    this.busy.set(true);
    this._api.getBackups().subscribe({
      next: (backups) => {
        this.backups.set(backups ?? []);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.notificationService.showError('Failed to load backups');
      },
    });
  }

  loadStatus(): void {
    this._api.getBackupStatus().subscribe({
      next: (status) => this.status.set(status),
      error: () => undefined,
    });
  }

  /** Asks first, then runs. The description is easiest to write beforehand. */
  askToCreate(): void {
    if (this.creating() || this.blockedReason() || !this.canManage) {
      return;
    }

    const modal = this.modalService.open<BackupConfirmComponent>(BackupConfirmComponent, { size: '3' });
    modal.componentInstance.status.set(this.status());

    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((confirmed) => {
      if (confirmed) {
        this.description.set(modal.componentInstance.descriptionText);
        this.create();
      }
    });
  }

  private create(): void {
    this.creating.set(true);
    this.elapsed.set(0);
    this._timer = setInterval(() => this.elapsed.update((seconds) => seconds + 1), 1000);

    this._api.createBackup(String(this.description() ?? '').trim()).subscribe({
      next: (backup) => {
        this._stopTimer();
        this.creating.set(false);
        this.description.set('');

        if (backup.status === 'complete') {
          this.notificationService.showSuccess(`Backup ${backup.id} finished in ${this.formatDuration(backup.duration_ms)}`);
        } else {
          // Partial is the dangerous case: there is a backup, and it is not
          // all of the databases. Saying "done" would be a lie.
          this.notificationService.showError('Some databases could not be dumped. Open the backup to see which.');
        }

        this.load();
        this.loadStatus();
      },
      error: (e) => {
        this._stopTimer();
        this.creating.set(false);
        this.notificationService.showError(e?.error?.error ?? 'Failed to create the backup');
        this.load();
      },
    });
  }

  view(backup: BackupEntry): void {
    // A restore inside the viewer leaves a fresh safety backup behind, so the
    // list is out of date the moment one finishes.
    const modal = this.openModal<BackupViewerComponent>(BackupViewerComponent, { size: '4', scrollable: true }, () => {
      this.load();
      this.loadStatus();
    });
    modal.componentInstance.backup.set(backup);
  }

  confirmDelete(id: string): void {
    this.deleteConfirm.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(id: string): void {
    this._api.deleteBackup(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.notificationService.showSuccess('Backup deleted');
        this.load();
        this.loadStatus();
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this.notificationService.showError(e?.error?.error ?? 'Failed to delete');
      },
    });
  }

  /** How many databases went in, of how many were tried. */
  databaseLabel(backup: BackupEntry): string {
    if (!backup.databases.length) {
      return '—';
    }
    const done = backup.databases.filter((database) => !database.error).length;
    return done === backup.databases.length ? String(done) : `${done} of ${backup.databases.length}`;
  }

  rowsOf(backup: BackupEntry): number {
    return backup.databases.reduce((sum, database) => sum + (database.rows ?? 0), 0);
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
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  formatDuration(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined) {
      return '—';
    }
    return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
  }

  private _stopTimer(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }
}
