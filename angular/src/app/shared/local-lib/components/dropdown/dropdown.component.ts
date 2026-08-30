import { ApplicationRef, Component, ComponentRef, computed, ContentChild, createComponent, effect, EnvironmentInjector, model, output, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownPopupComponent } from './popup/dropdown-popup.component';
import { DropdownOption } from '../../services/options-helper.service';
import { SCROLL_POPUP, ScrollDirective, ScrollPopup } from '../../scroll.directive';

export type DropdownOptionsType = DropdownOption[] | string[] | number[];

type Type = string | number | boolean;

@Component({
  selector: 'app-dropdown',
  imports: [FormsModule, ScrollDirective],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: DropdownComponent,
    },
    {
      provide: SCROLL_POPUP,
      useExisting: DropdownComponent,
    },
  ],
})
export class DropdownComponent extends AbstractInputComponent<Type> implements ScrollPopup {
  @ContentChild(TemplateRef) optionTemplate?: TemplateRef<any>;

  options = model<DropdownOptionsType>([]);
  emptyOption = model<boolean>(false);
  selectClass = model<string>('');
  selectedOption = model<DropdownOption | undefined>(undefined);
  closeOnScroll = model<boolean>(true);
  prefix = model<string | undefined>(undefined);
  suffix = model<string | undefined>(undefined);
  emptyOptionText = model<string | undefined>(undefined);
  forceOptionWhenEmpty = model<boolean>(false);

  hoveredOption = output<DropdownOption | undefined>();
  closed = output<void>();
  opened = output<void>();

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
  computedOption = computed(() => {
    const options = this.computedOptions();
    const value = this.value();
    const selectedOption = this.selectedOption();
    return selectedOption ?? options.find((option) => option.key == value);
  });
  contentLength = computed(() => {
    const options = this.computedOptions();
    const inputLength = this.value()?.toString().length ?? 0;
    const optionLength = options.reduce((longest, option) => Math.max(longest, option.value.toString().length), 0);
    return Math.max(inputLength, optionLength);
  });
  isPopupOpen = model<boolean>(false);
  popupRef: ComponentRef<DropdownPopupComponent> | null = null;

  constructor(
    private _appRef: ApplicationRef,
    private _injector: EnvironmentInjector,
  ) {
    super();
    effect(() => {
      this.options();
      this.afterValueChange?.(this.value());
    });

    effect(() => {
      this.emptyOption();
      this.afterValueChange?.(this.value());
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.closePopup();
  }

  selectOption(option?: DropdownOption): void {
    this.value.set(option?.key);
    this.inputChange.emit(this.value());
    this.emitValidationState();
    this.closePopup();
  }

  override afterValueChange(value?: Type | null): void {
    const options = this.computedOptions();
    if (!this.emptyOption() && options.length > 0 && !options.some((option) => option.key == value)) {
      this.value.set(options[0]?.key.toString());
    } else {
      this.selectedOption.set(this.computedOption());
    }
  }

  override onBlur(event?: Event): void {
    if (!this.isPopupOpen()) {
      super.onBlur(event);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isPopupOpen() || !this.popupRef) {
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
      default:
        if (event.key.length === 1) {
          this.popupRef?.instance?.scrollToChar(event.key);
        }
        break;
    }
  }

  // popup functions

  togglePopup(): void {
    if (this.isPopupOpen()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  createPopup(): ComponentRef<DropdownPopupComponent> {
    this.popupRef = createComponent(DropdownPopupComponent, {
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
    if (this.isPopupOpen() && this.popupRef) {
      return;
    }

    this.popupRef = this.createPopup();
    this.popupRef.instance.component = this;
    this.isPopupOpen.set(true);

    this.positionPopup();

    this.popupRef.instance.optionSelected.subscribe((option?: DropdownOption) => {
      this.selectOption(option);
    });

    this.popupRef.instance.optionHovered.subscribe((option?: DropdownOption) => {
      this.hoveredOption.emit(option);
    });

    this.popupRef.instance.onClose.subscribe(() => {
      this.closePopup();
    });

    this.updatePopup();
    this.opened.emit();
  }

  updatePopup(): void {
    if (this.popupRef) {
      this.popupRef.instance.options = this.computedOptions();
      this.popupRef.instance.prefix = this.prefix();
      this.popupRef.instance.suffix = this.suffix();
      this.popupRef.instance.emptyOptionText = this.emptyOptionText();
      this.popupRef.instance.emptyOption = this.emptyOption();
      this.popupRef.instance.resetHighlight();
      this.popupRef.instance.optionTemplate = this.optionTemplate;
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
    // this.popupRef.instance.width.set(inputRect.width);
  }

  closePopup(): void {
    if (!this.isPopupOpen()) {
      return;
    }
    this.destroyPopup();
    this.isPopupOpen.set(false);
    this.onBlur();
    this.closed.emit();
  }
}
