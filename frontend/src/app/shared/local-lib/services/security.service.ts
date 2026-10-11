import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnotokiAuth, type AnotokiUser } from '@anotoki/lib/auth';
import { RoleService } from './role.service';
import { Roles } from './options-helper.service';
import { MeApiService, SiteAuthConfig, SiteUser } from '../../../api';

/**
 * The signed-in reader, as the rest of the site reads them.
 *
 * This site's own record of them, from /api/me - or, when /api/me could not
 * be reached, what the IAM's ID token says (`_fromClaims()`), which is why
 * everything past the roles is optional. The address is always the token's:
 * the site keeps no copy of anybody's (the owner's decision of 2026-10-07).
 * How they like every anotoki site to look - the theme, the dates, the clock,
 * the language - is not here: it is the IAM account's (AccountPreferences, of
 * @anotoki/lib/auth).
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
  version?: string;
  /** When they first arrived on this site - which is not when their account was made. */
  created_at?: string;
}

export interface SignInOptions {
  /** A path on this site to come back to. Defaults to the page the reader is on. */
  returnTo?: string;
  /**
   * `login` has the IAM ask for the credentials again even when it already has
   * a session - signing in as somebody else.
   */
  prompt?: 'login';
}

/** The roles the admin panel is for. */
const STAFF_ROLES = ['ADMIN', 'EDITOR'];

const ROLE_MAP: Record<string, Roles> = {
  ADMIN: Roles.ADMIN,
  EDITOR: Roles.EDITOR,
  USER: Roles.USER,
};

