import { Component, EventEmitter, model, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-filter',
  imports: [ButtonComponent],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent<T extends Record<string, any>> extends AbstractRolesComponent {
  filter = model<T>();
  insideContainer = model<boolean>(true);
  class = model<string>();

  @Output() onToggleFilter = new EventEmitter();
  @Output() onReset = new EventEmitter();
  @Output() onFilter = new EventEmitter();

  filterExpanded = model<boolean>(true);
  filterNastavenieExpanded = model<boolean>(false);

  reset(): void {
    this.onReset.emit();
  }

  filterClick(): void {
    this.onFilter.emit();
  }

  toggleFilter(): void {
    this.onToggleFilter.emit();
    this.filterExpanded.update((value) => !value);
  }
}
