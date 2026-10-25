import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnotokiAuth, issuedAs, type VisitorKeyStore } from '@anotoki/lib/auth';
import { VisitorApiService, VisitorMoveResult } from '../../../api';
import { signedInSilently } from '../../silent-sign-in';
import { VISITOR_KEY_CARRIED } from './http.interceptor';
import { SecurityService } from './security.service';
import { PublicSettingsService } from './public-settings.service';

/** Where this browser keeps its visitor key (localStorage: every tab of the site shares it). */
export const VISITOR_STORAGE_KEY = 'genshin-visitor';

/** A key as the server makes them: 32 random bytes, base64url without padding. Anything else is no key. */
const KEY_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/**
 * How long to wait before asking for the move again in this page load, after a network error or a 5xx that
 * says nothing of its own (a 503's Retry-After wins, up to a minute). After the last one this page load
 * gives up, and the next one asks again.
 */
export const MOVE_RETRY_MS: readonly number[] = [2_000, 10_000, 30_000];

/**
 * The visitor key: what lets somebody playing without signing in keep their
 * games and statistics on the server. The server makes it on the first save
 * with a play from somebody with neither a token nor a key (api/visitors.php),
 * sends it once in the `X-Visitor-Key` header of that answer and keeps only its
 * hash. This browser keeps it in localStorage; the library's interceptor
 * (@anotoki/lib/auth, shared/site-auth.ts) sends it on the requests issued as
 * a visitor's to a player's own routes, and keeps the key an answer brings -
 * this is its VisitorKeyStore.
 *
 * - **Read at send time.** `current()` reads storage on every request, and a
 *   `storage` event keeps the `key` signal in step, so every tab sends the key
 *   the browser holds now.
 * - **The first key stays.** Two tabs that each make a visitor both get a key;
 *   the second never overwrites the stored one (`remember()`) - its tab then
 *   carries its games into the first (QuizProgressService), and the second
 *   visitor is left for the sweep.
 * - **Kept, not sent, while the site requires a sign-in** (the IAM's switch,
 *   `PublicSettingsService.loginRequired`): a 401 `sign_in_required` never
 *   forgets it, so the next sign-in still moves what it holds, and switching
 *   the requirement off again within the days a visitor is kept brings it back.
 * - **Forgotten** when the server no longer knows it (401 `visitor_unknown`:
 *   moved by another tab, or swept) - `lost` says so, for the page to word
 *   once - and after the move. Compare-and-delete: only while the stored key is
 *   still the one that was sent.
 * - **The move, after every sign-in** while a key is held (whether or not the
 *   site requires one): `POST /api/visitor/move` with the token and the key,
 *   one at a time, saying whether the session was made by a silent sign-in -
 *   the IAM's sign-in hint, no click (shared/silent-sign-in.ts). A 200 (found
 *   or not) forgets the key and counts `moves` up (what lists a player's games
 *   and statistics loads them again); `moved` holds what it did, for the
 *   shell's toast. A 200 that says `stayed` - a silent sign-in into an account
 *   that already has its own here takes nothing in (the owner's decision of
 *   2026-10-11) - keeps the key: the visitor stays this browser's until a
 *   sign-in the person makes, and this page load asks no more (the next one
 *   asks again: the session is still a silent one). A 422 (not a key the
 *   server could ever know) forgets it. A network error or a 5xx keeps it and
 *   asks again (MOVE_RETRY_MS, or the answer's Retry-After); a 401 keeps it
 *   for the next sign-in.
 * - **`settledMove()`** is what a person's first load of their games waits
 *   for: pending whenever somebody is signed in and a key is held - from the
 *   moment both are true, not from when the move's request happens to start -
 *   and resolved only by an answer that ends the key (200, 422), a `stayed`,
 *   or by giving up for this page load. Otherwise a quiz page opened right after the
 *   sign-in would draw a fresh question and save it as the person's before the
 *   move ran, and the move would then keep that over the visitor's game.
 *
 * A private window that refuses storage: the key lives in memory for the tab.
 *
 * This service reads SecurityService and PublicSettingsService, never the other
 * way round: the move is started here, by an effect. The library's sign-in
 * reads it only as a request leaves.
 */
