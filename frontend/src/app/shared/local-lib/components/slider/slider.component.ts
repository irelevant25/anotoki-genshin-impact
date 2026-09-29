import { Component, computed, model } from '@angular/core';

import { AbstractInputComponent } from '../../abstract-input.class';

type Type = number;

/**
 * A number chosen by dragging, for ranges small enough to see all of.
 *
 * A native range input underneath, because everything that makes a slider hard
 * - dragging, arrow keys, Home and End, touch, the screen reader announcing a
 * value - is already correct there and would have to be rebuilt badly here.
 * What is drawn on top is only the rail and the fill; the thumb is the browser's
 * own, restyled.
 *
 * `ticks` puts a word under each stop, which is what makes this usable for a
 * choice that is not really a number - three difficulties, say. Given them, the
 * slider reads as a row of named positions rather than as 0 to 2, and the one
 * the thumb is on is marked.
 */
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: SliderComponent,
    },
  ],
})
export class SliderComponent extends AbstractInputComponent<Type> {
  min = model<number>(0);
  max = model<number>(100);
  step = model<number>(1);

  /**
   * A word under each stop, in order. Its length is what says how many stops
   * there are, so it has to agree with min/max/step or the labels drift.
   */
  ticks = model<string[]>([]);

  /** How the value reads beside the label. The number itself by default. */
  valueLabel = model<string | undefined>(undefined);

  /** Off for a slider whose ticks already say where the thumb is. */
  showValue = model<boolean>(true);

  /** The value to draw at: never outside the range, whatever it was set to. */
  readonly current = computed(() => {
    const value = Number(this.value());

    return Number.isFinite(value) ? Math.min(this.max(), Math.max(this.min(), value)) : this.min();
  });

  readonly percent = computed(() => {
    const span = this.max() - this.min();

    return span > 0 ? ((this.current() - this.min()) / span) * 100 : 0;
  });

  /** Which tick the thumb is on, so that one can be marked. */
  readonly stepIndex = computed(() => Math.round((this.current() - this.min()) / (this.step() || 1)));

  readonly fill = computed(() => this.offset(this.percent()));

  onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);

    this.value.set(Math.min(this.max(), Math.max(this.min(), value)));
    this.inputChange.emit(this.value());
  }

  /** Where the nth tick sits. Evenly spaced, however the values are spaced. */
  tickOffset(index: number): string {
    const count = this.ticks().length;

    return this.offset(count > 1 ? (index / (count - 1)) * 100 : 0);
  }

  /**
   * A percentage along the track, in the same geometry the thumb uses.
   *
   * The thumb's centre does not travel the full width - it stops half a thumb
   * short at each end, or it would hang off. Fill and ticks are placed with the
   * same inset so all three line up, rather than drifting apart towards the
   * ends the way a plain percentage would.
   */
  private offset(percent: number): string {
    return `calc(var(--slider-thumb) / 2 + ${percent} * (100% - var(--slider-thumb)) / 100)`;
  }
}
