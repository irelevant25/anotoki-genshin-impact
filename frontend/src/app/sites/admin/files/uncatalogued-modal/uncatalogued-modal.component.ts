import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AlertComponent } from '@anotoki/lib/ui/alert';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';
import { DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { AccordionComponent, DisclosureComponent } from '@anotoki/lib/ui/disclosure';
import { FileSizePipe } from '@anotoki/lib/ui/file-size';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { FileApiService, UncataloguedFile } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';

/**
 * The files on disk that no row in the database names - what the Files page
 * counts as "not in the database": they came over FTP or from a script, past
 * the API.
 *
 * The count was all the page could say of them, while "recorded but gone"
 * beside it opened its list. Add them to the database is the page's Add strays
 * to database, pressed with the list in sight: a file in a category's folder
 * stays where it is, one in a folder no category claims moves into unfiled/
 * first - and the page then shows what became of each.
 */
@Component({
  selector: 'app-uncatalogued-modal',
  templateUrl: './uncatalogued-modal.component.html',
  styleUrls: ['./uncatalogued-modal.component.scss'],
  imports: [AlertComponent, SpinnerComponent, DialogFooterDirective, ButtonComponent, AccordionComponent, DisclosureComponent, DecimalPipe, FileSizePipe, AnotokiDatePipe],
})
export class UncataloguedModalComponent extends AbstractModalComponent {
  private readonly _fileApi = inject(FileApiService);

  readonly files = signal<UncataloguedFile[]>([]);
  readonly failed = signal<string | undefined>(undefined);

  readonly total = computed(() => this.files().length);
  readonly bytes = computed(() => this.files().reduce((sum, file) => sum + file.size, 0));
  /** In a folder no category claims: these move into unfiled/ as they are added. */
  readonly unclaimed = computed(() => this.files().filter((file) => file.category === null).length);
  /** Few enough to be read at once: every group opens with the dialog, the files in sight (a big list stays folded). */
  readonly unfolded = computed(() => this.total() <= 100);

  /** By category, the largest first - the unclaimed under a heading that says where they go. */
  readonly byCategory = computed(() => {
    const groups = new Map<string, UncataloguedFile[]>();
    for (const file of this.files()) {
      const heading = file.category ?? 'No category: into unfiled/';
      const list = groups.get(heading) ?? [];
      list.push(file);
      groups.set(heading, list);
    }
    return [...groups].map(([heading, files]) => ({ heading, files })).sort((a, b) => b.files.length - a.files.length);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._fileApi.getFilesUncatalogued().subscribe({
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

  /** Closes as a yes: the page runs Add strays to database and shows what it did. */
  add(): void {
    this.closeModal(true);
  }

  dismiss(): void {
    this.closeModal(false);
  }
}
