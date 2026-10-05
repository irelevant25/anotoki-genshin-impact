import { HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';

/**
 * Whom a request to a player's own data is for: a signed-in person, or this
 * browser's visitor (somebody playing without signing in, whose games the
 * server keeps under a key it made - see VisitorKey).
 *
 * Decided when the request is ISSUED, from what the page is showing - never by
 * the interceptor from whether a token happens to be there when the request
 * leaves. A person's request whose token comes back null (the refresh failed,
 * a sign-out in another tab) is not sent at all: sent bare it would be
 * nobody's, and nobody's first save makes a visitor - one holding the person's
 * game. The interceptor fails it here instead (a 401 `sign_in_required` that
 * never left the browser).
 */
export type Caller = 'person' | 'visitor';

export const ISSUED_AS = new HttpContextToken<Caller | null>(() => null);

/**
 * The visitor key the move at sign-in hands over beside the person's token -
 * the one request that carries both. Nothing else ever sets it.
 */
export const CARRIES_VISITOR_KEY = new HttpContextToken<string | null>(() => null);

/** The header the key travels in, both ways: the answer that made a visitor brings it, a visitor's request sends it. */
export const VISITOR_KEY_HEADER = 'X-Visitor-Key';

/** A request issued for `caller` - the context the generated owner methods take. */
export function issuedAs(caller: Caller): HttpContext {
  return new HttpContext().set(ISSUED_AS, caller);
}

/**
 * The API's routes for a player's own data (api/routes/genshin_impact/endpoints/quiz_progress.php,
 * `requireOwner()`), by prefix: /api/quiz/progress (and its /carry and /{quiz}),
 * /api/quiz/result and /results, /api/quiz/stats (and /difficulty), /api/quiz/activity.
 */
const OWNER_PATHS = ['/api/quiz/progress', '/api/quiz/result', '/api/quiz/results', '/api/quiz/stats', '/api/quiz/activity'];

/** Whether a URL of this site's API is one of a player's own routes - the only ones a visitor is ever sent to. */
export function isOwnerUrl(url: string): boolean {
  let path: string;
  try {
    path = new URL(url, location.href).pathname;
  } catch {
    return false;
  }
  return OWNER_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** The family's refusal code in an API error's body (`{error, code}`), or null. */
export function apiErrorCode(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const code = (error.error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : null;
}

/** What a person's request with no token to send answers, without being sent: what the API would say. */
export function notSignedIn(url: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 401,
    statusText: 'Unauthorized',
    url,
    error: { error: 'Sign in to continue', code: 'sign_in_required', local: true },
  });
}

/** Whether an error is the one `notSignedIn()` makes: refused in this browser, never sent. */
export function failedLocally(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.error as { local?: unknown } | null)?.local === true;
}
