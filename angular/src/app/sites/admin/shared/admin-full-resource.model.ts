/**
 * Client side of the `/api/{entity}/full` contract.
 *
 * The whole resource travels as JSON under `data`, and every picked file as a
 * separate part whose name the server rebuilds from the same rules:
 *   file_{field}                     for the parent row
 *   file_{childKey}_{index}_{field}  for a child row
 */

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.avif', '.webp'];

export function parentFileKey(field: string): string {
  return `file_${field}`;
}

export function childFileKey(childKey: string, index: number, field: string): string {
  return `file_${childKey}_${index}_${field}`;
}

export interface UploadPart {
  key: string;
  file: File;
}

export function buildFullFormData(payload: unknown, uploads: UploadPart[]): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  for (const upload of uploads) {
    form.append(upload.key, upload.file, upload.file.name);
  }
  return form;
}

// ── Image slots ───────────────────────────────────────────────────────────────

/**
 * One image column: the path already stored on the row, plus a newly picked
 * file and its preview URL. The stored path is left alone - the API rewrites
 * it once the upload lands.
 */
export interface ImageSlot {
  file?: File;
  preview?: string;
}

/** Preview for a picked file, falling back to the path stored on the row. */
export function imageSrc(slot: ImageSlot | undefined, storedPath: string | undefined | null): string | undefined {
  return slot?.preview ?? storedPath ?? undefined;
}

/** Points a slot at a newly picked file, revoking the preview it supersedes. */
export function setImage(slot: ImageSlot, file: File | undefined): void {
  if (slot.preview) {
    URL.revokeObjectURL(slot.preview);
  }
  slot.file = file;
  slot.preview = file ? URL.createObjectURL(file) : undefined;
}

export function revokeImages(slots: (ImageSlot | undefined)[]): void {
  for (const slot of slots) {
    if (slot?.preview) {
      URL.revokeObjectURL(slot.preview);
      slot.preview = undefined;
    }
  }
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

/** PostgreSQL hands booleans back as `'t'` / `'f'`, both of which are truthy in JS. */
export function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 't' || value === 'true' || value === '1';
}

/** JSONB columns arrive as raw JSON strings from PDO. */
export function parseJsonColumn(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

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
  [...items]
    .sort((a, b) => getOrder(a) - getOrder(b))
    .forEach((item, index) => setOrder(item, index + 1));
}
