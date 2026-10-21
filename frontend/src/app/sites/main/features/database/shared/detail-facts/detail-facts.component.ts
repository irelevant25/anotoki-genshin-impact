import { Component, computed, inject, input } from '@angular/core';
import { TranslationService } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { AppDatePipe } from '../../../../../../shared/local-lib/pipes/date.pipe';
import { rarityStars } from '../database-helpers';

/**
 * One fact of a detail page: a label (a translation key) and what it says -
 * words, a date written the reader's way, a list as chips, a picture, stars -
 * with a quieter word after it ("· 4.2"). A row that says nothing is not drawn.
 */
export interface FactRow {
  /** The label as a translation key - or, `labelText`, a word shown as it is (a language's name). */
  label?: string;
  labelText?: string;
  value?: string | number | null;
  date?: string | null;
  hint?: string | null;
  chips?: readonly string[] | null;
  icon?: { name: string; folder?: string } | null;
  stars?: number | null;
}

/**
 * The facts of a detail page as a list: the label small and quiet, the value
 * beside it, a hairline between rows - so each reads as its own line, where
 * the old grid let the values run into one another. Empty rows are left out
 * rather than saying "N/A".
 */
@Component({
  selector: 'app-detail-facts',
  templateUrl: './detail-facts.component.html',
  styleUrls: ['./detail-facts.component.scss'],
  imports: [AppDatePipe, MaterialIconDirective],
})
export class DetailFactsComponent {
  private readonly _i18n = inject(TranslationService);

  rows = input<FactRow[]>([]);

  /** The rows that say something, each with its label in the reader's language. */
  shown = computed(() =>
    this.rows()
      .filter((row) => this._says(row))
      .map((row) => ({ ...row, text: row.labelText ?? (row.label ? this._i18n.t(row.label) : '') })),
  );

  starsOf(count: number | null | undefined): string {
    return rarityStars(count);
  }

  private _says(row: FactRow): boolean {
    const value = row.value;
    return !!(row.chips?.length || row.date || row.stars || (value !== null && value !== undefined && value !== ''));
  }
}
