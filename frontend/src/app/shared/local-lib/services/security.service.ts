import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { RoleService } from './role.service';
import { SavesInFlight } from './saves-in-flight.service';
import { Roles } from './options-helper.service';
import { DateFormatsRequest, MeApiService, SiteAuthConfig, SiteUser } from '../../../api';
import { AUTH_CALLBACK_PATH } from '../../routing-definition';
// No extension on purpose. TypeScript reads the types of a `.mjs` specifier only
// from a `.d.mts`; written like this it finds the SDK's own `.d.ts`, and the
// bundler, which tries `.mjs` after `.ts`, finds the code.
import { type AnotokiAuth, type AnotokiUser, createAuth } from '../iam/anotoki-auth';

/**
 * The signed-in reader, as the rest of the site reads them.
 *
 * This site's own record of them, from /api/me. The preferences are optional
 * for the one case where they are not known: /api/me could not be reached and
 * the reader is drawn from what the IAM's ID token says instead - see
 * `_fromIdToken()`. Absent then means "keep what this device has", which is
 * the right answer for a theme or a language nobody actually read.
 */
export interface UserInfo {
  /** The IAM user id, which this site keys everything of theirs on. */
  id: number;
  username: string;
  email?: string;
  /** The highest of this site's roles: ADMIN, EDITOR, or USER for an ordinary player. */
  role: string;
  /** Every role the token grants here. */
  roles: string[];
  background?: string;
  /** Light/dark choice, kept per area - see ThemeToggleService. */
  theme_main?: string;
  theme_admin?: string;
  /** Language code the site is read in - see TranslationService. */
  language?: string;
  /** How dates and times are written, or absent for "as this device does" - see DateFormatService. */
  date_format?: string;
  time_format?: string;
  version?: string;
  /** When they first arrived on this site - which is not when their account was made. */
  created_at?: string;
}

/** A sign-in that came back from the IAM without working. */
export interface SignInFailure {
  /**
   * What went wrong, as a code: an OAuth one from the IAM (`access_denied` when
   * the person backed out), one of the SDK's own (`state_mismatch`), or
   * `unavailable` when this site could not even learn where its IAM is.
   */
  code: string;
  /** Where the reader was when they pressed "Sign in", which is where trying again comes back to. */
  returnTo: string;
}

export interface SignInOptions {
  /** A path on this site to come back to. Defaults to the page the reader is on. */
  returnTo?: string;
  /**
   * `login` has the IAM ask for the credentials again even when it already has
   * a session - for the few actions that want proof of a recent sign-in, such
   * as restoring a database.
   */
  prompt?: 'login';
  /**
   * The language to ask the IAM for its pages in, when the page cannot say yet:
   * a sign-in started before anything is drawn, while the document still has
   * index.html's `lang`. Otherwise the language the page is in.
   */
  language?: string;
}

/** The roles the admin panel is for. */
const STAFF_ROLES = ['ADMIN', 'EDITOR'];

const ROLE_MAP: Record<string, Roles> = {
  ADMIN: Roles.ADMIN,
  EDITOR: Roles.EDITOR,
  USER: Roles.USER,
};

function fromSiteUser(me: SiteUser): UserInfo {
  return {
    id: me.id,
    username: me.username,
    email: me.email ?? undefined,
    role: me.role,
    roles: me.roles,
    // The API says null where this shape says absent; both mean the same thing
    // here, and the rest of the site reads these as optional.
    background: me.background ?? undefined,
    theme_main: me.theme_main,
    theme_admin: me.theme_admin,
    language: me.language,
    date_format: me.date_format ?? undefined,
    time_format: me.time_format ?? undefined,
    version: me.version ?? undefined,
    created_at: me.created_at ?? undefined,
  };
}

/** Every role the reader has here - the highest of them, and any others the token grants. */
function rolesOf(user: UserInfo): Roles[] {
  const roles = new Set<Roles>([ROLE_MAP[user.role.toUpperCase()] ?? Roles.USER]);

  for (const role of user.roles) {
    const known = ROLE_MAP[role.toUpperCase()];
    if (known !== undefined) {
      roles.add(known);
    }
  }

  return [...roles];
}

function currentPath(): string {
  return location.pathname + location.search;
}

/**
 * The language to ask the IAM for its pages in: the one the page is in now.
 *
 * Read off the document, where TranslationService writes it - the site's
 * reading language on the site, English in the admin panel - rather than
 * injected, because that service already depends on this one.
 */
function uiLocale(): string | undefined {
  const lang = document.documentElement.lang;
  return lang ? lang.split('-')[0] : undefined;
}

/**
 * Who is reading, according to the anotoki IAM.
 *
 * Signing in is not this site's any more. Every anotoki site sends people to one
 * identity provider, the IAM, and gets back tokens; the API checks the access
 * token on each request and knows nothing about passwords, two-factor, Google or
 * sessions - those live on the IAM's account page. This service is the thin
 * layer between the IAM's browser SDK (vendored in ../iam) and the rest of the
 * site: it starts the SDK, turns what it holds into signals, and loads this
 * site's own record of the reader from /api/me.
 *
 * The tokens are the SDK's to keep. It stores them in localStorage under its
 * own key, refreshes them before they run out (serialised across tabs), and
 * reports every change - including a sign-out in another tab - through
 * `onChange`, which is followed here.
 */