@Injectable({ providedIn: 'root' })
export class VisitorKey implements VisitorKeyStore {
  private readonly _security = inject(SecurityService);
  private readonly _settings = inject(PublicSettingsService);
  private readonly _api = inject(VisitorApiService);
  private readonly _auth = inject(AnotokiAuth);

  /** The key, when storage cannot keep it (or refused to). */
  private _memory: string | null = null;
  private _inMemory = false;
  private readonly _key = signal<string | null>(null);

  /** The key this browser holds, or null. */
  readonly key = this._key.asReadonly();

  /**
   * Whether this reader plays as a visitor: nobody is signed in, the site does
   * not require a sign-in, and the server keeps visitors. Holding a key or not.
   */
  readonly visiting = computed(() => !this._security.isLoggedIn() && !this._settings.loginRequired() && this._settings.visitorsAvailable());

  /** A visitor with a key: the server, not this browser, holds their games. */
  readonly active = computed(() => this.visiting() && this._key() !== null);

  /** The key was forgotten because the server no longer knew it: said once, where it is worded. */
  readonly lost = signal(false);

  /** The last move that moved or kept anything - for the shell's toast. */
  readonly moved = signal<VisitorMoveResult | null>(null);

  /** Counts the moves that finished: what lists a player's games and statistics loads them again when it changes. */
  readonly moves = signal(0);

  /**
   * The last key the server made in this tab (an answer's `X-Visitor-Key`),
   * kept or not - QuizProgressService compares it with the key held to tell
   * its own visitor from another tab's.
   */
  lastMade: string | null = null;

  /**
   * The key this page load moves no more: a 401, no answer after the retries,
   * or a `stayed` (the account keeps apart from it).
   */
  private readonly _gaveUpFor = signal<string | null>(null);

  private _moving = false;
  private _retries = 0;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _waiting: (() => void)[] = [];

  /**
   * Whether nothing is waiting to be moved: nobody signed in, no key, the
   * server keeps no visitors (nothing to move into an account then - the key
   * waits), or this page load moves this key no more.
   */
  readonly moveSettled = computed(() => !this._security.isLoggedIn() || this._key() === null || !this._settings.visitorsAvailable() || this._gaveUpFor() === this._key());

  constructor() {
    this._key.set(this._read());

    // Another tab stored or forgot the key.
    const onStorage = (event: StorageEvent): void => {
      if (event.key === VISITOR_STORAGE_KEY || event.key === null) {
        this._key.set(this._read());
      }
    };
    globalThis.addEventListener?.('storage', onStorage);
    inject(DestroyRef).onDestroy(() => {
      globalThis.removeEventListener?.('storage', onStorage);
      if (this._retryTimer !== null) {
        clearTimeout(this._retryTimer);
      }
    });

    // Signed in, with a key held: what the visitor played becomes the person's.
    effect(() => {
      if (!this.moveSettled()) {
        untracked(() => void this.moveIntoAccount());
      }
    });

    // Signed out: a key given up on is asked about again at the next sign-in.
    effect(() => {
      if (!this._security.isLoggedIn()) {
        untracked(() => this._gaveUpFor.set(null));
      }
    });

    // Whatever waits for the move goes on once nothing is left to move.
    effect(() => {
      if (this.moveSettled()) {
        untracked(() => {
          const waiting = this._waiting;
          this._waiting = [];
          waiting.forEach((resolve) => resolve());
        });
      }
    });
  }

  /** The key held now, read from storage - what a request sends. */
  current(): string | null {
    const key = this._read();
    if (key !== untracked(this._key)) {
      this._key.set(key);
    }
    return key;
  }

