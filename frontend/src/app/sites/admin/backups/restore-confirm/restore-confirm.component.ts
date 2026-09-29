import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { BackupApiService, BackupEntry, BackupPreview } from '../../../../api';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';

/** How long the button stays out of reach, in seconds. */
const RESTORE_COOLDOWN = 30;

/**
 * The last thing between a click and a database being replaced.
 *
 * Four separate things have to happen before the restore goes ahead: the
 * countdown has to run out, the database's name has to be typed, the person
 * has to have signed in at the IAM within the last ten minutes, and the server
 * has to agree about the last two. None of them is clever on its own; together
 * they make this very hard to do by accident, which is the only failure mode
 * that matters here.
 *
 * The recent sign-in replaces retyping a password, which this site can no
 * longer ask for - it has none. The browser cannot see how old the sign-in is,
 * so the server says: `reauth_required`, answered by sending the person through
 * the IAM's sign-in once more, after which they come back to the backups page
 * and press Restore again.
 *
 * The numbers are fetched rather than assumed, so the warning names what is
 * actually at stake in this database at this moment instead of saying
 * "everything" and hoping.
 */
@Component({
  selector: 'app-restore-confirm',
  templateUrl: './restore-confirm.component.html',
  styleUrls: ['./restore-confirm.component.scss'],
  imports: [AppDatePipe, DecimalPipe, ModalComponent, ButtonComponent, TextComponent, LoaderComponent],
})
export class RestoreConfirmComponent extends AbstractModalComponent implements OnDestroy {
  private readonly _backupApi = inject(BackupApiService);
  private readonly _security = inject(SecurityService);

  /** Both set by the opener before the modal renders. */
  readonly backup = signal<BackupEntry | null>(null);
  readonly alias = signal('');

  readonly preview = signal<BackupPreview | null>(null);
  readonly loadingPreview = signal(true);
  readonly previewError = signal<string | null>(null);

  readonly typedName = signal<string | number | null | undefined>('');
  readonly running = signal(false);

  /** Set when the server wanted a more recent sign-in than this one. */
  readonly reauthRequired = signal(false);

  /** On the way to the IAM's sign-in. */
  readonly reauthenticating = signal(false);

  readonly remaining = signal(RESTORE_COOLDOWN);
  private _timer?: ReturnType<typeof setInterval>;

  readonly nameMatches = computed(() => String(this.typedName() ?? '').trim() === this.alias());

  readonly canRestore = computed(
    () => this.remaining() === 0 && this.nameMatches() && !this.running() && !this.reauthRequired() && !this.previewError(),
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

        // Not a failure of the restore - nothing was touched - but a question
        // the page answers: the sign-in is too old, so it offers a new one.
        if (e?.status === 403 && e?.error?.code === 'reauth_required') {
          this.reauthRequired.set(true);
          return;
        }

        const message = e?.error?.error ?? 'The restore failed';
        this.notificationService.showError(
          e?.error?.rolled_back ? `${message} — nothing was changed.` : message,
        );
      },
    });
  }

  /**
   * Through the IAM's sign-in again - asked for the credentials even though it
   * has a session - and back to this page, where the restore is started again
   * by hand. Nothing carries it over: a restore that set itself off after a
   * redirect would be exactly the kind of accident this modal exists to stop.
   */
  signInAgain(): void {
    this.reauthenticating.set(true);
    this._security.login({ prompt: 'login', returnTo: location.pathname + location.search }).catch(() => {
      this.reauthenticating.set(false);
      this.notificationService.showError('Signing in could not start in this browser - it may be blocking the site from storing data.');
    });
  }

  private _stopTimer(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }
}