@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly _meApi = inject(MeApiService);
  private readonly _roleService = inject(RoleService);
  private readonly _saves = inject(SavesInFlight);

  private _auth: AnotokiAuth | null = null;
  private readonly _config = signal<SiteAuthConfig | null>(null);
  private readonly _user = signal<UserInfo | null>(null);
  private readonly _sessionHeld = signal(false);
  private readonly _signInFailure = signal<SignInFailure | null>(null);

  /**
   * Which person, with which roles, `_user` was last loaded for.
   *
   * The SDK reports every token refresh as a change. A refresh is the same
   * person with a new token and needs nothing - unless the roles in it moved,
   * which is how a role granted or taken away at the IAM reaches a page that is
   * already open. So the record is reloaded when this differs, and not otherwise.
   */
  private _loadedFor: string | null = null;

  /** The signed-in reader, or null. */
  readonly currentUser = this._user.asReadonly();

  readonly isLoggedIn = computed(() => this._user() !== null);

  /**
   * Whether the SDK holds a session - which is not the same as `isLoggedIn`.
   *
   * They part when this site's API refuses the tokens the IAM goes on issuing:
   * the key set out of reach, say, or a key rotated moments ago. Then the IAM
   * has signed the person in and this site has not, and a sign-in started on
   * its own would come straight back to the same refusal - round and round.
   * What starts one by itself (the admin gate) asks this first.
   */
  readonly holdsSession = this._sessionHeld.asReadonly();

  /** ADMIN, EDITOR or USER - or '' for nobody. */
  readonly role = computed(() => (this._user()?.role ?? '').toUpperCase());

  /** Whether the reader is one of the people the admin panel is for. */
  readonly isStaff = computed(() => STAFF_ROLES.includes(this.role()));

  /**
   * Whether signing in can be offered at all.
   *
   * False only when the site could not learn where its IAM is - the settings
   * read that carries it failed, which in practice means the API is down and
   * nothing else works either.
   */
  readonly available = computed(() => this._config() !== null);

  /** The IAM's page for the account itself: password, two-factor, Google, sessions. */
  readonly accountUrl = computed(() => this._config()?.account_url ?? null);

  /** The IAM's admin console: accounts, roles, sessions - for every anotoki site at once. */
  readonly adminUrl = computed(() => this._config()?.admin_url ?? null);

  /** Set when this page load was a sign-in coming back that did not work - see AuthCallbackComponent. */
  readonly signInFailure = this._signInFailure.asReadonly();

  /**
   * Called once, from the app initializer, after the public settings have been
   * read - they are where the IAM's address and this site's client id come from,
   * so that moving the IAM is a change on the server rather than a rebuild.
   *
   * `auth.init()` has to finish before the router's first navigation. When this
   * page load is the IAM sending somebody back, it exchanges the code and puts
   * the address the person started from into the address bar, so the router
   * then draws that page - with them signed in - instead of the callback.
   *
   * Never rejects: a site whose sign-in cannot start still has to render.
   */
  async init(config: SiteAuthConfig | null): Promise<void> {
    if (!config?.issuer || !config.client_id) {
      // Nowhere to finish a sign-in that has come back. The spent code and
      // state are taken out of the address bar anyway, and the callback page
      // says what happened rather than showing a page that pretends nothing did.
      if (location.pathname === AUTH_CALLBACK_PATH) {
        this._fail('unavailable', '/');
      }
      return;
    }

    try {
      this._auth = createAuth({
        issuer: config.issuer,
        clientId: config.client_id,
        // Both registered at the IAM for this client, byte for byte.
        redirectUri: location.origin + AUTH_CALLBACK_PATH,
        postLogoutRedirectUri: `${location.origin}/`,
      });
      this._config.set(config);

      const result = await this._auth.init();

      if (result.error) {
        this._fail(result.error.code || 'unknown', result.returnTo ?? '/');
      }
    } catch (error) {
      console.error('Sign-in could not start', error);
      return;
    }

    await this._followSdk();

    // After init, so the callback's own changes are not taken for news.
    this._auth.onChange(() => void this._followSdk());
  }

  /**
   * Off to the IAM's sign-in, coming back to `returnTo` - by default, here.
   *
   * The page is left, so this never really finishes. The IAM's pages are shown
   * in the language the site is being read in, where it has them.
   *
   * It leaves only once the saves still on their way have their answers
   * (SavesInFlight, 30 seconds at most): a visitor's first played save brings
   * the new visitor key in its answer, and a page left before it arrives
   * never keeps the key - the move after the sign-in would find nothing.
   */
  async login(options: SignInOptions | string = {}): Promise<void> {
    const { returnTo, prompt, language } = typeof options === 'string' ? { returnTo: options, prompt: undefined, language: undefined } : options;

    if (!this._auth) {
      throw new Error('Signing in is not available: the site does not know where its IAM is');
    }

    await this._saves.settled();
    await this._auth.login({
      returnTo: returnTo ?? currentPath(),
      prompt,
      uiLocales: language || uiLocale(),
    });
  }

  /** The same, opening on the IAM's registration form - after the saves on their way, too. */
  async register(returnTo?: string): Promise<void> {
    if (!this._auth) {
      throw new Error('Signing in is not available: the site does not know where its IAM is');
    }

    await this._saves.settled();
    await this._auth.register({ returnTo: returnTo ?? currentPath(), uiLocales: uiLocale() });
  }

  /**
   * Signs out everywhere: the IAM ends its session, which signs the person out
   * of every anotoki site, and sends the browser back to this site's home page.
   */
  async logout(): Promise<void> {
    if (!this._auth) {
      this._set(null);
      return;
    }

    await this._auth.logout();
  }

  /** A valid access token for the API, refreshed when it is about to run out - or null when nobody is signed in. */
  getAccessToken(): Promise<string | null> {
    return this._auth ? this._auth.getAccessToken() : Promise.resolve(null);
  }

  /** After the API refused the current token: a different one, or null when the IAM will not issue one. */
  refreshAccessToken(): Promise<string | null> {
    return this._auth ? this._auth.refresh() : Promise.resolve(null);
  }

  /**
   * Forgets the session in this browser, and only here, for when the API has
   * refused it and the IAM will not renew it.
   *
   * Local on purpose. There is nothing to tell this site's API - it keeps no
   * sessions - and signing out at the IAM would be a navigation in the middle
   * of whatever the reader was doing. The SDK spends the refresh token on the
   * way out, with a plain fetch that no interceptor sees, so a refusal here
   * cannot turn into another request that is refused in turn.
   */
  forgetSession(): void {
    this._loadedFor = null;
    this._sessionHeld.set(false);
    this._set(null);
    void this._auth?.logout({ local: true });
  }

  /**
   * How dates and times are written for this reader.
   *
   * A field left out is left alone; a field sent as null is cleared back to
   * whatever the device says. The answer is the reader's record as it now
   * stands, which replaces the one held here - see DateFormatService.
   */
  setDateFormats(formats: DateFormatsRequest): Observable<SiteUser> {
    return this._meApi.setDateFormats(formats).pipe(tap((me) => this._set(fromSiteUser(me))));
  }

  /**
   * Brings this page in line with the SDK: nobody, or somebody whose record is
   * loaded. Once at start, then on every change the SDK reports.
   */
  private async _followSdk(): Promise<void> {
    const auth = this._auth;
    this._sessionHeld.set(!!auth && auth.isAuthenticated());

    if (!auth || !auth.isAuthenticated()) {
      this._loadedFor = null;
      this._set(null);
      return;
    }

    const claims = auth.user();
    const key = claims ? `${claims.sub}:${[...claims.roles].sort().join(',')}` : 'unknown';

    if (key === this._loadedFor) {
      return;
    }

    this._loadedFor = key;
    await this._loadMe();
  }

  private async _loadMe(): Promise<void> {
    try {
      this._set(fromSiteUser(await firstValueFrom(this._meApi.getMe())));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Refused even after the interceptor's one fresh token. Either the IAM
        // would not issue one - the session is over, and the interceptor has
        // forgotten it - or it did and the API refused that too, because this
        // site cannot check the IAM's tokens just now. Nobody is signed in here
        // either way; in the second case the SDK still holds its session
        // (`holdsSession`), and nothing signs in again on its own.
        this._set(null);
        return;
      }

      // Anything else - the API down, a network gone - says nothing about who
      // this is. The ID token still does, so the reader stays signed in with
      // the name and roles in it, and this device's own preferences.
      this._set(this._fromIdToken());
    }
  }

  private _fromIdToken(): UserInfo | null {
    const claims: AnotokiUser | null = this._auth?.user() ?? null;

    if (!claims) {
      return null;
    }

    const roles = claims.roles.map((role) => role.toUpperCase());

    return {
      id: Number(claims.sub),
      username: claims.preferred_username ?? claims.email ?? `user${claims.sub}`,
      email: claims.email ?? undefined,
      role: roles.includes('ADMIN') ? 'ADMIN' : roles.includes('EDITOR') ? 'EDITOR' : 'USER',
      roles,
    };
  }

  private _set(user: UserInfo | null): void {
    this._user.set(user);
    this._roleService.setRoles(user ? rolesOf(user) : []);
  }

  private _fail(code: string, returnTo: string): void {
    this._signInFailure.set({ code, returnTo });
    // The SDK has already put the address back to where the person started.
    // The failure is told at the callback's own address instead - without the
    // spent code and state - so the router's first navigation draws it.
    history.replaceState(null, '', AUTH_CALLBACK_PATH);
  }
}
