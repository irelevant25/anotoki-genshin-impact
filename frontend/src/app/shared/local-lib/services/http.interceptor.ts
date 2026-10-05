import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, defer, finalize, from, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { SecurityService } from './security.service';
import { ConfigService } from './config.service';
import { SiteSettingsService } from './site-settings.service';
import { SavesInFlight } from './saves-in-flight.service';
import { VisitorKey } from './visitor-key.service';
import { apiErrorCode, Caller, CARRIES_VISITOR_KEY, failedLocally, isOwnerUrl, ISSUED_AS, notSignedIn, VISITOR_KEY_HEADER } from './issued-as';

interface CacheableRequest {
  observable: Observable<any>;
  // timestampInMs: number;
  // timeToLiveInMs?: number;
}

const cache = new Map<string, CacheableRequest>();

function withBearer(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/**
 * The API answered 401 `sign_in_required` to a request sent without a token:
 * the IAM's switch went on since the settings were read. They are read again
 * (the shell then draws the sign-in card). A request that failed here, never
 * sent, is not news about the switch.
 */
function noted(error: unknown, settings: SiteSettingsService): Observable<never> {
  if (error instanceof HttpErrorResponse && error.status === 401 && !failedLocally(error) && apiErrorCode(error) === 'sign_in_required') {
    settings.noteSignInRequired();
  }
  return throwError(() => error);
}

/**
 * Sends a request with a token. The API refused a token the SDK thought was
 * good: expired on the way, or the session behind it ended at the IAM. One
 * fresh token, one retry. If the IAM will not issue one the session is over,
 * and it is forgotten here - locally, with no request of its own, so a
 * refusal cannot set off another refusal the way the old sign-out call did.
 */
function withTokenSent(
  request: HttpRequest<unknown>,
  token: string,
  next: HttpHandlerFn,
  security: SecurityService,
): Observable<HttpEvent<unknown>> {
  return next(withBearer(request, token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return from(security.refreshAccessToken()).pipe(
        switchMap((renewed) => {
          if (!renewed || renewed === token) {
            security.forgetSession();
            return throwError(() => error);
          }

          return next(withBearer(request, renewed));
        }),
      );
    }),
  );
}

/**
 * A write (anything but GET and HEAD), counted from the moment it is handed
 * over until it has its answer - or failed, or was dropped. A sign-in waits
 * for them (SavesInFlight).
 */
function counted(request: HttpRequest<unknown>, sent: Observable<HttpEvent<unknown>>, saves: SavesInFlight): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return sent;
  }
  return defer(() => {
    const end = saves.begin();
    return sent.pipe(finalize(end));
  });
}

/** Whether the page is the admin panel's, which is for signed-in staff only and never plays as a visitor. */
function inAdminPanel(): boolean {
  return /^\/admin(\/|$)/.test(location.pathname);
}

/**
 * A person's request: with their token, or not at all.
 *
 * When the token comes back null - the refresh failed, they signed out in
 * another tab - the request is never sent: it fails here as a 401
 * `sign_in_required` and the page's signed-out handling takes over. Sent bare
 * it would be nobody's, and nobody's first save makes a visitor holding the
 * person's game. The visitor key is never sent for a person - but by the move
 * after a sign-in, which hands it over itself (CARRIES_VISITOR_KEY) - and a
 * key in the answer is ignored.
 */
function asPerson(request: HttpRequest<unknown>, next: HttpHandlerFn, security: SecurityService): Observable<HttpEvent<unknown>> {
  const carried = request.context.get(CARRIES_VISITOR_KEY);
  request = carried
    ? request.clone({ setHeaders: { [VISITOR_KEY_HEADER]: carried } })
    : request.clone({ headers: request.headers.delete(VISITOR_KEY_HEADER) });

  return from(security.getAccessToken()).pipe(
    switchMap((token) => (token ? withTokenSent(request, token, next, security) : throwError(() => notSignedIn(request.urlWithParams)))),
  );
}

/**
 * A visitor's request: with the key this browser holds now, if any, while the
 * site does not require a sign-in and the server keeps visitors - and the key
 * a new visitor gets from its answer. Never a token.
 *
 * While sign-in is required (or the server keeps no visitors) it goes with
 * neither: the key is KEPT - not sent, no new one taken, never forgotten - so
 * the next sign-in still moves what it holds. A 401 `visitor_unknown` forgets
 * the key that was sent (only while it is still the one held).
 */
