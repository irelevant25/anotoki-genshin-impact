import { Component, ElementRef, model, signal } from '@angular/core';
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

  /**
   * Order to fall back through when the asked-for side does not fit. The one
   * the caller asked for is tried first, wherever it appears in here.
   */
  private static readonly FALLBACK_ORDER: TooltipPosition[] = ['top', 'left', 'right', 'bottom'];

  /** Gap between the target and the tooltip, and the margin kept off the viewport edge. */
  private static readonly GAP = 8;
  private static readonly VIEWPORT_PADDING = 8;

  /**
   * The side actually used, which may not be the one that was asked for. The
   * arrow follows this rather than `tooltipPosition`, so it keeps pointing at
   * the target after a flip.
   */
  readonly resolvedPosition = signal<TooltipPosition>('top');

  private positionTooltip(): void {
    const targetElement = this.targetHTMLElement();
    const tooltipElement = this._element.nativeElement.children[0] as HTMLElement | undefined;

    if (!targetElement || !tooltipElement) {
      console.error('Missing target element or tooltip element');
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    const preferred = this.tooltipPosition();
    const order = [preferred, ...TooltipComponent.FALLBACK_ORDER.filter((position) => position !== preferred)];

    // First side that has room. If none does - a target in a corner of a small
    // window - the asked-for side is used and clamped, which is the old behaviour.
    const position = order.find((candidate) => this.fits(candidate, targetRect, tooltipRect)) ?? preferred;
    const coordinates = this.coordinatesFor(position, targetRect, tooltipRect);

    // Only the cross axis can still overflow; the main axis was just checked.
    const padding = TooltipComponent.VIEWPORT_PADDING;
    const left = Math.max(padding, Math.min(coordinates.left, window.innerWidth - tooltipRect.width - padding));
    const top = Math.max(padding, Math.min(coordinates.top, window.innerHeight - tooltipRect.height - padding));

    this.resolvedPosition.set(position);

    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;

    // Clamping moves the tooltip off centre; walk the arrow back the same
    // distance so it still points at the target instead of into empty space.
    const isVertical = position === 'top' || position === 'bottom';
    const targetCentre = isVertical ? targetRect.left + targetRect.width / 2 : targetRect.top + targetRect.height / 2;
    const tooltipStart = isVertical ? left : top;
    const tooltipLength = isVertical ? tooltipRect.width : tooltipRect.height;
    const arrowOffset = Math.max(padding, Math.min(targetCentre - tooltipStart, tooltipLength - padding));
    tooltipElement.style.setProperty('--tooltip-arrow-offset', `${arrowOffset}px`);

    // Make tooltip visible with opacity animation
    tooltipElement.style.opacity = '1';
  }

  /** Whether the side has room on the axis it pushes the tooltip along. */
  private fits(position: TooltipPosition, targetRect: DOMRect, tooltipRect: DOMRect): boolean {
    const padding = TooltipComponent.VIEWPORT_PADDING;
    const { top, left } = this.coordinatesFor(position, targetRect, tooltipRect);

    switch (position) {
      case 'top':
        return top >= padding;
      case 'bottom':
        return top + tooltipRect.height <= window.innerHeight - padding;
      case 'left':
        return left >= padding;
      case 'right':
        return left + tooltipRect.width <= window.innerWidth - padding;
    }
  }

  private coordinatesFor(position: TooltipPosition, targetRect: DOMRect, tooltipRect: DOMRect): { top: number; left: number } {
    const gap = TooltipComponent.GAP;

    switch (position) {
      case 'top':
        return {
          top: targetRect.top - tooltipRect.height - gap,
          left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        };
      case 'bottom':
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        };
      case 'left':
        return {
          top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
          left: targetRect.left - tooltipRect.width - gap,
        };
      case 'right':
        return {
          top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
          left: targetRect.right + gap,
        };
    }
  }
}
