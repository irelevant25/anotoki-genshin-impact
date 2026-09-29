import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownOption } from '../../../services/options-helper.service';
import { AbstractPopupComponent } from '../../../abstract-popup.class';

@Component({
  selector: 'app-autocomplete-popup',
  imports: [CommonModule, FormsModule],
  templateUrl: './autocomplete-popup.component.html',
  styleUrls: ['./autocomplete-popup.component.scss'],
})
export class AutocompletePopupComponent extends AbstractPopupComponent<DropdownOption> {
  options: DropdownOption[] = [];
  loading: boolean = false;
  minChars: number = 1;
  minCharsValid: boolean = false;
  highlightedIndex: number = -1;

  highlightNext(): void {
    if (this.highlightedIndex < this.options.length - 1) {
      this.highlightedIndex++;
    }
  }

  highlightPrevious(): void {
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
    }
  }

  selectHighlighted(): void {
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
      this.selectOption(this.options[this.highlightedIndex]);
    }
  }

  resetHighlight(): void {
    this.highlightedIndex = -1;
  }
}