function asVisitor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  visitor: VisitorKey,
  settings: SiteSettingsService,
): Observable<HttpEvent<unknown>> {
  const bare = request.clone({ headers: request.headers.delete(VISITOR_KEY_HEADER).delete('Authorization') });

  if (settings.loginRequired() || !settings.visitorsAvailable()) {
    return next(bare).pipe(catchError((error: unknown) => noted(error, settings)));
  }

  const key = visitor.current();
  const sent = key ? bare.clone({ setHeaders: { [VISITOR_KEY_HEADER]: key } }) : bare;

  return next(sent).pipe(
    tap((event) => {
      const made = !key && event instanceof HttpResponse ? event.headers.get(VISITOR_KEY_HEADER) : null;
      if (made) {
        visitor.remember(made);
      }
    }),
    catchError((error: unknown) => {
      if (key && error instanceof HttpErrorResponse && error.status === 401 && apiErrorCode(error) === 'visitor_unknown') {
        visitor.forget(key, true);
      }
      return noted(error, settings);
    }),
  );
}

/** Every other route of the API: the token when there is one, as it always was - never a visitor key. */
function asWhoever(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  security: SecurityService,
  settings: SiteSettingsService,
): Observable<HttpEvent<unknown>> {
  request = request.clone({ headers: request.headers.delete(VISITOR_KEY_HEADER) });

  return from(security.getAccessToken()).pipe(
    switchMap((token) =>
      token ? withTokenSent(request, token, next, security) : next(request).pipe(catchError((error: unknown) => noted(error, settings))),
    ),
  );
}

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  //
  // CACHE
  //
  if (req.method === 'GET' && (req.url.includes('/enums/') || req.url.includes('/hodnotaCiselnika/'))) {
    const cachedResponse = cache.get(req.urlWithParams);
    if (cachedResponse) {
      return cachedResponse.observable;
    }

    // const timeToLiveInMs = req.url.includes('/hodnotaCiselnika/simple/') ? 10 * 60 * 1000 : undefined;
    const response$ = next(req).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    cache.set(req.urlWithParams, {
      observable: response$,
      // timestampInMs: Date.now(),
      // timeToLiveInMs,
    });
  }

  //
  // BASE URL
  //
  const security = inject(SecurityService);
  const configService = inject(ConfigService);

  const baseUrl = configService.backendUrl;
  const isApi = req.url.startsWith('/api/');
  // Judged on the address as the page wrote it, before the base URL goes in front.
  const ownerUrl = isApi && isOwnerUrl(req.url);
  if (baseUrl && isApi) {
    req = req.clone({ url: `${baseUrl}${req.url}` });
  }

  //
  // METHOD OVERRIDE (multipart PUT/PATCH)
  //
  // PHP does not populate $_POST/$_FILES for multipart PUT or PATCH — only for
  // POST — so a multipart update sent as a real PUT arrives with an empty body
  // and the server silently updates nothing. Send it as POST with an override
  // header; the backend's MethodOverrideMiddleware routes it back to the real
  // method, and PHP parses the body because the request is a POST.
  if ((req.method === 'PUT' || req.method === 'PATCH') && typeof FormData !== 'undefined' && req.body instanceof FormData) {
    req = req.clone({ method: 'POST', setHeaders: { 'X-Http-Method-Override': req.method } });
  }

  //
  // AUTH - who a request is
  //
  // Only the site's own API gets the token or the visitor key. Anything else
  // this app fetches - config.json, the changelog - has no use for either, and
  // a token sent to a host that is not ours is a token handed to a stranger.
  if (!isApi) {
    return next(req);
  }

  const settings = inject(SiteSettingsService);
  const saves = inject(SavesInFlight);

  // Decided now, synchronously, before anything is awaited - from what the
  // page issued the request as (ISSUED_AS, issued-as.ts), or for a player's
  // own route issued without it, from whether the page is a signed-in
  // person's as it is handed over. Never from whether a token turns out to be
  // there when it leaves. The admin panel never plays as a visitor.
  const caller: Caller | null =
    req.context.get(ISSUED_AS) ?? (ownerUrl ? (security.isLoggedIn() || inAdminPanel() ? 'person' : 'visitor') : null);

  let sent: Observable<HttpEvent<unknown>>;
  if (caller === 'person') {
    sent = asPerson(req, next, security);
  } else if (caller === 'visitor') {
    sent = asVisitor(req, next, inject(VisitorKey), settings);
  } else {
    sent = asWhoever(req, next, security, settings);
  }

  return counted(req, sent, saves);
};
