import { DecimalPipe } from '@angular/common';
import { AlertComponent } from '@anotoki/lib/ui/alert';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { Component, computed, inject, signal } from '@angular/core';
import { FileApiService, toFormData, TrashedFile } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { ConfirmService, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';
import { FileSizePipe, writtenSize } from '@anotoki/lib/ui/file-size';

/**
 * What has been deleted and can still be put back.
 *
 * This used to replace the file browser, which meant the Trash button looked
 * like a filter and left no way back to where you were. It is a modal now: the
 * browser stays where it was underneath, and closing this returns to it.
 *
 * Restoring is the ordinary thing to do here. Deleting for good is the only
 * destructive action the Files page has, so it asks first - one file or the
 * whole trash - in a question of its own over this dialog, as the Files
 * Explorer's trash does and in its words, and says how much space comes back.
 */
@Component({
  selector: 'app-trash-modal',
  templateUrl: './trash-modal.component.html',
  styleUrls: ['./trash-modal.component.scss'],
  imports: [AlertComponent, SpinnerComponent, TooltipDirective, DialogFooterDirective, ButtonComponent, DecimalPipe, FileSizePipe, AnotokiDatePipe],
})
export class TrashModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);
  private readonly _confirm = inject(ConfirmService);

  readonly files = signal<TrashedFile[]>([]);
  readonly busy = signal<string | undefined>(undefined);
  readonly failed = signal<string | undefined>(undefined);
  /** Whether anything was restored or removed, so the page behind can reload. */
  private _changed = false;

  readonly total = computed(() => this.files().length);
  readonly bytes = computed(() => this.files().reduce((sum, file) => sum + (file.size ?? 0), 0));

  ngOnInit(): void {
    this.load();
  }

  dismiss(): void {
    this.closeModal(this._changed);
  }

  load(): void {
    this.loading.set(true);
    this._fileApi.getTrashedFiles().subscribe({
      next: (files) => {
        this.files.set(files ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set('The trash could not be read.');
        this.loading.set(false);
      },
    });
  }

  restore(file: TrashedFile): void {
    this.busy.set(file.trashed);
    this._fileApi.restoreAssetFile(toFormData({ folder: file.folder, trashed: file.trashed })).subscribe({
      next: () => {
        this.busy.set(undefined);
        this._changed = true;
        this.files.update((files) => files.filter((row) => row.trashed !== file.trashed));
        this.notificationService.success(`${file.name} is back in ${file.folder}/.`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this.failed.set(error?.error?.error ?? 'That could not be restored.');
      },
    });
  }

  async remove(file: TrashedFile): Promise<void> {
    if (
      !(await this._confirm.ask({ title: `Delete ${file.name} for good?`, message: 'It goes from the trash, and from the disk - there is no undo.', confirmLabel: 'Delete for good', tone: 'danger' }))
    ) {
      return;
    }
    this.busy.set(file.trashed);
    this._fileApi.deleteFilesTrash({ trashed: file.trashed }).subscribe({
      next: () => {
        this.busy.set(undefined);
        this._changed = true;
        this.files.update((files) => files.filter((row) => row.trashed !== file.trashed));
      },
      error: (error) => {
        this.busy.set(undefined);
        this.failed.set(error?.error?.error ?? 'That could not be removed.');
      },
    });
  }

  async emptyAll(): Promise<void> {
    const total = this.total();
    // The admin panel is English for its staff, so the size is written in English.
    const message = `${total.toLocaleString('en')} ${total === 1 ? 'file goes' : 'files go'} for good (${writtenSize(this.bytes(), 'en')}) - there is no undo.`;
    if (!(await this._confirm.ask({ title: 'Empty the trash?', message, confirmLabel: 'Empty the trash', tone: 'danger' }))) {
      return;
    }
    this.busy.set('all');
    this._fileApi.deleteFilesTrash().subscribe({
      next: (result) => {
        this.busy.set(undefined);
        this._changed = true;
        this.files.set([]);
        this.notificationService.success(`Removed ${result.deleted} file${result.deleted === 1 ? '' : 's'} for good.`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this.failed.set(error?.error?.error ?? 'The trash could not be emptied.');
      },
    });
  }
}
