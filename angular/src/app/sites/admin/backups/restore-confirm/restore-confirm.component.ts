import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { PasswordComponent } from '../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { BackupApiService, BackupEntry, BackupPreview } from '../../../../api';

/** How long the button stays out of reach, in seconds. */
const RESTORE_COOLDOWN = 30;

/**
 * The last thing between a click and a database being replaced.
 *
 * Four separate things have to happen before the button works: the countdown
 * has to run out, the database's name has to be typed, the password has to be
 * given again, and the server has to agree about the last two. None of them is
 * clever on its own; together they make this very hard to do by accident, which
 * is the only failure mode that matters here.
 *
 * The numbers are fetched rather than assumed, so the warning names what is
 * actually at stake in this database at this moment instead of saying
 * "everything" and hoping.
 */
@Component({
  selector: 'app-restore-confirm',
  templateUrl: './restore-confirm.component.html',
  styleUrls: ['./restore-confirm.component.scss'],
  imports: [DatePipe, DecimalPipe, ModalComponent, ButtonComponent, TextComponent, PasswordComponent, LoaderComponent],
})
export class RestoreConfirmComponent extends AbstractModalComponent implements OnDestroy {
  private readonly _backupApi = inject(BackupApiService);

  /** Both set by the opener before the modal renders. */
  readonly backup = signal<BackupEntry | null>(null);
  readonly alias = signal('');

  readonly preview = signal<BackupPreview | null>(null);
  readonly loadingPreview = signal(true);
  readonly previewError = signal<string | null>(null);

  readonly typedName = signal<string | number | null | undefined>('');
  readonly password = signal<string | null | undefined>('');
  readonly running = signal(false);

  readonly remaining = signal(RESTORE_COOLDOWN);
  private _timer?: ReturnType<typeof setInterval>;

  readonly nameMatches = computed(() => String(this.typedName() ?? '').trim() === this.alias());
  readonly hasPassword = computed(() => String(this.password() ?? '').length > 0);

  readonly canRestore = computed(
    () => this.remaining() === 0 && this.nameMatches() && this.hasPassword() && !this.running() && !this.previewError(),
  );

  /** Tables losing rows, worst first — the actual cost, itemised. */
  readonly losses = computed(() => (this.preview()?.differences ?? []).filter((d) => d.delta > 0));

  /** Tables the restore brings back because they are gone now. */
  readonly returning = computed(() => (this.preview()?.differences ?? []).filter((d) => d.kind === 'created'));

  /**
   * Tables that exist now and are not in the backup.
   *
   * These are left alone: pg_restore drops only what the dump contains. Worth
   * saying out loud, because "restore" implies the database ends up matching
   * the backup, and with these present it does not.
   */
  readonly untouched = computed(() => (this.preview()?.differences ?? []).filter((d) => d.kind === 'kept'));

  /** How out of date the backup is, in the words somebody would use. */
  readonly age = computed(() => {
    const takenAt = this.preview()?.created_at;
    if (!takenAt) {
      return '';
    }
    const hours = Math.floor((Date.now() - new Date(takenAt).getTime()) / 3600000);
    if (hours < 1) {
      return 'less than an hour ago';
    }
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  });

  start(): void {
    this._timer = setInterval(() => {
      this.remaining.update((seconds) => Math.max(0, seconds - 1));
      if (this.remaining() === 0) {
        this._stopTimer();
      }
    }, 1000);

    const backup = this.backup();
    if (!backup) {
      return;
    }

    this._backupApi.previewBackup(backup.id, this.alias()).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loadingPreview.set(false);
      },
      error: (e) => {
        this.loadingPreview.set(false);
        this.previewError.set(e?.error?.error ?? 'Could not work out what this would replace');
      },
    });
  }

  override ngOnDestroy(): void {
    this._stopTimer();
    super.ngOnDestroy();
  }

  restore(): void {
    const backup = this.backup();
    if (!backup || !this.canRestore()) {
      return;
    }

    this.running.set(true);
    this._backupApi
      .restoreBackup(backup.id, this.alias(), {
        password: String(this.password() ?? ''),
        confirm: String(this.typedName() ?? '').trim(),
      })
      .subscribe({
      next: (result) => {
        this.running.set(false);
        this.notificationService.showSuccess(
          `${result.restored} restored — ${result.rows.toLocaleString()} rows. The old state was kept as backup ${result.safety_backup}.`,
        );
        this.closeModal(true);
      },
      error: (e) => {
        this.running.set(false);
        const message = e?.error?.error ?? 'The restore failed';
        this.notificationService.showError(
          e?.error?.rolled_back ? `${message} — nothing was changed.` : message,
        );
      },
    });
  }

  private _stopTimer(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }
}
