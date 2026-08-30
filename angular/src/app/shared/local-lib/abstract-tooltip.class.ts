import { ApplicationRef, ComponentRef, createComponent, Directive, ElementRef, EnvironmentInjector, inject, model, output, ViewChild } from '@angular/core';
import { TooltipComponent, TooltipPosition } from './components/tooltip/tooltip.component';
import { AbstractRolesComponent } from './abstract-roles.class';

@Directive()
export abstract class AbstractTooltipComponent extends AbstractRolesComponent {
  @ViewChild('tooltipElement') tooltipElement?: ElementRef<HTMLLabelElement>;

  tooltipText = model<string>('');
  tooltipPosition = model<TooltipPosition>('top');
  isHovered = model<boolean>(false);
  initialized = output<boolean>();

  private _tooltipPopupRef: ComponentRef<TooltipComponent> | null = null;

  private readonly _appRef$ = inject(ApplicationRef);
  private readonly _injector$ = inject(EnvironmentInjector);
  private readonly _element$ = inject(ElementRef);

  ngAfterViewInit(): void {
    this.initialized.emit(true);
  }

  ngOnDestroy(): void {
    this.destroyTooltipPopup();
  }

  openTooltipPopup(htmlElement: HTMLElement = this._element$.nativeElement.children[0]): void {
    this._tooltipPopupRef = this.createTooltipPopup();
    this._tooltipPopupRef.instance.tooltipText.set(this.tooltipText());
    this._tooltipPopupRef.instance.tooltipPosition.set(this.tooltipPosition());
    this._tooltipPopupRef.instance.targetHTMLElement.set(htmlElement);
  }

  closeTooltipPopup(): void {
    this.destroyTooltipPopup();
  }

  mouseEnter(): void {
    this.isHovered.set(true);
    if (this.tooltipText()) {
      this.openTooltipPopup(this.tooltipElement?.nativeElement);
    }
  }

  mouseLeave(): void {
    this.isHovered.set(false);
    this.closeTooltipPopup();
  }

  private createTooltipPopup(): ComponentRef<TooltipComponent> {
    // Create component using createComponent
    this._tooltipPopupRef = createComponent(TooltipComponent, {
      environmentInjector: this._injector$,
    });

    // Attach to application
    this._appRef$.attachView(this._tooltipPopupRef.hostView);

    // Append to body
    document.body.appendChild(this._tooltipPopupRef.location.nativeElement);

    return this._tooltipPopupRef;
  }

  private destroyTooltipPopup(): void {
    if (this._tooltipPopupRef) {
      // Remove from DOM
      const element = this._tooltipPopupRef.location.nativeElement;
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }

      // Detach from application
      this._appRef$.detachView(this._tooltipPopupRef.hostView);

      // Destroy component
      this._tooltipPopupRef.destroy();
      this._tooltipPopupRef = null;
    }
  }
}
