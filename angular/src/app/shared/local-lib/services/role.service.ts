import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Roles } from './options-helper.service';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  isAdmin = false;

  private readonly _clearEntityRoles = new Subject<void>();
  readonly clearEntityRoles$: Observable<void> = this._clearEntityRoles.asObservable();

  private readonly _roles = new BehaviorSubject<Roles[]>([]);
  readonly roles$: Observable<Roles[]> = this._roles.asObservable();

  setRoles(roles: Roles[]): void {
    this._roles.next(roles);
    this.isAdmin = roles.includes(Roles.ADMIN);
  }

  getRoles(): Roles[] {
    return this._roles.value;
  }

  hasRole(...roles: Roles[]): boolean {
    if (roles.length === 0) {
      return true;
    }
    return this.isAdmin || roles.some((role) => this._roles.value.includes(role));
  }

  clearEntityRoles(): void {
    this._clearEntityRoles.next();
  }
}
