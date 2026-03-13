import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { SecurityService } from './security.service';
import { ConfigService } from './config.service';

interface CacheableRequest {
  observable: Observable<any>;
  // timestampInMs: number;
  // timeToLiveInMs?: number;
}

const cache = new Map<string, CacheableRequest>();

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
  const authService = inject(SecurityService);
  const configService = inject(ConfigService);

  const baseUrl = configService.backendUrl;
  if (baseUrl && !req.url.startsWith('http://') && !req.url.startsWith('https://') && req.url.startsWith('/api/')) {
    req = req.clone({ url: `${baseUrl}${req.url}` });
  }

  //
  // AUTH
  //
  const token = authService.accessToken;

  // No token — pass the request through as-is (public endpoints)
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq).pipe(
    tap((event) => {
      // If the server issued a fresh token (< 24 h remaining on the old one),
      // store it transparently so the next request uses the renewed expiry.
      if (event instanceof HttpResponse) {
        const newToken = event.headers.get('X-Refresh-Token');
        if (newToken) {
          authService.updateToken(newToken);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
