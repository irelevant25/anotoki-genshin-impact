import { DecimalPipe } from '@angular/common';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FileCategory, FileCategoryApiService } from '../../../api';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ConfirmService } from '@anotoki/lib/ui/dialog';
import { FileSizePipe } from '../../../shared/local-lib/pipes/file-size.pipe';

/**
 * The kinds of asset there are, and which folder each kind lives in.
 *
 * A category's path is not a label - it is where its files actually are, and
 * the `files` table builds every path out of it. So editing one is editing the
 * tree: changing a folder moves what is in it, and retiring a category empties
 * it into `unfiled` before it goes. Both of those happen on the server, in one
 * transaction with the row, because a category that says its files are
 * somewhere they are not is worse than no category at all.
 *
 * `unfiled` itself is refused every write. Everything with no category has to
 * be somewhere, and that somewhere cannot be deletable.
 */
@Component({
  selector: 'app-file-categories',
  templateUrl: './file-categories.component.html',
  styleUrls: ['./file-categories.component.scss'],
  imports: [PageHeaderComponent, TextFieldComponent, SpinnerComponent, ButtonComponent, DecimalPipe, FileSizePipe],
})
export class FileCategoriesComponent extends AbstractModalComponent implements OnInit {
  private readonly _api = inject(FileCategoryApiService);

  readonly categories = signal<FileCategory[]>([]);
  readonly saving = signal(false);
  readonly showRetired = signal(false);

  /** The row being edited, and what is being typed into it. */
  readonly editing = signal<number | null>(null);
  readonly editLabel = signal('');
  readonly editPath = signal('');

  readonly adding = signal(false);
  readonly newCode = signal('');
  readonly newLabel = signal('');

  private readonly _confirm = inject(ConfirmService);

  readonly visible = computed(() => (this.showRetired() ? this.categories() : this.categories().filter((c) => !c.deleted)));

  readonly retiredCount = computed(() => this.categories().filter((c) => c.deleted).length);

  readonly totals = computed(() => {
    const live = this.categories().filter((c) => !c.deleted);
    return {
      files: live.reduce((sum, c) => sum + c.files, 0),
      bytes: live.reduce((sum, c) => sum + c.bytes, 0),
    };
  });

  /** The folder a code would mean, shown while it is being typed. */
  readonly newPathPreview = computed(() => this.newCode().trim().toLowerCase().replace(/\./g, '/'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._api.getFileCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Could not read the categories.');
      },
    });
  }

  // ── Adding ─────────────────────────────────────────────────────────────────

  startAdding(): void {
    this.newCode.set('');
    this.newLabel.set('');
    this.adding.set(true);
  }

  cancelAdding(): void {
    this.adding.set(false);
  }

  add(): void {
    const code = this.newCode().trim().toLowerCase();
    if (!code || this.saving()) {
      return;
    }

    this.saving.set(true);
    this._api.addFileCategory({ code, label: this.newLabel().trim() || undefined }).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.saving.set(false);
        this.adding.set(false);
        this.notificationService.success('Category added.');
      },
      error: (error) => {
        this.saving.set(false);
        // The API says which rule was broken and why, and that sentence is the
        // whole answer, so it is shown rather than replaced.
        this.notificationService.error(error?.error?.error ?? 'That could not be added.');
      },
    });
  }

  // ── Editing ────────────────────────────────────────────────────────────────

  startEditing(category: FileCategory): void {
    this.editing.set(category.id);
    this.editLabel.set(category.label);
    this.editPath.set(category.path);
  }

  cancelEditing(): void {
    this.editing.set(null);
  }

  save(category: FileCategory): void {
    if (this.saving()) {
      return;
    }

    const path = this.editPath().trim();
    const moving = path !== category.path && category.files > 0;

    this.saving.set(true);
    this._api.saveFileCategory(category.id, { label: this.editLabel().trim(), path }).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.saving.set(false);
        this.editing.set(null);
        this.notificationService.success(moving ? `Moved, and ${category.files.toLocaleString()} files with it.` : 'Saved.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(error?.error?.error ?? 'That could not be saved.');
      },
    });
  }

  // ── Retiring ───────────────────────────────────────────────────────────────

  /** Asks first - the kit's question, saying where the files go - then retires it. */
  async askToRetire(category: FileCategory): Promise<void> {
    const message = category.files ? `Its ${category.files.toLocaleString()} files move to unfiled first.` : null;
    if (await this._confirm.ask({ title: `Retire ${category.code}?`, message, confirmLabel: 'Retire', tone: 'danger' })) {
      this.retire(category);
    }
  }

  retire(category: FileCategory): void {
    this.saving.set(true);

    this._api.retireFileCategory(category.id).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.saving.set(false);
        this.notificationService.success(category.files ? `Retired, and ${category.files.toLocaleString()} files moved to unfiled.` : 'Retired.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(error?.error?.error ?? 'That could not be retired.');
      },
    });
  }

  /** Creating one that already exists but is retired brings the same row back. */
  revive(category: FileCategory): void {
    this.saving.set(true);
    this._api.addFileCategory({ code: category.code, label: category.label }).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.saving.set(false);
        this.notificationService.success('Back in use.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(error?.error?.error ?? 'That could not be brought back.');
      },
    });
  }
}
