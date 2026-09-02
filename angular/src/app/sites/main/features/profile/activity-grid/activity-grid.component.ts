import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { ActivityCell } from '../profile-stats';

/**
 * A quarter of a year as squares, one per day, shaded by how much was played.
 *
 * Presentation only: the cells arrive already worked out - which days, in what
 * order, at which shade - from activityGrid(), which is where the calendar
 * arithmetic and the reasoning behind it live. All this knows is that they come
 * seven to a column and that a `future` one is drawn faintly.
 */
@Component({
  selector: 'app-activity-grid',
  templateUrl: './activity-grid.component.html',
  styleUrls: ['./activity-grid.component.scss'],
  imports: [TranslatePipe],
})
export class ActivityGridComponent {
  readonly cells = input.required<ActivityCell[]>();

  /** The shades in the legend, held still rather than rebuilt per render. */
  readonly levels = [0, 1, 2, 3, 4];
}
