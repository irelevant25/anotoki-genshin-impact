import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPopupComponent } from '../../../abstract-popup.class';
import { DropdownOption } from '../../../services/options-helper.service';
import { ClickOutsideDirective } from '../../../click-outside.directive';

@Component({
  selector: 'app-dropdown-popup',
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './dropdown-popup.component.html',
  styleUrls: ['./dropdown-popup.component.scss'],
})
export class DropdownPopupComponent extends AbstractPopupComponent<DropdownOption> {
  options: DropdownOption[] = [];
  emptyOption: boolean = true;

  private _highlightedIndex: number = -1;
  private set highlightedIndex(highlightedIndex: number) {
    this._highlightedIndex = highlightedIndex;
  }
  get highlightedIndex(): number {
    return this._highlightedIndex;
  }

  highlightedIndexChange(newHighlightedIndex: number): void {
    this.highlightedIndex = newHighlightedIndex;
  }

  highlightNext(): void {
    if (this.highlightedIndex < this.options.length - 1) {
      this.highlightedIndex++;
    }
  }

  highlightPrevious(): void {
    if (this.highlightedIndex > 0 || (this.emptyOption && this.highlightedIndex === 0)) {
      this.highlightedIndex--;
    }
  }

  selectHighlighted(): void {
    if (this.highlightedIndex === -1) {
      this.selectOption();
    }
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
      this.selectOption(this.options[this.highlightedIndex]);
    }
  }

  resetHighlight(): void {
    this.highlightedIndex = -1;
  }

  clickOutside(): void {
    this.onClose.emit();
  }
}
