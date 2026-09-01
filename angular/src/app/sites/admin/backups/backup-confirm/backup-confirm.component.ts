import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { BackupStatus } from '../../../../api';

/**
 * Confirms a backup before it runs.
 *
 * Making one is not dangerous, so this is not a warning - it is a chance to say
 * what the backup is for while the reason is still in your head, and to see
 * that the server is about to lock up for a few seconds and roughly how much
 * disk it will take.
 */
@Component({
  selector: 'app-backup-confirm',
  templateUrl: './backup-confirm.component.html',
  styleUrls: ['./backup-confirm.component.scss'],
  imports: [DecimalPipe, ModalComponent, ButtonComponent, TextComponent],
})
export class BackupConfirmComponent extends AbstractModalComponent {
  /** Set by the opener before the modal renders. */
  readonly status = signal<BackupStatus | null>(null);

  readonly description = signal<string | number | null | undefined>('');

  readonly databases = computed(() => (this.status()?.databases ?? []).filter((database) => !database.error));

  readonly unreachable = computed(() => (this.status()?.databases ?? []).filter((database) => !!database.error));

  readonly liveTotal = computed(() => this.databases().reduce((sum, database) => sum + (database.size ?? 0), 0));

  readonly tableTotal = computed(() => this.databases().reduce((sum, database) => sum + (database.tables ?? 0), 0));

  /**
   * A rough guess at the dump size, from the ratio the existing backups show.
   *
   * Said as "usually around", because it is arithmetic on one number and the
   * real answer depends on what compresses well.
   */
  readonly estimate = computed(() => {
    const live = this.liveTotal();
    return live ? live * 0.18 : 0;
  });

  confirm(): void {
    this.closeModal(true);
  }

  /** What the opener passes to the API. Read after the modal closes. */
  get descriptionText(): string {
    return String(this.description() ?? '').trim();
  }

  formatSize(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) {
      return '—';
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
