import { Component, model, ComponentRef, TemplateRef, ContentChild, ApplicationRef, createComponent, EnvironmentInjector, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutocompletePopupComponent } from './popup/autocomplete-popup.component';
import { Observable, Subscription } from 'rxjs';
import { ClickOutsideDirective } from '../../click-outside.directive';
import { AbstractInputComponent } from '../../abstract-input.class';
import { SCROLL_POPUP, ScrollDirective, ScrollPopup } from '../../scroll.directive';
import { DropdownOption } from '../../services/options-helper.service';
import { AutoResizeDirective } from '../../auto-resize.directive';
import { removeDiacritics } from '../../diacritics';

/*
<alf-autocomplete label="Štát" placeholder="Vyhľadať štát..." [(value)]="request.filter!.statId" [searchMethod]="optionsHelperService.searchStat"></alf-autocomplete>

<alf-autocomplete label="Štát" placeholder="Vyhľadať štát..." [(value)]="request.filter!.statId" [searchMethod]="optionsHelperService.searchStatWithParam({ zaciatokPlatnostiOd: '2022-01-01' })"></alf-autocomplete>

<alf-autocomplete label="Štát" placeholder="Vyhľadať štát..." [(value)]="request.filter!.statId" [searchMethod]="optionsHelperService.searchStat">
<ng-template let-option>{{ option.value }}</ng-template>
</alf-autocomplete>
*/

type Type = string | number | undefined;

@Component({
  selector: 'app-autocomplete',
  imports: [FormsModule, ClickOutsideDirective, ScrollDirective, AutoResizeDirective],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: AutocompleteComponent,
    },
    {
      provide: SCROLL_POPUP,
      useExisting: AutocompleteComponent,
    },
  ],
})
export class AutocompleteComponent extends AbstractInputComponent<Type> implements ScrollPopup {
  @ContentChild(TemplateRef) optionTemplate?: TemplateRef<any>;

  staticOptions = model<DropdownOption[] | null | undefined>(undefined);
  searchMethod = model<((term: string) => Observable<DropdownOption[]>) | undefined>(undefined);
  minChars = model<number>(1);
  debounceTime = model<number>(300);
  caseSensitive = model<boolean>(false);
  removeDiacritics = model<boolean>(true);
  closeOnScroll = model<boolean>(true);
  customValue = model<boolean>(false);
  displayValueInput = input<string | undefined>(undefined, { alias: 'displayValue' });
  displayValueChange = output<string | undefined>();
  displayValue = signal<string | undefined>(undefined);
  selectedOption = model<DropdownOption | undefined>(undefined);

  loading: boolean = false;
  isPopupOpen: boolean = false;
  currentOptions: DropdownOption[] = [];
  popupRef: ComponentRef<AutocompletePopupComponent> | null = null;

  private _debounceTimer?: any;
  private _subscription: Subscription = new Subscription();

  constructor(
    private _appRef: ApplicationRef,
    private _injector: EnvironmentInjector,
  ) {
    super();
    effect(() => {
      const v = this.displayValueInput();
      this.displayValue.set(v?.trim() ?? undefined);
    });
    effect(() => {
      const customValueEnabled = this.customValue();
      const displayValue = this.displayValue();
      if (customValueEnabled) {
        this.skipAfterValueChange = true;
        this.value.set(displayValue);
      }
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.closePopup();
    this._subscription.unsubscribe();
    clearTimeout(this._debounceTimer);
  }

  protected override afterValueChange(value?: Type): void {
    if (!value) {
      this.setDisplayValue(undefined);
    } else {
      this.setDisplayValue(this.displayValueInput());
    }
  }

  private setDisplayValue(value: string | undefined): void {
    this.displayValue.set(value);
    this.displayValueChange.emit(value);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const customValue = this.customValue();
    if (customValue) {
      this.skipAfterValueChange = true;
      this.value.set(this.displayValue());
    } else if (this.value()) {
      this.skipAfterValueChange = true;
      this.value.set(undefined);
    }
    this.inputChange.emit(this.value());
    this.setDisplayValue(target.value);
    this.initOptions();
  }

  initOptions(): void {
    clearTimeout(this._debounceTimer);

    this.currentOptions = [];
    const minChars = this.minChars();
    if ((this.displayValue() ?? '').length >= minChars) {
      const searchMethod = this.searchMethod();
      if (searchMethod) {
        const debounceTime = this.debounceTime();
        this._debounceTimer = setTimeout(() => {
          this.performSearch();
        }, debounceTime);
        this.loading = true;
      } else {
        this.performSearch();
        this.loading = false;
      }
    }
    this.updatePopup();
  }

  override onBlur(event?: Event): void {
    if (!this.isPopupOpen) {
      super.onBlur(event);
    }
  }

  override onFocus(): void {
    super.onFocus();
    this.openPopup();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isPopupOpen || !this.popupRef) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.popupRef.instance.highlightNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.popupRef.instance.highlightPrevious();
        break;
      case 'Enter':
        event.preventDefault();
        this.popupRef.instance.selectHighlighted();
        break;
      case 'Escape':
        event.preventDefault();
        this.closePopup();
        this.inputElement?.nativeElement.blur();
        break;
    }
  }

