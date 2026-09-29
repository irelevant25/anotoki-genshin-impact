import { Component, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LookupApiService } from '../../../../api';

/**
 * Throws the whole error log away.
 *
 * Not dangerous - nothing here is data anybody depends on, and the log starts
 * filling again with the next failure. It is a modal rather than a bare button
 * because it cannot be undone, and because a log that was cleared on a misclick
 * takes the evidence of a bug with it.
 */
@Component({
  selector: 'app-clear-errors',
  templateUrl: './clear-errors.component.html',
  styleUrls: ['./clear-errors.component.scss'],
  imports: [ModalComponent, ButtonComponent],
})
export class ClearErrorsComponent extends AbstractModalComponent {
  readonly running = signal(false);

  private readonly _lookupApi = inject(LookupApiService);

  clear(): void {
    this.running.set(true);
    this._lookupApi.deleteErrors().subscribe({
      next: (result) => {
        this.running.set(false);
        this.notificationService.showSuccess(
          result.deleted ? `Cleared ${result.deleted} log file${result.deleted === 1 ? '' : 's'}` : 'There was nothing to clear'
        );
        this.closeModal(true);
      },
      error: (e) => {
        this.running.set(false);
        this.notificationService.showError(e?.error?.error ?? 'Could not clear the log');
      },
    });
  }
}
