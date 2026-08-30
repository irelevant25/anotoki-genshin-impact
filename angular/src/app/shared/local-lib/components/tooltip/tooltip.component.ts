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
  standalone = model<boolean>(false);
  isHovered = model<boolean>(false);
  hoverDelay = model<number>(500);
  timeout: any;

  constructor(private readonly _element: ElementRef) {
    super();
  }

  ngAfterViewInit(): void {
    if (this.standalone()) {
      this.targetHTMLElement()?.addEventListener('mouseenter', () => {
        this.timeout = setTimeout(() => {
          this.isHovered.set(true);
          this.positionTooltip();
        }, this.hoverDelay());
      });
      this.targetHTMLElement()?.addEventListener('mouseleave', () => {
        clearTimeout(this.timeout);
        this.isHovered.set(false);
      });
      // this.targetHTMLElement()?.addEventListener('mousemove', () => {
      //   if (this.isHovered()) {
      //     this.positionTooltip();
      //   }
      // });
    } else {
      this.positionTooltip();
    }
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

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let top: number;
    let left: number;

    switch (this.tooltipPosition()) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
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
    // tooltipElement.style.visibility = 'visible';
  }
}