  private performSearch(): void {
    const query = this.displayValue()?.trim();
    this.loadOptions(query ?? '');
  }

  private loadOptions(searchText: string): void {
    const searchMethod = this.searchMethod();
    const staticOptions = this.staticOptions();

    if (searchMethod) {
      this._subscription.unsubscribe();
      this._subscription = searchMethod(searchText).subscribe((data) => {
        if (!this.isPopupOpen) {
          return;
        }
        this.currentOptions = data;
        this.loading = false;
        this.updatePopup();
      });
    } else if (staticOptions) {
      const filteredData = staticOptions.filter((item) => {
        const itemCheck = removeDiacritics(item.value.toString().toLowerCase());
        const searchTextCheck = removeDiacritics(searchText.toLocaleLowerCase());
        return itemCheck.includes(searchTextCheck);
      });
      this.currentOptions = filteredData;
      this.updatePopup();
    } else {
      console.error('Neither searchMethod nor staticOptions was provided.');
      this.currentOptions = [];
      this.updatePopup();
    }
  }

  selectOption(option?: DropdownOption): void {
    this.setDisplayValue(option?.value.toString());
    this.skipAfterValueChange = true;
    this.value.set(option?.key.toString());
    this.inputChange.emit(this.value());
    this.selectedOption.set(option);
    this.emitValidationState();
    this.closePopup();
    this.currentOptions = [];
  }

  // popup functions

  createPopup(): ComponentRef<AutocompletePopupComponent> {
    this.popupRef = createComponent(AutocompletePopupComponent, {
      environmentInjector: this._injector,
    });

    // Attach to application
    this._appRef.attachView(this.popupRef.hostView);

    document.body.appendChild(this.popupRef.location.nativeElement);

    return this.popupRef;
  }

  destroyPopup(): void {
    if (this.popupRef) {
      // Remove from DOM
      const element = this.popupRef.location.nativeElement;
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }

      // Detach from application
      this._appRef.detachView(this.popupRef.hostView);

      // Destroy component
      this.popupRef.destroy();
      this.popupRef = null;
    }
  }

  openPopup(): void {
    if (this.isPopupOpen && this.popupRef) {
      return;
    }

    this.popupRef = this.createPopup();
    this.popupRef.instance.component = this;
    this.isPopupOpen = true;

    this.positionPopup();

    this.popupRef.instance.optionSelected.subscribe((option: DropdownOption) => {
      this.selectOption(option);
    });

    if (this.currentOptions.length === 0) {
      this.initOptions();
    }

    this.updatePopup();
  }

  updatePopup(): void {
    if (this.popupRef) {
      const minChars = this.minChars();
      this.popupRef.instance.options = this.currentOptions;
      this.popupRef.instance.minCharsValid = (this.displayValue() ?? '').length >= minChars;
      this.popupRef.instance.minChars = minChars;
      this.popupRef.instance.loading = this.loading;
      this.popupRef.instance.resetHighlight();
      this.popupRef.instance.optionTemplate = this.optionTemplate;
      // Reached from the search subscription and the debounce timer, neither of
      // which schedules a render on its own.
      this.popupRef.instance.cd.detectChanges();
    }
  }

  positionPopup(): void {
    if (!this.popupRef) {
      return;
    }

    const inputRect = this.inputElement?.nativeElement.getBoundingClientRect() ?? { top: 0, left: 0, bottom: 0, width: 0, height: 0 };
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.popupRef.instance.top.set(inputRect.bottom + scrollTop);
    this.popupRef.instance.left.set(inputRect.left + scrollLeft);
    this.popupRef.instance.width.set(inputRect.width);
  }

  closePopup(): void {
    if (!this.isPopupOpen) {
      return;
    }
    this.destroyPopup();
    this.isPopupOpen = false;

    const customValue = this.customValue();
    if (!customValue && !this.value()) {
      this.setDisplayValue(undefined);
    }
    this.onBlur();

    if (!this.displayValue) {
      this.currentOptions = [];
    }

    this.loading = false;
  }

  reset(): void {
    this.selectedOption.set(undefined);
    this.setDisplayValue(undefined);
    this.value.set(undefined);
    this.inputChange.emit(this.value());
  }
}
