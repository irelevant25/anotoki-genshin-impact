import { ApplicationRef, Component, ComponentRef, computed, ContentChild, createComponent, effect, EnvironmentInjector, inject, model, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { MultiselectPopupComponent } from './popup/multiselect-popup.component';
import { DropdownOption } from '../../services/options-helper.service';
import { SCROLL_POPUP, ScrollDirective, ScrollPopup } from '../../scroll.directive';
import { TranslationService } from '../../i18n/translation.service';

export type MultiselectOptionsType = DropdownOption[] | string[] | number[];

type Type = (string | number | boolean)[];

@Component({
  selector: 'app-multiselect',
  imports: [FormsModule, ScrollDirective],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: MultiselectComponent,
    },
    {
      provide: SCROLL_POPUP,
      useExisting: MultiselectComponent,
    },
  ],
})
export class MultiselectComponent extends AbstractInputComponent<Type> implements ScrollPopup {
  @ContentChild(TemplateRef) optionTemplate?: TemplateRef<any>;

  private readonly _i18n = inject(TranslationService);

  options = model<MultiselectOptionsType>([]);
  selectClass = model<string>('');
  maxDisplayItems = model<number>(3);
  selectAllEnabled = model<boolean>(true);
  selectedOptions = model<DropdownOption[]>([]);
  closeOnScroll = model<boolean>(true);
  /** Off by default so an existing field keeps showing the comma-separated list. */
  showBadges = model<boolean>(false);
  allowSearch = model<boolean>(false);

  computedOptions = computed(() => {
    const raw = this.options();
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((option) => {
      if (typeof option === 'object' && 'key' in option && 'value' in option) {
        return option as DropdownOption;
      } else if (typeof option === 'string' || typeof option === 'number') {
        return { key: option, value: option };
      }
      return { key: option, value: String(option) };
    });
  });

  displayValue = computed(() => {
    const selected = this.selectedOptions();
    const maxDisplay = this.maxDisplayItems();

    if (this.showBadges()) {
      const count = selected.length;
      return count === 0
        ? this._i18n.t('multiselect.selected.none')
        : this._i18n.t(this._pluralKey('multiselect.selected', count), { count });
    }

    if (selected.length === 0) {
      return '';
    }

    if (selected.length <= maxDisplay) {
      return selected.map((opt) => opt.value).join(', ');
    }

    const displayed = selected
      .slice(0, maxDisplay)
      .map((opt) => opt.value)
      .join(', ');
    const remaining = selected.length - maxDisplay;
    return `${displayed} ${this._i18n.t(this._pluralKey('multiselect.more', remaining), { count: remaining })}`;
  });

  /**
   * Which plural form a language wants for `count`, as a key suffix.
   *
   * The count is deliberately not compared against numbers here: Slovak wants
   * separate wording for two-to-four where English does not, and a language
   * added later will want something neither of them does. `Intl.PluralRules`
   * already knows every language's own buckets. A form with no string of its
   * own falls back to `other`, which every language has.
   */
  private _pluralKey(base: string, count: number): string {
    const form = new Intl.PluralRules(this._i18n.language()).select(count);
    return this._i18n.has(`${base}.${form}`) ? `${base}.${form}` : `${base}.other`;
  }

  isAllSelected = computed(() => {
    const options = this.computedOptions();
    const selected = this.selectedOptions();
    return options.length > 0 && selected.length === options.length;
  });

  isPopupOpen: boolean = false;
  popupRef: ComponentRef<MultiselectPopupComponent> | null = null;

  constructor(
    private _appRef: ApplicationRef,
    private _injector: EnvironmentInjector,
  ) {
    super();

    // Sync selectedOptions with value
    effect(() => {
      const value = this.value();
      const options = this.computedOptions();

      if (Array.isArray(value) && value.length > 0) {
        const selected = options.filter((opt) => value.includes(opt.key));
        if (JSON.stringify(selected) !== JSON.stringify(this.selectedOptions())) {
          this.selectedOptions.set(selected);
        }
      } else {
        this.selectedOptions.set([]);
      }
    });

    effect(() => {
      this.options();
      this.afterValueChange?.(this.value());
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.closePopup();
  }

  toggleOption(option: DropdownOption): void {
    const current = [...this.selectedOptions()];
    const index = current.findIndex((opt) => opt.key === option.key);

    if (index === -1) {
      current.push(option);
    } else {
      current.splice(index, 1);
    }

    this.selectedOptions.set(current);
    this.updateValue();
  }

  removeSelectedOption(index: number): void {
    const current = [...this.selectedOptions()];
    current.splice(index, 1);
    this.selectedOptions.set(current);
    this.updateValue();
  }

  selectAll(): void {
    this.selectedOptions.set([...this.computedOptions()]);
    this.updateValue();
  }

  clearAll(): void {
    this.selectedOptions.set([]);
    this.updateValue();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearAll();
    } else {
      this.selectAll();
    }
  }

  isOptionSelected(option: DropdownOption): boolean {
    return this.selectedOptions().some((opt) => opt.key === option.key);
  }

  private updateValue(): void {
    const keys = this.selectedOptions().map((opt) => opt.key);
    this.value.set(keys);
    this.inputChange.emit(this.value());
    this.emitValidationState();
  }

  override onBlur(event?: Event): void {
    if (!this.isPopupOpen) {
      super.onBlur(event);
    }
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
      case ' ':
        event.preventDefault();
        this.popupRef.instance.toggleHighlighted();
        break;
      case 'Escape':
        event.preventDefault();
        this.closePopup();
        this.inputElement?.nativeElement.blur();
        break;
    }
  }

  // Popup functions

  togglePopup(): void {
    if (this.isPopupOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  createPopup(): ComponentRef<MultiselectPopupComponent> {
    this.popupRef = createComponent(MultiselectPopupComponent, {
      environmentInjector: this._injector,
    });

    this._appRef.attachView(this.popupRef.hostView);
    document.body.appendChild(this.popupRef.location.nativeElement);

    return this.popupRef;
  }

  destroyPopup(): void {
    if (this.popupRef) {
      const element = this.popupRef.location.nativeElement;
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }

      this._appRef.detachView(this.popupRef.hostView);
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
    this.popupRef.instance.allowSearch = this.allowSearch();
    this.isPopupOpen = true;

    this.positionPopup();

    this.popupRef.instance.optionToggled.subscribe((option: DropdownOption) => {
      this.toggleOption(option);
      this.updatePopup();
    });

    this.popupRef.instance.selectAllToggled.subscribe(() => {
      this.toggleSelectAll();
      this.updatePopup();
    });

    this.popupRef.instance.onClose.subscribe(() => {
      this.closePopup();
    });

    this.updatePopup();
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

  updatePopup(): void {
    if (this.popupRef) {
      this.popupRef.instance.options = this.computedOptions();
      this.popupRef.instance.selectedOptions = this.selectedOptions();
      this.popupRef.instance.selectAllEnabled = this.selectAllEnabled();
      this.popupRef.instance.isAllSelected = this.isAllSelected();
      this.popupRef.instance.optionTemplate = this.optionTemplate;
    }
  }

  closePopup(): void {
    if (!this.isPopupOpen) {
      return;
    }
    this.destroyPopup();
    this.isPopupOpen = false;
    this.onBlur();
  }
}
