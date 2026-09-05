import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FileApiService, toFormData, TrashedFile } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';
import { FileSizePipe } from '../../../../shared/local-lib/pipes/file-size.pipe';

/**
 * What has been deleted and can still be put back.
 *
 * This used to replace the file browser, which meant the Trash button looked
 * like a filter and left no way back to where you were. It is a modal now: the
 * browser stays where it was underneath, and closing this returns to it.
 *
 * Restoring is the ordinary thing to do here. Deleting for good is the only
 * destructive action the Files page has, so it asks first and says how much
 * space it will return.
 */
@Component({
  selector: 'app-trash-modal',
  templateUrl: './trash-modal.component.html',
  styleUrls: ['./trash-modal.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent, DecimalPipe, FileSizePipe, AppDatePipe],
})
export class TrashModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  readonly files = signal<TrashedFile[]>([]);
  readonly busy = signal<string | undefined>(undefined);
  readonly failed = signal<string | undefined>(undefined);
  readonly confirming = signal(false);
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
        this.notificationService.showSuccess(`${file.name} is back in ${file.folder}/.`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this.failed.set(error?.error?.error ?? 'That could not be restored.');
      },
    });
  }

  remove(file: TrashedFile): void {
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

  emptyAll(): void {
    this.busy.set('all');
    this._fileApi.deleteFilesTrash().subscribe({
      next: (result) => {
        this.busy.set(undefined);
        this.confirming.set(false);
        this._changed = true;
        this.files.set([]);
        this.notificationService.showSuccess(`Removed ${result.deleted} file${result.deleted === 1 ? '' : 's'} for good.`);
      },
      error: (error) => {
        this.busy.set(undefined);
        this.failed.set(error?.error?.error ?? 'The trash could not be emptied.');
      },
    });
  }
}
