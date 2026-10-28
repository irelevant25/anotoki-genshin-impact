import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AlertComponent } from '@anotoki/lib/ui/alert';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { AccordionComponent, DisclosureComponent } from '@anotoki/lib/ui/disclosure';
import { FileSizePipe } from '@anotoki/lib/ui/file-size';
import { AssetReconcileFile, AssetReconcileResult } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';

/** What became of a file (AssetReconcileFile's `outcome`), in the order the dialog lists them. */
const OUTCOMES: Record<string, string> = {
  added: 'Added to the database',
  unfiled: 'Moved into unfiled/ and added',
  not_moved: 'Could not be moved: still not in the database',
  known: 'In the database already under that name',
  resized: 'Size brought up to date',
};

function groupByOutcome(files: AssetReconcileFile[]): { outcome: string; heading: string; files: AssetReconcileFile[] }[] {
  const order = Object.keys(OUTCOMES);
  const rank = (outcome: string): number => (order.includes(outcome) ? order.indexOf(outcome) : order.length);
  const groups = new Map<string, AssetReconcileFile[]>();
  for (const file of files) {
    const list = groups.get(file.outcome) ?? [];
    list.push(file);
    groups.set(file.outcome, list);
  }

  return [...groups].map(([outcome, list]) => ({ outcome, heading: OUTCOMES[outcome] ?? outcome, files: list })).sort((a, b) => rank(a.outcome) - rank(b.outcome));
}

/**
 * What Add strays to database did, file by file - it was a toast of two
 * numbers. The files grouped by what became of each, the rows it gave their
 * picture to by table and column, and - when the sweep touched more than the
 * server lists (a thousand) - how many there were.
 */
@Component({
  selector: 'app-reconcile-modal',
  templateUrl: './reconcile-modal.component.html',
  styleUrls: ['./reconcile-modal.component.scss'],
  imports: [AlertComponent, DialogFooterDirective, ButtonComponent, AccordionComponent, DisclosureComponent, DecimalPipe, FileSizePipe],
})
export class ReconcileModalComponent extends AbstractModalComponent {
  readonly result = inject<AssetReconcileResult>(ANOTOKI_DIALOG_DATA);

  /** No file touched, and no row given its picture. */
  readonly nothing = this.result.files_total === 0 && this.result.relinked === 0;
  /** Past the server's cut: counted, never listed. */
  readonly unlisted = this.result.files_total - this.result.files.length;
  /** Few enough to be read at once: every group opens with the dialog, each file in sight (a first sweep's stay folded). */
  readonly unfolded = this.result.files.length <= 100;

  /** The counts in one sentence, only the ones that are not nought beside what was added. */
  readonly summary = [
    `${this.result.adopted.toLocaleString('en')} added to the database`,
    this.result.moved_to_unfiled ? `${this.result.moved_to_unfiled.toLocaleString('en')} of them moved into unfiled/ first` : '',
    this.result.resized ? `${this.result.resized.toLocaleString('en')} ${this.result.resized === 1 ? 'size' : 'sizes'} brought up to date` : '',
    this.result.relinked ? `${this.result.relinked.toLocaleString('en')} ${this.result.relinked === 1 ? 'row' : 'rows'} given ${this.result.relinked === 1 ? 'its' : 'their'} picture` : '',
  ]
    .filter((part) => part !== '')
    .join(', ');

  /** By outcome in OUTCOMES' order; one the dialog has no words for comes last, under its own name. */
  readonly groups = groupByOutcome(this.result.files);
}
