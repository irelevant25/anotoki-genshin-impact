import { Component, computed, effect, inject, Injector, model, Signal, signal, untracked } from '@angular/core';

export class Loading {
  private _loadingStartTime = 0;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Raised when the source starts loading and lowered when the minimum has run
   * out - the only thing the timer below decides.
   */
  private _holding = signal(false);

  /**
   * Up while the source is loading, and for as long afterwards as the minimum
   * still has to run.
   *
   * The source is read here rather than mirrored into a signal of its own: a
   * copy is only written once the effect below has run, and the template asking
   * this question is checked before that happens. That gap showed as a frame of
   * content appearing just before the loader did.
   */
  readonly loading: Signal<boolean> = computed(() => this._source() || this._holding());

  constructor(
    private _source: Signal<boolean>,
    private _minDuration: Signal<number>,
    injector: Injector,
  ) {
    effect(
      () => {
        const isLoading = this._source();

        if (isLoading) {
          if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
          }
          this._loadingStartTime = Date.now();
          this._holding.set(true);
          return;
        }

        // Time already spent counts towards the minimum - it is a floor on how
        // briefly the loader can flash, not a delay added to every request. Read
        // untracked so that retuning the duration does not itself count as the
        // source changing.
        const elapsed = Date.now() - this._loadingStartTime;
        const remaining = untracked(this._minDuration) - elapsed;

        if (remaining <= 0) {
          this._holding.set(false);
        } else {
          this._timeoutId = setTimeout(() => {
            this._holding.set(false);
            this._timeoutId = null;
          }, remaining);
        }
      },
      { injector },
    );
  }

  destroy(): void {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }
}

/**
 * Which loader is drawn.
 *
 * `waypoint` is the teleport waypoint from the old site - a turning rune ring
 * with the seven elements pulsing around it. `plain` is the small spinner in a
 * card, which is what every caller used to get and what still suits a dense
 * admin table.
 */
export type LoaderVariant = 'waypoint' | 'plain';

/** One drifting mote, placed once and then left to the animation. */
export interface LoaderParticle {
  /** Percentages, not pixels, so a mote keeps its place as the loader scales. */
  readonly left: number;
  readonly top: number;
  readonly delay: number;
  /** Sideways drift as a fraction of the loader's size, so that scales too. */
  readonly drift: number;
}

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent {
  private _injector = inject(Injector);

  text = model<string>('Načítavam...');
  loading = model<boolean>(false);

  /**
   * Shortest time the loader stays up once it has appeared. A request that
   * comes back in 80ms would otherwise show as a flicker, which reads as a
   * fault rather than as a page that loaded.
   */
  minDuration = model<number>(1250);

  loadingCtrl = new Loading(this.loading, this.minDuration, this._injector);
  spinner = model<boolean>(true);
  variant = model<LoaderVariant>('waypoint');

  /**
   * Scattered once, at construction, rather than in a computed: they are meant
   * to be arbitrary, and re-rolling them on a change detection pass would make
   * the motes jump.
   */
  readonly particles: readonly LoaderParticle[] = Array.from({ length: 20 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
    // The old site drifted each mote up to 50px either way over a 300px
    // square; the same spread, written as a fraction of whatever size the
    // loader ends up being.
    drift: (Math.random() - 0.5) * (100 / 300),
  }));
}
