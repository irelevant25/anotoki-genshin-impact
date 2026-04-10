import { Component, effect, inject, Injector, model, Signal, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export class Loading {
  private _loadingStartTime = 0;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _delayedLoading = signal(false);

  readonly loading: Signal<boolean> = this._delayedLoading.asReadonly();
  readonly loading$ = toObservable(this.loading);

  constructor(
    private _source: Signal<boolean>,
    private _minDuration: number = 500,
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
          this._delayedLoading.set(true);
        } else {
          const elapsed = Date.now() - this._loadingStartTime;
          const remaining = Math.max(0, this._minDuration - elapsed);

          if (remaining === 0) {
            this._delayedLoading.set(false);
          } else {
            this._timeoutId = setTimeout(() => {
              this._delayedLoading.set(false);
              this._timeoutId = null;
            }, remaining);
          }
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
  loadingCtrl = new Loading(this.loading, 500, this._injector);
  spinner = model<boolean>(true);
}
