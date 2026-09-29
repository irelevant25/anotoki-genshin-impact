import { Directive, effect, inject, model } from '@angular/core';
import { RoleService } from './services/role.service';
import { Roles } from './services/options-helper.service';

@Directive()
export abstract class AbstractRolesComponent {
  roles = model<Roles[]>([]);
  hidden = model<boolean>(false);

  private readonly _roleService = inject(RoleService);

  constructor() {
    effect(() => {
      this.hidden.set(!this._roleService.hasRole(...this.roles()));
    });
  }
}
