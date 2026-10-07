import { Component, ElementRef, viewChild } from '@angular/core';
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
  /** The autocomplete's `popupMaxHeight`; unset, the stylesheet's 200px. */
  maxHeight?: number;

  /** The list, which scrolls: the highlighted option is kept in sight in it. */
  private readonly _list = viewChild<ElementRef<HTMLElement>>('list');

  highlightNext(): void {
    if (this.highlightedIndex < this.options.length - 1) {
      this.highlightedIndex++;
      this._showHighlighted();
    }
  }

  highlightPrevious(): void {
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
      this._showHighlighted();
    }
  }

  /**
   * Draws the highlight the arrow keys moved, and scrolls the list to it.
   *
   * The keys are heard by the autocomplete's own view, and that view is all a
   * zoneless app redraws for them - this list is a view of its own, at the end
   * of <body> - so without this the highlight moved unseen, and only Enter
   * showed where it was. Only the list scrolls, never the page: a page that
   * scrolls closes the list.
   */
  private _showHighlighted(): void {
    this.cd.detectChanges();

    const list = this._list()?.nativeElement;
    const option = list?.querySelectorAll<HTMLElement>('.autocomplete-option')[this.highlightedIndex];
    if (!list || !option) {
      return;
    }
    if (option.offsetTop < list.scrollTop) {
      list.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
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
