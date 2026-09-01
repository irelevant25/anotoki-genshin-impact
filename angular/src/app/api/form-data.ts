/**
 * Building a multipart body.
 *
 * The upload endpoints and the `/full` writes take multipart/form-data rather
 * than JSON, because they carry files alongside their fields. The generated
 * services type those bodies as `FormData` - what goes in each part is the
 * endpoint's business, not something a schema can say - so this is where a
 * caller turns an object into one.
 */

/** A value a multipart part can hold. */
export type FormPart = string | number | boolean | Blob | File | null | undefined;

/**
 * A multipart body from a plain object.
 *
 * `undefined` and `null` parts are left out rather than sent as the strings
 * "undefined" and "null", which is what `FormData.append` would otherwise
 * make of them. A `File` keeps its own name.
 */
export function toFormData(parts: Record<string, FormPart>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(parts)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (value instanceof File) {
      form.append(key, value, value.name);
    } else if (value instanceof Blob) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  }

  return form;
}

/**
 * The body a `/full` write takes: the whole resource as JSON under `data`.
 *
 * Images do not ride along here - they are uploaded separately and the paths
 * they land on go into the payload.
 */
export function toFullFormData(payload: unknown): FormData {
  return toFormData({ data: JSON.stringify(payload) });
}
