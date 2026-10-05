import { Injectable, signal } from '@angular/core';

/** The longest a sign-in waits for the saves still on their way before it leaves for the IAM all the same. */
export const SAVES_WAIT_MS = 30_000;

/**
 * The saves still on their way - counted from the moment a quiz hands one
 * over (QuizProgressService, which may hold it while a visitor is being made)
 * until its request has its answer, and every write the interceptor sends.
 *
 * A sign-in waits for them before the browser leaves for the IAM
 * (SecurityService.login() / register()), as any page being left would have
 * to: a visitor's first played save brings the new visitor key in its answer,
 * and a page left before that answer arrives never stores the key - what was
 * played would be out of reach, and the move after the sign-in would find
 * nothing. A save that hangs is waited for SAVES_WAIT_MS at most.
 *
 * Injects nothing, so anything may inject it without a cycle.
 */
@Injectable({ providedIn: 'root' })
export class SavesInFlight {
  private readonly _count = signal(0);
  private _waiting: (() => void)[] = [];

  /** How many are on their way now. */
  readonly count = this._count.asReadonly();

  /** One save starts; the function it answers ends it (once - later calls do nothing). */
  begin(): () => void {
    let ended = false;
    this._count.update((count) => count + 1);
    return () => {
      if (ended) {
        return;
      }
      ended = true;
      this._count.update((count) => count - 1);
      if (this._count() === 0) {
        const waiting = this._waiting;
        this._waiting = [];
        waiting.forEach((resolve) => resolve());
      }
    };
  }

  /** Resolves once no save is on its way - at once when none is, and after `maxMs` at the latest. */
  settled(maxMs = SAVES_WAIT_MS): Promise<void> {
    if (this._count() === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const pending: { timer?: ReturnType<typeof setTimeout> } = {};
      const done = (): void => {
        clearTimeout(pending.timer);
        this._waiting = this._waiting.filter((waiting) => waiting !== done);
        resolve();
      };
      pending.timer = setTimeout(done, maxMs);
      this._waiting.push(done);
    });
  }
}
