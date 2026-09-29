import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { MigrationApiService, MigrationEntry } from '../../../../api';
import { MigrationViewerComponent } from '../migration-viewer/migration-viewer.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';

@Component({
  selector: 'app-migrations-list',
  templateUrl: './migrations-list.component.html',
  styleUrls: ['./migrations-list.component.scss'],
  imports: [ButtonComponent, LoaderComponent, AppDatePipe],
})
export class MigrationsListComponent extends AbstractModalComponent implements OnInit {
  migrations = signal<MigrationEntry[]>([]);
  error = signal<string | undefined>(undefined);
  applying = signal(false);

  /** One section per database, since filenames are only unique within one. */
  byDatabase = computed(() => {
    const groups = new Map<string, MigrationEntry[]>();
    for (const migration of this.migrations()) {
      groups.set(migration.database, [...(groups.get(migration.database) ?? []), migration]);
    }
    return [...groups.entries()].map(([database, entries]) => ({ database, entries }));
  });

  pendingCount = computed(() => this.migrations().filter((migration) => migration.status === 'pending').length);

  private readonly _migrationApi = inject(MigrationApiService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this._migrationApi.getMigrations().subscribe({
      next: (data) => {
        this.migrations.set(data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.status === 403 ? 'Migrations are visible to admins only.' : 'Failed to load migrations');
      },
    });
  }

  /**
   * Applies every pending migration on the server, in order.
   *
   * The place this matters is a host with no shell, where `php migration.php`
   * cannot run - upload the new .sql file over FTP, then apply it from here.
   */
  apply(): void {
    if (!this.pendingCount() || this.applying()) {
      return;
    }
    this.applying.set(true);
    this._migrationApi.applyMigrations({}).subscribe({
      next: (result) => {
        this.applying.set(false);
        if (result.ok) {
          this.notificationService.showSuccess(
            result.applied ? `Applied ${result.applied} migration${result.applied === 1 ? '' : 's'}.` : 'Nothing was pending.'
          );
        } else {
          const failed = result.databases.find((entry) => entry.failed);
          this.notificationService.showError(
            failed ? `${failed.database}/${failed.failed} failed: ${failed.error}` : 'Some migrations could not be applied.'
          );
        }
        this.load();
      },
      error: (error) => {
        this.applying.set(false);
        this.notificationService.showError(
          error?.status === 403 ? 'Applying migrations is for admins only.' : (error?.error?.error ?? 'Could not apply migrations.')
        );
      },
    });
  }

  view(migration: MigrationEntry): void {
    const modal = this.modalService.open<MigrationViewerComponent>(MigrationViewerComponent, { size: '5', scrollable: true });
    modal.componentInstance.database.set(migration.database);
    modal.componentInstance.filename.set(migration.filename);
    modal.componentInstance.load();
    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe();
  }

  formatSize(bytes: number | null): string {
    if (bytes === null || bytes === undefined) {
      return '—';
    }
    return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
  }
}
