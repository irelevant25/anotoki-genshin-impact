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

export function toStringArray(value: unknown): string[] {
  const parsed = parseJsonColumn(value);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item)).filter((item) => item.trim().length > 0);
  }
  if (typeof parsed === 'string' && parsed.trim().length > 0) {
    return [parsed];
  }
  return [];
}

/** Splits a textarea into the trimmed, non-empty lines a JSONB string array holds. */
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
