import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { AnotokiAuth, CARRIES_VISITOR_KEY, ISSUED_AS, VISITOR_KEY_HEADER } from '@anotoki/lib/auth';
import { ConfigService } from './config.service';

interface CacheableRequest {
  observable: Observable<any>;
  // timestampInMs: number;
  // timeToLiveInMs?: number;
}

const cache = new Map<string, CacheableRequest>();

/**
 * The visitor key the move at sign-in hands over beside the person's token
 * (VisitorKey.moveIntoAccount()) - the one request that carries both. The
 * generated client's methods take a context and no headers, so the key rides
 * in the context as far as here, which puts it in its header and tells the
 * library's interceptor the request carries it (CARRIES_VISITOR_KEY): that one
 * then leaves the key on, beside the token. Nothing else sets it.
 */
export const VISITOR_KEY_CARRIED = new HttpContextToken<string | null>(() => null);

/**
 * This site's part of every request, before the anotoki library's
 * (anotokiAuthInterceptor, which decides who a request of the API is when it
 * is issued and puts the token or the visitor key on it - shared/site-auth.ts).
 */
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
  // WHO A REQUEST IS - the library's, next; two things of this site's first
  //
  if (!isApi) {
    return next(req);
  }

  const carried = req.context.get(VISITOR_KEY_CARRIED);
  if (carried) {
    req = req.clone({ setHeaders: { [VISITOR_KEY_HEADER]: carried }, context: req.context.set(CARRIES_VISITOR_KEY, true) });
  } else if (req.context.get(ISSUED_AS) === null) {
    // A page shown to a person whose session has since ended - signed out in
    // another tab, a refresh the IAM refused - while the site lets visitors
    // in: the library would hold every request that does not say whom it is
    // for to that person's (and, with no token to send, fail it in the
    // browser). This site's database, quizzes and games are for anybody, as
    // they always were here: such a request goes as nobody's - no token, no
    // key. A player's own data never does: QuizProgressService and the
    // Profile say whom each of their requests is for.
    const auth = inject(AnotokiAuth);
    if (auth.state() === 'signed-out' && auth.visitorsWelcome()) {
      req = req.clone({ context: req.context.set(ISSUED_AS, 'nobody') });
    }
  }

  return next(req);
};
