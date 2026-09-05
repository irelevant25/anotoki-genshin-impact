import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FileApiService, MissingFile } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { FileSizePipe } from '../../../../shared/local-lib/pipes/file-size.pipe';

/**
 * The rows the catalogue keeps for files that are not there any more.
 *
 * The Files page has always been able to count them and never able to say which
 * they were, which made the number impossible to act on. Forgetting a row is
 * the only way to make the count go down: the reconcile sweep deliberately
 * leaves them, because a file that has vanished is news rather than tidying.
 *
 * The one thing worth reading before pressing the button is `used_by`. Most of
 * these are nothing but a stale row, but a few are still named by a character
 * or a weapon, and forgetting those takes the picture off that row as well -
 * there is nothing else it could do, since the file is gone either way.
 */
@Component({
  selector: 'app-missing-modal',
  templateUrl: './missing-modal.component.html',
  styleUrls: ['./missing-modal.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent, DecimalPipe, FileSizePipe, AppDatePipe],
})
export class MissingModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  readonly files = signal<MissingFile[]>([]);
  readonly working = signal(false);
  readonly failed = signal<string | undefined>(undefined);
  readonly confirming = signal(false);

  readonly total = computed(() => this.files().length);
  readonly bytes = computed(() => this.files().reduce((sum, file) => sum + (file.size ?? 0), 0));
  readonly stillUsed = computed(() => this.files().filter((file) => file.used_by > 0));

  /** Grouped by category, since a whole folder usually goes at once. */
  readonly byCategory = computed(() => {
    const groups = new Map<string, MissingFile[]>();
    for (const file of this.files()) {
      const list = groups.get(file.category) ?? [];
      list.push(file);
      groups.set(file.category, list);
    }
    return [...groups]
      .map(([category, files]) => ({ category, files }))
      .sort((a, b) => b.files.length - a.files.length);
  });

  /** Nothing is deleted from disk here: the files are already gone. */
  dismiss(): void {
    this.closeModal(false);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._fileApi.getFilesMissing().subscribe({
      next: (files) => {
        this.files.set(files ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set('That list could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  forgetAll(): void {
    this.working.set(true);
    this._fileApi.deleteFilesMissing().subscribe({
      next: (result) => {
        this.working.set(false);
        this.confirming.set(false);
        this.notificationService.showSuccess(`Forgot ${result.forgotten} row${result.forgotten === 1 ? '' : 's'}.`);
        this.closeModal(true);
      },
      error: (error) => {
        this.working.set(false);
        this.failed.set(error?.error?.error ?? 'Those rows could not be removed.');
      },
    });
  }

  forget(file: MissingFile): void {
    this.working.set(true);
    this._fileApi.deleteFilesMissing({ id: String(file.id) }).subscribe({
      next: () => {
        this.working.set(false);
        this.files.update((files) => files.filter((row) => row.id !== file.id));
      },
      error: (error) => {
        this.working.set(false);
        this.failed.set(error?.error?.error ?? 'That row could not be removed.');
      },
    });
  }
}
