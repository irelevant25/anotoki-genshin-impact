import { Directive, inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollPopup {
  popupRef: any;
  closeOnScroll(): boolean;
  closePopup(): void;
  positionPopup(): void;
}

export const SCROLL_POPUP = new InjectionToken<ScrollPopup>('SCROLL_POPUP');

@Directive({ selector: '[scroll]', standalone: true })
export class ScrollDirective {
  private _scrollListener?: (event: any) => void;
  private _popup = inject(SCROLL_POPUP);
  private _platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }
    this.addScrollListener();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }
    this.removeScrollListener();
  }

  private addScrollListener(): void {
    if (this._scrollListener) {
      this.removeScrollListener();
    }

    this._scrollListener = (event: any): void => {
      if (event.target === this._popup?.popupRef?.location.nativeElement.firstChild) {
        return;
      }
      if (this._popup?.closeOnScroll()) {
        // Close popup on scroll
        this._popup?.closePopup();
      } else {
        // Update popup position on scroll
        this._popup?.positionPopup();
      }
    };

    // Listen to scroll events on window and all scrollable parents
    window.addEventListener('scroll', this._scrollListener, true);
    window.addEventListener('resize', this._scrollListener, true);
  }

  private removeScrollListener(): void {
    if (this._scrollListener) {
      window.removeEventListener('scroll', this._scrollListener, true);
      window.removeEventListener('resize', this._scrollListener, true);
      this._scrollListener = undefined;
    }
  }
}
