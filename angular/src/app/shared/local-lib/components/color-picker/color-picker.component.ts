import { ApplicationRef, Component, ComponentRef, createComponent, EnvironmentInjector, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { ColorPickerPopupComponent } from './popup/color-picker-popup.component';

@Component({
  selector: 'app-color-picker',
  imports: [FormsModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: ColorPickerComponent,
    },
  ],
})
export class ColorPickerComponent extends AbstractInputComponent<string> {
  displayColorValue = model<boolean>(false);
  colorClass = model<string>();
  defaultValue = model<string>();
  allowNoColor = model<boolean>(true);

  previewColor = output<string | undefined>();
  closed = output<void>();
  opened = output<void>();

  isPopupOpen: boolean = false;
  popupRef: ComponentRef<ColorPickerPopupComponent> | null = null;

  constructor(
    private _appRef: ApplicationRef,
    private _injector: EnvironmentInjector,
  ) {
    super();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.closePopup();
  }

  // ─── Popup lifecycle ──────────────────────────────────────────────────────

  togglePopup(): void {
    if (this.isPopupOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  openPopup(): void {
    if (this.isPopupOpen) {
      return;
    }

    this.popupRef = createComponent(ColorPickerPopupComponent, {
      environmentInjector: this._injector,
    });

    this._appRef.attachView(this.popupRef.hostView);
    document.body.appendChild(this.popupRef.location.nativeElement);

    this.popupRef.instance.component = this;
    this.isPopupOpen = true;

    this.positionPopup();

    // Initialize popup with the current color value
    const currentValue = this.value() ?? this.defaultValue() ?? '';
    this.popupRef.instance.setFromHex(currentValue);
    this.popupRef.instance._defaultHex = this.defaultValue() ?? '';
    this.popupRef.instance.allowNoColor = this.allowNoColor();

    // Live-update the swatch as the user drags
    this.popupRef.instance.optionSelected.subscribe((hex?: string) => {
      this.value.set(hex ?? null);
      this.inputChange.emit(hex ?? null);
      this.emitValidationState();
    });

    this.popupRef.instance.optionHovered.subscribe((color?: string) => {
      this.previewColor.emit(color);
    });

    this.popupRef.instance.onClose.subscribe(() => {
      this.closePopup();
    });

    this.opened.emit();
  }

  positionPopup(): void {
    if (!this.popupRef) {
      return;
    }

    const rect = this.inputElement?.nativeElement.getBoundingClientRect() ?? { top: 0, left: 0, bottom: 0, width: 0, height: 0 };

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Set an initial position; the popup clamps itself in ngAfterViewInit
    this.popupRef.instance.top.set(rect.bottom + scrollTop + 4);
    this.popupRef.instance.left.set(rect.left + scrollLeft);
  }

  closePopup(): void {
    if (!this.isPopupOpen) {
      return;
    }

    if (this.popupRef) {
      const el = this.popupRef.location.nativeElement;
      el?.parentNode?.removeChild(el);
      this._appRef.detachView(this.popupRef.hostView);
      this.popupRef.destroy();
      this.popupRef = null;
    }

    this.isPopupOpen = false;
    this.onBlur();
    this.closed.emit();
  }

  // ─── Inherited overrides ──────────────────────────────────────────────────

  override onBlur(): void {
    if (!this.isPopupOpen) {
      super.onBlur();
    }
  }

  override onFocus(): void {
    // if (!this.isPopupOpen) {
    //   super.onFocus();
    // }
  }
}
