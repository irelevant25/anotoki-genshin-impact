import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { ActivityCell } from '../profile-stats';

/** A month's name, and how many of the grid's columns it covers. */
export interface ActivityMonth {
  readonly label: string;
  readonly span: number;
}

/**
 * A year as squares, one per day, shaded by how much was played.
 *
 * Presentation only: the cells arrive already worked out - which days, in what
 * order, at which shade - from activityGrid(), which is where the calendar
 * arithmetic and the reasoning behind it live. All this knows is that they come
 * seven to a column and that a `future` one is drawn faintly.
 *
 * The columns stretch to fill whatever width the page gives them rather than
 * being 13px each. At a quarter of a year and a fixed cell size this was a
 * 210px strip in the middle of a full-width page, which read as a component
 * that had failed to load rather than as a year of playing.
 */
@Component({
  selector: 'app-activity-grid',
  templateUrl: './activity-grid.component.html',
  styleUrls: ['./activity-grid.component.scss'],
  imports: [TranslatePipe],
})
export class ActivityGridComponent {
  private readonly _i18n = inject(TranslationService);

  readonly cells = input.required<ActivityCell[]>();

  /** The shades in the legend, held still rather than rebuilt per render. */
  readonly levels = [0, 1, 2, 3, 4];

  /**
   * The months along the top, each spanning the columns that start in it.
   *
   * A year of unlabelled squares says how much somebody played and nothing
   * about when. A column belongs to the month its Monday falls in, which is
   * the convention every calendar heatmap uses: a week split across two months
   * has to be counted once, and the day it began is the one to count it under.
   *
   * The names come from Intl in the language the site is being read in, rather
   * than from twelve translation keys. They are the reader's own month names
   * either way, and this way a new language brings its own.
   */
  readonly months = computed<ActivityMonth[]>(() => {
    const format = new Intl.DateTimeFormat(this._i18n.language(), { month: 'short', timeZone: 'UTC' });
    const months: ActivityMonth[] = [];

    // Seven cells to a column, so every seventh cell is a Monday.
    for (let index = 0; index < this.cells().length; index += 7) {
      const monday = new Date(this.cells()[index].day + 'T00:00:00Z');
      const label = format.format(monday);
      const previous = months[months.length - 1];

      if (previous && previous.label === label) {
        months[months.length - 1] = { label, span: previous.span + 1 };
      } else {
        months.push({ label, span: 1 });
      }
    }

    // A month whose name is wider than its columns would print over its
    // neighbour, so the narrow ones are drawn blank and their space is left to
    // the month before. Two columns is about 40px at the width this fills.
    return months.map((month) => (month.span < 3 ? { label: '', span: month.span } : month));
  });
}
