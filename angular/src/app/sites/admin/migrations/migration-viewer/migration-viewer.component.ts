import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { AdminApiService } from '../../services/admin-api.service';

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
  title = computed(() => `${this.filename()} · ${this.database()}`);

  private readonly _api = inject(AdminApiService);

  load(): void {
    this.loading.set(true);
    this._api.getMigrationFile(this.database(), this.filename()).subscribe({
      next: (file) => {
        this.content.set(file.content ?? '');
        this.loading.set(false);
        this.cd.markForCheck();
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.error?.error ?? 'Could not read the migration file.');
        this.cd.markForCheck();
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
