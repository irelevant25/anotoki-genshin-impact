import { effect, inject, untracked, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';

/**
 * Keeping a list page's filters in the query string.
 *
 * A filtered list is a place, not a mode. Opening one of its detail pages and
 * coming back should land on the list as it was left, and the address bar
 * should be worth sending to somebody. Both fall out of the same decision:
 * the URL holds the filters, the browser's own history restores them, and
 * there is nothing of ours to remember or to go stale between sessions.
 */

/** How one filter survives the round trip through the query string. */
export interface FilterCodec<T> {
  /** What the signal holds when the parameter is absent - the reset value. */
  readonly empty: T;
  /** Parameter text back to a value. The text itself, unless given. */
  readonly parse?: (raw: string) => T;
}

/** Free text, where absent and empty mean the same thing. */
export const asText: FilterCodec<string> = { empty: '' };

/** A dropdown. Cleared leaves `undefined`, which is what `isChosen` tests for. */
export const asOption: FilterCodec<string | undefined> = { empty: undefined };

/** A chip that toggles off to `null`. */
export const asToggle: FilterCodec<string | null> = { empty: null };

/** A chip compared as a number, so it has to come back from the URL as one. */
export const asNumber: FilterCodec<number | null> = {
  empty: null,
  // A hand-edited `?rarity=abc` should be ignored rather than filter the whole
  // list away, so anything that is not a number reads as no filter at all.
  parse: (raw) => (raw.trim() && !Number.isNaN(Number(raw)) ? Number(raw) : null),
};

/**
 * One filter: the signal holding it, and how it is written down.
 *
 * The signal is loosely typed because each page declares its own union around
 * these values - a dropdown is `string | number | boolean | null | undefined`
 * to match what the component writes back to it.
 */
export type FilterBinding = readonly [WritableSignal<any>, FilterCodec<any>];

/**
 * Binds a page's filter signals to the query string, in both directions.
 *
 * Call it from the component constructor: it needs the injection context, and
 * it seeds the signals from the current URL before it returns, so the first
 * render is already filtered.
 */
export function bindFiltersToUrl(bindings: Record<string, FilterBinding>): void {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const entries = Object.entries(bindings);

  const isBlank = (value: unknown): boolean => value === null || value === undefined || value === '';

  /** The query string these signals describe. `null` drops the parameter. */
  const fromSignals = (): Params =>
    Object.fromEntries(
      entries.map(([key, [value]]) => {
        const current = value();
        return [key, isBlank(current) ? null : String(current)];
      }),
    );

  // Read the URL as well as write it, so a pasted link wins over whatever the
  // signals happen to hold - including when the page is already open and only
  // the parameters change, which reuses this component rather than building a
  // new one.
  //
  // This fires immediately with the current parameters, and that first run is
  // what seeds the page. Our own writes come back through here too; they set
  // each signal to the value it already has, which a signal treats as no
  // change, so the effect below does not run again and the two cannot chase
  // each other.
  route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
    for (const [key, [value, codec]] of entries) {
      const raw = params.get(key);
      value.set(raw === null ? codec.empty : codec.parse ? codec.parse(raw) : raw);
    }
  });

  effect(() => {
    const params = fromSignals();

    untracked(() => {
      // The seeding run above leaves the signals already agreeing with the
      // URL, so without this every visit would open with a pointless
      // navigation to the address it is already at.
      const inUrl = route.snapshot.queryParams;
      if (entries.every(([key]) => (inUrl[key] ?? null) === params[key])) {
        return;
      }

      router.navigate([], {
        relativeTo: route,
        queryParams: params,
        // Replace rather than push: a filter is not somewhere you navigated
        // to. Pushing would put an entry in the history for every keystroke in
        // the name box, and leaving the page would mean pressing Back past all
        // of them.
        replaceUrl: true,
      });
    });
  });
}
