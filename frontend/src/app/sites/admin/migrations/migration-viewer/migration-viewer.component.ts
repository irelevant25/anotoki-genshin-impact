import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { MigrationApiService } from '../../../../api';
import { SqlToken, tokenizeSql } from '../../../../shared/local-lib/sql-highlight';

/** Read-only view of a migration's SQL, opened from the migrations list. */
@Component({
  selector: 'app-migration-viewer',
  templateUrl: './migration-viewer.component.html',
  styleUrls: ['./migration-viewer.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent],
})
export class MigrationViewerComponent extends AbstractModalComponent {
  /** Set by the opener before the modal renders. */
  database = signal<string>('');
  filename = signal<string>('');

  content = signal<string>('');
  error = signal<string | undefined>(undefined);
  copied = signal(false);

  lineCount = computed(() => (this.content() ? this.content().split('\n').length : 0));
  /** Coloured runs of the file. Rendered one span each - never as raw markup. */
  tokens = computed<SqlToken[]>(() => tokenizeSql(this.content()));
  title = computed(() => `${this.filename()} · ${this.database()}`);

  private readonly _migrationApi = inject(MigrationApiService);

  load(): void {
    this.loading.set(true);
    this._migrationApi.getMigrationFile({ database: this.database(), filename: this.filename() }).subscribe({
      next: (file) => {
        this.content.set(file.content ?? '');
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        // Include the status: an opaque message here cost real debugging time.
        const detail = error?.error?.error ?? error?.message ?? 'unknown error';
        this.error.set(`Could not read the migration file (HTTP ${error?.status ?? '?'}): ${detail}`);
      },
    });
  }

  copy(): void {
    navigator.clipboard?.writeText(this.content()).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      },
      () => this.notificationService.showError('Could not copy to the clipboard.')
    );
  }

  close(): void {
    this.modalRef?.close();
  }
}
