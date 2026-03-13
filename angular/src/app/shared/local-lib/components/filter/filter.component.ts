import { Component, EventEmitter, Input, model, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-filter',
  imports: [ButtonComponent],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent<T extends Record<string, any>> extends AbstractRolesComponent {
  filter = model<T | undefined>(undefined);
  @Input() nastavenie: boolean = false;

  // @Output() filterChange = new EventEmitter<T>();
  @Output() onToggleFilter = new EventEmitter();
  @Output() onReset = new EventEmitter();
  @Output() onFilter = new EventEmitter();

  filtersExpanded: boolean = true;
  filterNastavenieExpanded: boolean = false;

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  reset(): void {
    this.onReset.emit();
  }

  filterClick(): void {
    this.onFilter.emit();
  }

  toggleFilter(): void {
    this.onToggleFilter.emit();
  }
}
