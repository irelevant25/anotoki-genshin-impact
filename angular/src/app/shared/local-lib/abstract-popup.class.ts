import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, model, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractInputComponent } from './abstract-input.class';

@Component({ template: '' })
export abstract class AbstractPopupComponent<T> {
  @ViewChild('mainElement') mainElement?: ElementRef;

  @Input() component?: AbstractInputComponent<any>;
  @Input() optionTemplate?: TemplateRef<any>;

  top = model<number>(0);
  left = model<number>(0);
  width = model<number>(200);

  @Output() optionSelected = new EventEmitter<T | undefined>();
  @Output() onClose = new EventEmitter<void>();

  readonly cd = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.positionPopup();
  }

  selectOption(option?: T): void {
    this.optionSelected.emit(option);
  }

  positionPopup(): void {
    if (!this.component?.inputElement) {
      console.error('No input element found.');
      return;
    }

    const inputRect = this.component.inputElement.nativeElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Get viewport height
    const viewportHeight = window.innerHeight;

    // Calculate available space below and above the input
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // Calculate more accurate popup height estimation
    const maxAllowedHeight = 200; // From CSS max-height
    const popupHeight: number = this.mainElement?.nativeElement.offsetHeight ?? 0;
    const estimatedPopupHeight = Math.min(popupHeight, maxAllowedHeight);

    // Determine optimal position
    const shouldPositionAbove = spaceBelow < estimatedPopupHeight && spaceAbove >= estimatedPopupHeight;

    if (shouldPositionAbove) {
      // Position above the input
      this.top.set(inputRect.top + scrollTop - estimatedPopupHeight);
    } else {
      // Position below the input (default behavior)
      this.top.set(inputRect.bottom + scrollTop);
    }

    this.left.set(inputRect.left + scrollLeft);
    this.width.set(inputRect.width);
    this.cd.detectChanges();
  }
}
