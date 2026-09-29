import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { SecurityService } from './security.service';
import { ConfigService } from './config.service';

interface CacheableRequest {
  observable: Observable<any>;
  // timestampInMs: number;
  // timeToLiveInMs?: number;
}

const cache = new Map<string, CacheableRequest>();

function withBearer(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
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
  // AUTH
  //
  // Only the site's own API gets the token. Anything else this app fetches -
  // config.json, the changelog - has no use for it, and a token sent to a
  // host that is not ours is a token handed to a stranger.
  if (!isApi) {
    return next(req);
  }

  const request = req;

  return from(security.getAccessToken()).pipe(
    switchMap((token) =>
      next(withBearer(request, token)).pipe(
        catchError((error: unknown) => {
          if (!token || !(error instanceof HttpErrorResponse) || error.status !== 401) {
            return throwError(() => error);
          }

          // The API refused a token the SDK thought was good: expired on the
          // way, or the session behind it ended at the IAM. One fresh token,
          // one retry. If the IAM will not issue one the session is over, and
          // it is forgotten here - locally, with no request of its own, so a
          // refusal cannot set off another refusal the way the old sign-out
          // call did.
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
      ),
    ),
  );
};
