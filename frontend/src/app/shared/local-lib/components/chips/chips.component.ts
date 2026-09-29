import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string[];

@Component({
  selector: 'app-chips',
  imports: [CommonModule],
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
})
export class ChipsComponent extends AbstractInputComponent<Type> {
  options = model<string[]>([]);
  maxSelected = model<number | undefined>(undefined);
  minSelected = model<number | undefined>(undefined);

  toggleRole(name: string): void {
    this.value.update((roles) => {
      return roles?.includes(name) ? roles.filter((r) => r !== name) : [...roles ?? [], name]
    });
  }
  isRoleSelected(name: string): boolean {
    return !!this.value()?.includes(name);
  }
}
