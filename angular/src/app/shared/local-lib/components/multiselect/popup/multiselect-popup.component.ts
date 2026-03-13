import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPopupComponent } from '../../../abstract-popup.class';
import { DropdownOption } from '../../../services/options-helper.service';
import { ClickOutsideDirective } from '../../../click-outside.directive';

@Component({
  selector: 'app-multiselect-popup',
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './multiselect-popup.component.html',
  styleUrls: ['./multiselect-popup.component.scss'],
})
export class MultiselectPopupComponent extends AbstractPopupComponent<DropdownOption[]> {
  options: DropdownOption[] = [];
  selectedOptions: DropdownOption[] = [];
  selectAllEnabled: boolean = true;
  isAllSelected: boolean = false;

  @Output() optionToggled = new EventEmitter<DropdownOption>();
  @Output() selectAllToggled = new EventEmitter<void>();

  private _highlightedIndex: number = -1;

  private set highlightedIndex(value: number) {
    this._highlightedIndex = value;
  }

  get highlightedIndex(): number {
    return this._highlightedIndex;
  }

  highlightedIndexChange(newHighlightedIndex: number): void {
    this.highlightedIndex = newHighlightedIndex;
  }

  highlightNext(): void {
    const maxIndex = this.options.length - 1;
    if (this.highlightedIndex < maxIndex) {
      this.highlightedIndex++;
    }
  }

  highlightPrevious(): void {
    const minIndex = this.selectAllEnabled ? -1 : 0;
    if (this.highlightedIndex > minIndex) {
      this.highlightedIndex--;
    }
  }

  toggleHighlighted(): void {
    if (this.highlightedIndex === -1 && this.selectAllEnabled) {
      this.selectAllToggled.emit();
    } else if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
      this.optionToggled.emit(this.options[this.highlightedIndex]);
    }
  }

  isOptionSelected(option: DropdownOption): boolean {
    return this.selectedOptions.some((opt) => opt.key === option.key);
  }

  onOptionClick(option: DropdownOption, event: Event): void {
    event.stopPropagation();
    this.optionToggled.emit(option);
  }

  onSelectAllClick(event: Event): void {
    event.stopPropagation();
    this.selectAllToggled.emit();
  }

  clickOutside(): void {
    this.onClose.emit();
  }
}
