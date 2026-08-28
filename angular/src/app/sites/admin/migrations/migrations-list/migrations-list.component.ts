import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { AdminApiService, MigrationEntry } from '../../services/admin-api.service';
import { MigrationViewerComponent } from '../migration-viewer/migration-viewer.component';

@Component({
  selector: 'app-migrations-list',
  templateUrl: './migrations-list.component.html',
  styleUrls: ['./migrations-list.component.scss'],
  imports: [ButtonComponent, LoaderComponent],
})
export class MigrationsListComponent extends AbstractModalComponent implements OnInit {
  migrations = signal<MigrationEntry[]>([]);
  error = signal<string | undefined>(undefined);

  /** One section per database, since filenames are only unique within one. */
  byDatabase = computed(() => {
    const groups = new Map<string, MigrationEntry[]>();
    for (const migration of this.migrations()) {
      groups.set(migration.database, [...(groups.get(migration.database) ?? []), migration]);
    }
    return [...groups.entries()].map(([database, entries]) => ({ database, entries }));
  });

  pendingCount = computed(() => this.migrations().filter((migration) => migration.status === 'pending').length);

  private readonly _api = inject(AdminApiService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this._api.getMigrations().subscribe({
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
