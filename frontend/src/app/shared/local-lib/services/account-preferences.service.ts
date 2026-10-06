import { Injectable, computed, inject } from '@angular/core';
import { SecurityService } from './security.service';
import type { AnotokiPreferenceChanges } from '../iam/anotoki-auth';

/** A preference the anotoki account keeps for every anotoki site. */
export type AccountPreference = keyof AnotokiPreferenceChanges;

/**
 * What became of one choice sent to the account.
 *
 * - `saved`: the account has it, and every anotoki site follows it now.
 * - `refused`: the IAM said no, or could not be reached; `code` says which -
 *   'invalid_request' for a language the IAM does not offer, 'network', ...
 * - `superseded`: a later choice of the same preference took its place. That
 *   one's fate is the news; this one's is not.
 * - `device`: there is no account to keep it - nobody is signed in, or the
 *   IAM keeps no preferences - so it stays the site's own choice.
 */
export interface PreferenceSave {
  readonly outcome: 'saved' | 'refused' | 'superseded' | 'device';
  readonly code?: string;
}

interface Waiting {
  readonly name: AccountPreference;
  readonly value: AnotokiPreferenceChanges[AccountPreference];
  readonly settle: (result: PreferenceSave) => void;
}

/** The IAM's error code on a refusal (the SDK puts it on `code`), or 'unknown'. */
function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'unknown';
}

/**
 * The anotoki account's theme, date order, clock and language - what they are,
 * and saving the reader's choices to them.
 *
 * They are the account's, not this site's (the IAM's migration 015, the
 * owner's decision of 2026-10-06): one choice every anotoki site follows,
 * every area of it, the admin panel included. The IAM's tokens carry them
 * (`SecurityService.claims`), and a choice made here is saved through the
 * SDK, which puts the answer into the claims at once, in every tab.
 *
 * They apply only while somebody is signed in here and the IAM keeps them -
 * `preferences` is null from an IAM before its migration 015, and for a
 * visitor. Then every one of them is the site's own, as for a visitor: the
 * theme and the language this device's, the dates the device's way. The
 * account's language waits for the same thing, although the IAM has always
 * kept it: following it while a choice made here could not be saved back
 * would undo that choice at the next page load.
 *
 * One save at a time, the latest choice of each preference last, one
 * preference a request. Two saves on their way together could be answered in
 * either order, and the later answer - which still says what the account held
 * before the other was saved - would put the page back on a choice the person
 * had already left. One preference a request, so a language the IAM refuses
 * never takes a theme chosen in the same moment down with it.
 */
@Injectable({ providedIn: 'root' })
export class AccountPreferences {
  private readonly _security = inject(SecurityService);

  /** The account's theme, date order and clock - null for a visitor, or an IAM that keeps none. */
  readonly preferences = computed(() => this._security.claims()?.preferences ?? null);

  /** Whether the account's choices are the page's, and a choice made here is saved to it. */
  readonly kept = computed(() => this.preferences() !== null);

  readonly theme = computed(() => this.preferences()?.theme ?? null);
  /** Null when the account leaves it to the page's own way - and when there is no account to ask. */
  readonly dateFormat = computed(() => this.preferences()?.date_format ?? null);
  readonly timeFormat = computed(() => this.preferences()?.time_format ?? null);
  /** The account's language code, when the account's choices apply (see above). Not a promise this site has it. */
  readonly language = computed(() => (this.kept() ? (this._security.claims()?.locale ?? null) : null));

  /** The save on its way. */
  private _sending: Waiting | null = null;
  /** The latest choice of each preference, waiting for it. */
  private readonly _waiting = new Map<AccountPreference, Waiting>();

  /**
   * Saves one choice to the account - the caller has already shown it. Never
   * rejects: what became of it is the answer, and the caller says it in its
   * own words (a toast) or not at all.
   */
  save<K extends AccountPreference>(name: K, value: AnotokiPreferenceChanges[K]): Promise<PreferenceSave> {
    if (!this.kept()) {
      return Promise.resolve({ outcome: 'device' });
    }
    return new Promise((settle) => {
      this._waiting.get(name)?.settle({ outcome: 'superseded' });
      this._waiting.set(name, { name, value, settle });
      if (!this._sending) {
        this._send();
      }
    });
  }

  /**
   * Whether a choice of this preference is on its way or waiting to go.
   *
   * What follows the account asks this before taking the account's value: an
   * answer to an earlier save, or a token refreshed meanwhile, still says what
   * the account held before the latest choice, and taking it would flick the
   * page back. Not a signal on purpose - the save's own answer changes the
   * account's value, and that is what brings the follower back.
   */
  saving(name: AccountPreference): boolean {
    return this._sending?.name === name || this._waiting.has(name);
  }

  private _send(): void {
    for (const waiting of this._waiting.values()) {
      this._waiting.delete(waiting.name);

      if (!this.kept()) {
        // Signed out while it waited: there is no account any more.
        waiting.settle({ outcome: 'device' });
        continue;
      }
      if (this._has(waiting.name, waiting.value)) {
        // Chosen back to what the account already holds before it went.
        waiting.settle({ outcome: 'saved' });
        continue;
      }

      this._sending = waiting;
      this._security.savePreferences({ [waiting.name]: waiting.value } as AnotokiPreferenceChanges).then(
        () => this._sent(waiting, { outcome: 'saved' }),
        (error: unknown) => this._sent(waiting, { outcome: 'refused', code: errorCode(error) }),
      );
      return;
    }
  }

  private _sent(waiting: Waiting, result: PreferenceSave): void {
    this._sending = null;
    waiting.settle(this._waiting.has(waiting.name) ? { outcome: 'superseded' } : result);
    this._send();
  }

  private _has(name: AccountPreference, value: unknown): boolean {
    if (name === 'language') {
      return this.language() === value;
    }
    const preferences = this.preferences();
    return preferences !== null && preferences[name] === value;
  }
}
