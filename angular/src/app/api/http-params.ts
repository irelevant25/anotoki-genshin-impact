import { HttpParams } from '@angular/common/http';

/**
 * A query object as HttpParams, with the empty entries left out.
 *
 * Every listing endpoint here treats a missing parameter and an empty one the
 * same way - `search=` filters on nothing - so sending the empty ones only
 * makes the URL longer and the cache key less useful. Callers were each
 * stripping them by hand before the request; this is that, once.
 *
 * `false` and `0` are kept: they are answers, not absences.
 */
export function toHttpParams(query: object | undefined): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }

  return params;
}
