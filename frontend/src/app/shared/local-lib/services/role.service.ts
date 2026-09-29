import { Injectable, computed, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Roles } from './options-helper.service';

/**
 * This site's roles for whoever is signed in, as SecurityService last set them.
 *
 * A signal, so anything that asks - a `computed`, an `effect`, a template - asks
 * again when the answer changes. The roles are the IAM's to grant and can
 * change under an open page (signed out in another tab, a role taken away at
 * the next token), and a button worked out once in a field initializer would
 * go on offering what the API has started to refuse.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly _clearEntityRoles = new Subject<void>();
  readonly clearEntityRoles$: Observable<void> = this._clearEntityRoles.asObservable();

  private readonly _roles = signal<Roles[]>([]);
  readonly roles = this._roles.asReadonly();

  readonly isAdmin = computed(() => this._roles().includes(Roles.ADMIN));

  setRoles(roles: Roles[]): void {
    this._roles.set(roles);
  }

  getRoles(): Roles[] {
    return this._roles();
  }

  /** Whether the reader has any of these; an admin has all of them. Reactive when read inside a signal context. */
  hasRole(...roles: Roles[]): boolean {
    if (roles.length === 0) {
      return true;
    }
    return this.isAdmin() || roles.some((role) => this._roles().includes(role));
  }

  clearEntityRoles(): void {
    this._clearEntityRoles.next();
  }
}
