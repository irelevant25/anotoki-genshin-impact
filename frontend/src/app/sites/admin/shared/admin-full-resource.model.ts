/**
 * Client side of the `/api/{entity}/full` contract: the whole resource travels
 * as JSON under `data`.
 *
 * Images do not ride along here. They are picked into the form, uploaded on
 * save through `/api/uploads/{entity}/{field}`, and the paths they land on go
 * into the payload - see `AdminFormComponent`.
 */

import { parseJsonColumn } from '../../../api';
import type { PickedImage } from './image-upload/image-upload.component';

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.avif', '.webp'];
export const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.opus'];

/**
 * The largest file an upload may be: the server's limit (backend api/upload_guard.php's UPLOAD_MAX_BYTES), said
 * in the browser by the kit's file picker before anything is sent - a convenience; the server decides.
 */
export const UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export function buildFullFormData(payload: unknown): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  return form;
}

// ── Picked images ─────────────────────────────────────────────────────────────

/**
 * Releases a pick's object URL; call before replacing or discarding it.
 *
 * Only an uploaded file's preview is an object URL worth revoking — an existing
 * pick's preview is an ordinary asset URL, so it is left alone.
 */
export function revokePicked(picked: PickedImage | undefined): void {
  if (picked?.preview && picked.preview.startsWith('blob:')) {
    URL.revokeObjectURL(picked.preview);
  }
}

/** Releases several at once, e.g. when a form reloads. */
export function revokeAllPicked(picked: (PickedImage | undefined)[]): void {
  picked.forEach(revokePicked);
}

// ── Value coercion ────────────────────────────────────────────────────────────

/**
 * Inputs hand back strings (and `NaN` when cleared), while the API is strict
 * about numeric columns - normalise before anything leaves the form.
 */
export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * An optional number as the API takes it: a number, or null once the field is
 * emptied - never '' or NaN. `undefined` would leave the key out of the body,
 * and an update that leaves it out keeps the old value; '' is no number to an
 * INTEGER column (a create would not even get past the model). For `game_id`.
 */
export function toNullableNumber(value: unknown): number | null {
  return toOptionalNumber(value) ?? null;
}

/** PostgreSQL hands booleans back as `'t'` / `'f'`, both of which are truthy in JS. */
export function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 't' || value === 'true' || value === '1';
}

/** Re-exported so the forms keep importing it from here. */
export { parseJsonColumn };

// ── List columns ──────────────────────────────────────────────────────────────

/** A list column as a form holds it: what the column held (listFromColumn()), or an edit's lines (toLines()). */
export type ListColumn = string[] | string | null;

/**
 * A list column - JSONB, an array of strings - as a form holds it. The API sends its raw JSON text
 * (`parseJsonColumn()`): this decodes it, once, and the form keeps what came until the field is edited - so a list
 * nobody touched goes back exactly as it was stored (NULL as null, and an old import's lone string or object as it
 * is), never wrapped in another layer of JSON. An edit makes it a plain array of strings, `toLines()`.
 *
 * Every admin form loads its lists through this one function. The character form had a helper of its own that took
 * the raw text for the list's one item, so each save sent an untouched list back wrapped once more
 * (`affiliations: ["[\"Wangsheng Funeral Parlor\"]"]`) - from 2026-09-01, when the generated client stopped decoding
 * the columns, to 2026-10-25; genshin_impact/032 unwrapped what those saves had stored.
 */
export function listFromColumn(value: unknown): ListColumn | undefined {
  return parseJsonColumn(value) as ListColumn | undefined;
}

/**
 * A list's text for its textarea, an item a line: an array's items, a lone string, an object's values (an old
 * import's shape); nothing for none. Never decoded again: what the form holds is decoded already, and an item that
 * reads like JSON is the text it is.
 */
export function listText(list: unknown): string {
  const items = Array.isArray(list) ? list : list === null || list === undefined ? [] : typeof list === 'object' ? Object.values(list) : [list];
  return items.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
}

/** A list as a save sends it: as the form holds it, untouched or edited - [] for one a new row has not got. */
export function listToSend(list: ListColumn | undefined): ListColumn {
  return list === undefined ? [] : list;
}

/** A textarea's lines as a list: each trimmed, the empty ones dropped - a plain array of strings. */
export function toLines(value: string | number | undefined | null): string[] {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// ── Ordering ──────────────────────────────────────────────────────────────────

let nextUid = 0;

/** Stable identity for `@for` tracking. */
export function createUid(): number {
  return ++nextUid;
}

/** Renumbers items to a gap-free 1..n sequence, keeping their relative order. */
export function resequence<T>(items: T[], getOrder: (item: T) => number, setOrder: (item: T, order: number) => void): void {
  [...items].sort((a, b) => getOrder(a) - getOrder(b)).forEach((item, index) => setOrder(item, index + 1));
}