  /**
   * A key the server just made. Kept only when this browser holds none: a key
   * already stored (another tab's, made a moment earlier) stays, and this one
   * is dropped.
   */
  remember(key: string): void {
    if (!KEY_SHAPE.test(key)) {
      return;
    }
    this.lastMade = key;
    if (this._read() === null) {
      this._write(key);
      this.lost.set(false);
    }
    this._key.set(this._read());
  }

  /**
   * Forgets `key` - when it is still the one held (another tab may have
   * replaced a forgotten key with a new one meanwhile). `lost`: because the
   * server no longer knew it.
   */
  forget(key: string, lost = false): void {
    if (this._read() === key) {
      this._write(null);
      if (lost) {
        this.lost.set(true);
      }
    }
    this._key.set(this._read());
  }

  /**
   * Resolves once nothing is waiting to be moved into the account
   * (`moveSettled`) - at once when nothing is.
   */
  settledMove(): Promise<void> {
    this.current();
    if (untracked(this.moveSettled)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this._waiting.push(resolve));
  }

  /** The move after a sign-in (see the class). Safe to call at any time: it does nothing without a person and a key. */
  async moveIntoAccount(): Promise<void> {
    const key = this._read();
    if (this._moving || key === null || untracked(this.moveSettled)) {
      return;
    }
    this._moving = true;
    if (this._retryTimer !== null) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }
    try {
      const silent = signedInSilently(untracked(this._auth.sub));
      const result = await firstValueFrom(this._api.moveVisitor({ silent }, issuedAs('person', new HttpContext().set(VISITOR_KEY_CARRIED, key))));
      this._retries = 0;
      if (result.stayed) {
        // A silent sign-in, into an account with its own here: nothing moved,
        // and the visitor stays this browser's under its key (see the class).
        this._gaveUpFor.set(key);
        return;
      }
      this.forget(key);
      this.moves.update((count) => count + 1);
      if (result.games.moved + result.games.kept > 0 || result.results > 0) {
        this.moved.set(result);
      }
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)) {
        this._askAgainLater(error, key);
      } else if (error instanceof HttpErrorResponse && error.status === 422) {
        // Not a key the server could ever know: nothing to move, now or later.
        this.forget(key);
      } else {
        // A 401: the sign-in ended meanwhile (or its token was never sent).
        // The key stays; the next sign-in asks again.
        this._gaveUpFor.set(key);
      }
    } finally {
      this._moving = false;
    }
  }

  private _askAgainLater(error: HttpErrorResponse, key: string): void {
    if (this._retries >= MOVE_RETRY_MS.length) {
      this._retries = 0;
      this._gaveUpFor.set(key);
      return;
    }
    const seconds = Number(error.headers?.get('Retry-After'));
    const delay = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 60) * 1000 : MOVE_RETRY_MS[this._retries];
    this._retries++;
    this._retryTimer = setTimeout(() => {
      this._retryTimer = null;
      void this.moveIntoAccount();
    }, delay);
  }

  private _read(): string | null {
    let value = this._memory;
    if (!this._inMemory) {
      try {
        value = localStorage.getItem(VISITOR_STORAGE_KEY);
      } catch {
        value = this._memory;
      }
    }
    return value !== null && KEY_SHAPE.test(value) ? value : null;
  }

  private _write(value: string | null): void {
    this._memory = value;
    if (this._inMemory) {
      return;
    }
    try {
      if (value === null) {
        localStorage.removeItem(VISITOR_STORAGE_KEY);
      } else {
        localStorage.setItem(VISITOR_STORAGE_KEY, value);
      }
      if (localStorage.getItem(VISITOR_STORAGE_KEY) !== value) {
        this._inMemory = true;
      }
    } catch {
      // Storage refused (a private window, a full quota): from now on the key
      // lives in memory for this tab.
      this._inMemory = true;
    }
  }
}