function fromSiteUser(me: SiteUser, person: AnotokiUser): UserInfo {
  return {
    id: me.id,
    username: me.username,
    email: person.email ?? undefined,
    role: me.role,
    roles: me.roles,
    // The API says null where this shape says absent; both mean the same thing
    // here, and the rest of the site reads these as optional.
    background: me.background ?? undefined,
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

/** Which person, with which roles: the record is loaded again when this changes. */
function keyOf(person: AnotokiUser): string {
  return `${person.sub}:${person.roles
    .map((role) => role.toUpperCase())
    .sort()
    .join(',')}`;
}

function currentPath(): string {
  return location.pathname + location.search;
}

/**
 * Who is reading, according to the anotoki IAM - this site's view of the
 * library's sign-in (@anotoki/lib/auth, configured in shared/site-auth.ts).
 *
 * Signing in is not this site's. Every anotoki site sends people to one
 * identity provider, the IAM, through the family's one module, AnotokiAuth:
 * the code flow with PKCE, the tokens kept (under the same storage keys the
 * IAM's SDK used, so nobody was signed out by the move), refreshed and
 * followed across tabs, the callback finished before the router starts, the
 * IAM followed at every page load (signed out there, signed out here), and the
 * IAM's sign-in hint: a visitor signed in at the IAM is signed in here without
 * a click. The interceptor (anotokiAuthInterceptor) puts the token on the API's
 * requests.
 *
 * What stays this site's is what the rest of it reads: this site's own record
 * of the person from /api/me (`currentUser` - the name, the one role, when
 * they first came), loaded whenever the person or their roles change, and the
 * sign-in started from its own buttons. A record the API refuses (a 401 even
 * after a fresh token: this site cannot check the IAM's tokens just now) is
 * nobody signed in here, while the library still holds the session
 * (`holdsSession`) - and nothing signs in again on its own then, or it would
 * go round.
 */
@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly _auth = inject(AnotokiAuth);
  private readonly _meApi = inject(MeApiService);
  private readonly _roleService = inject(RoleService);

  private readonly _config = signal<SiteAuthConfig | null>(null);
  private readonly _user = signal<UserInfo | null>(null);

  /**
   * Which person, with which roles, `_user` was last loaded for - and that
   * load. Every token refresh hands over the person anew; a refresh is the
   * same person and needs nothing - unless the roles in it moved, which is how
   * a role granted or taken away at the IAM reaches a page that is already open.
   */
  private _loadedFor: string | null = null;
  private _loading: Promise<void> | null = null;

  /** The signed-in reader, or null. */
  readonly currentUser = this._user.asReadonly();

  readonly isLoggedIn = computed(() => this._user() !== null);

  /**
   * Whether the library holds a session - which is not the same as
   * `isLoggedIn`: they part when this site's API refuses the tokens the IAM
   * goes on issuing (the key set out of reach, a key rotated moments ago). A
   * sign-in started on its own would then come straight back to the same
   * refusal; what starts one by itself (the admin gate, the app initializer)
   * asks this first.
   */
  readonly holdsSession = this._auth.signedIn;

  /** ADMIN, EDITOR or USER - or '' for nobody. */
  readonly role = computed(() => (this._user()?.role ?? '').toUpperCase());

  /** Whether the reader is one of the people the admin panel is for. */
  readonly isStaff = computed(() => STAFF_ROLES.includes(this.role()));

  /**
   * Whether signing in can be offered at all: the site knows its IAM, and the
   * IAM knows the site (its public answer about the application was not a 404).
   */
  readonly available = this._auth.signInAvailable;

  /** The IAM's page for the account itself: password, two-factor, Google, sessions. */
  readonly accountUrl = computed(() => this._config()?.account_url ?? null);

  /** The IAM's admin console: accounts, roles, sessions - for every anotoki site at once. */
  readonly adminUrl = computed(() => this._config()?.admin_url ?? null);

  /**
   * A sign-in that came back from the IAM without working, or could not start:
   * its code (never the IAM's sentence) and where it started. The library's
   * screen says why (<anotoki-sign-in-failure>, on the callback's address).
   */
  readonly signInFailure = this._auth.signInFailure;

  constructor() {
    // The person the library shows, whenever it changes: another tab, a
    // refresh with other roles, a session that ended.
    effect(() => {
      const person = this._auth.user();
      untracked(() => void this._follow(person));
    });
  }

  /**
   * Called once, from the app initializer, after the library's init(): the
   * person's own record loaded before the router's first navigation, so the
   * first page is drawn for them. `config` is the public settings' `auth`,
   * where the IAM's account page and admin console are named. Never rejects.
   */
  init(config: SiteAuthConfig | null): Promise<void> {
    this._config.set(config);
    return this._follow(this._auth.user());
  }

  /**
   * Off to the IAM's sign-in, coming back to `returnTo` - by default, here - in
   * the language the site is read in. The library waits for the saves still on
   * their way first (a visitor's first played save brings the new visitor key
   * in its answer). Rejects when the browser is not on its way: the site
   * cannot sign in (no IAM), or the sign-in could not start.
   */
  async login(options: SignInOptions | string = {}): Promise<void> {
    const { returnTo, prompt } = typeof options === 'string' ? { returnTo: options, prompt: undefined } : options;

    if (!(await this._auth.signIn({ returnTo: returnTo ?? currentPath(), ...(prompt ? { prompt } : {}) }))) {
      throw new Error('The sign-in could not start');
    }
  }

  /** The same, opening on the IAM's registration form. */
  async register(returnTo?: string): Promise<void> {
    if (!(await this._auth.register({ returnTo: returnTo ?? currentPath() }))) {
      throw new Error('The sign-in could not start');
    }
  }

  /**
   * Signs out everywhere: the IAM ends its session, which signs the person out
   * of every anotoki site, and sends the browser back to this site's home page.
   */
  async logout(): Promise<void> {
    if (!(await this._auth.signOut())) {
      this._set(null);
    }
  }

  /** Brings the record in line with the person the library shows: nobody, or somebody whose record is loaded. */
  private _follow(person: AnotokiUser | null): Promise<void> {
    if (!person) {
      this._loadedFor = null;
      this._loading = null;
      this._set(null);
      return Promise.resolve();
    }

    const key = keyOf(person);
    if (key === this._loadedFor && this._loading) {
      return this._loading;
    }

    this._loadedFor = key;
    this._loading = this._loadMe(person, key);
    return this._loading;
  }

  private async _loadMe(person: AnotokiUser, key: string): Promise<void> {
    let user: UserInfo | null;
    try {
      user = fromSiteUser(await firstValueFrom(this._meApi.getMe()), person);
    } catch (error) {
      // A 401 even after the interceptor's one fresh token: nobody is signed
      // in here (see the class). Anything else - the API down, a network gone
      // - says nothing about who this is; the ID token still does, so the
      // reader stays signed in with the name and roles in it.
      user = error instanceof HttpErrorResponse && error.status === 401 ? null : this._fromClaims(person);
    }

    // Somebody else, or nobody, since the load began: theirs is not this one.
    if (this._loadedFor === key) {
      this._set(user);
    }
  }

  private _fromClaims(person: AnotokiUser): UserInfo {
    const roles = person.roles.map((role) => role.toUpperCase());

    return {
      id: Number(person.sub),
      username: person.preferred_username ?? person.email ?? `user${person.sub}`,
      email: person.email ?? undefined,
      role: roles.includes('ADMIN') ? 'ADMIN' : roles.includes('EDITOR') ? 'EDITOR' : 'USER',
      roles,
    };
  }

  private _set(user: UserInfo | null): void {
    this._user.set(user);
    this._roleService.setRoles(user ? rolesOf(user) : []);
  }
}
