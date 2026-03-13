import { Component, ElementRef, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractRolesComponent } from '../../abstract-roles.class';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-tooltip',
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
})
export class TooltipComponent extends AbstractRolesComponent {
  tooltipText = model<string>('');
  tooltipPosition = model<TooltipPosition>('top');
  targetHTMLElement = model<HTMLElement | null>(null);

  constructor(private readonly _element: ElementRef) {
    super();
  }

  ngAfterViewInit(): void {
    this.positionTooltip();
  }

  private positionTooltip(): void {
    if (!this.targetHTMLElement) {
      return;
    }

    const targetElement = this.targetHTMLElement();
    const tooltipElement = this._element.nativeElement.children[0];

    if (!targetElement || !tooltipElement) {
      console.error('Missing target element or tooltip element');
      return;
    }

    const buttonRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let top: number;
    let left: number;

    switch (this.tooltipPosition()) {
      case 'top':
        top = buttonRect.top - tooltipRect.height - 8;
        left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = buttonRect.bottom + 8;
        left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;
        left = buttonRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;
        left = buttonRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    // Apply positioning
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;

    // Make tooltip visible with opacity animation
    tooltipElement.style.opacity = '1';
    tooltipElement.style.visibility = 'visible';
  }
}
