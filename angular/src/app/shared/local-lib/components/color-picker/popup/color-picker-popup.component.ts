import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPopupComponent } from '../../../abstract-popup.class';
import { ClickOutsideDirective } from '../../../click-outside.directive';

export interface HsvaColor {
  h: number; // 0–360
  s: number; // 0–100
  v: number; // 0–100
  a: number; // 0–100
}

@Component({
  selector: 'app-color-picker-popup',
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './color-picker-popup.component.html',
  styleUrls: ['./color-picker-popup.component.scss'],
})
export class ColorPickerPopupComponent extends AbstractPopupComponent<string> {
  // HSVA state
  hsva: HsvaColor = { h: 0, s: 100, v: 100, a: 100 };

  // Hex input string (with #)
  hexInput: string = '#ff0000';
  hexError: boolean = false;

  // Default color for reset (also used to initialize the picker)
  _defaultHex: string = '#FFF';

  // Dragging state
  isDraggingGradient = false;
  isDraggingHue = false;
  isDraggingAlpha = false;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const initial = this.component?.value() as string | undefined;
    if (initial) {
      this.setFromHex(initial);
    }
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit(); // runs base positionPopup() first

    // Now the element is in the DOM — clamp against real dimensions
    const el = this.mainElement?.nativeElement as HTMLElement | undefined;
    if (!el) {
      return;
    }

    const MARGIN = 8;
    const popupWidth = el.offsetWidth;
    const popupHeight = el.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = this.top();
    let left = this.left();

    // Clamp horizontal
    left = Math.min(left, scrollLeft + viewportWidth - popupWidth - MARGIN);
    left = Math.max(left, scrollLeft + MARGIN);

    // If popup overflows bottom, flip above the swatch
    const inputRect = this.component?.inputElement?.nativeElement.getBoundingClientRect();
    if (inputRect && top - scrollTop + popupHeight > viewportHeight - MARGIN) {
      top = inputRect.top + scrollTop - popupHeight - 4;
    }
    // Don't go above the viewport either
    top = Math.max(top, scrollTop + MARGIN);

    this.top.set(top);
    this.left.set(left);
    this.cd.detectChanges();
  }

  // ─── Computed helpers ─────────────────────────────────────────────────────

  get hueColor(): string {
    return `hsl(${this.hsva.h}, 100%, 50%)`;
  }

  get currentHex(): string {
    return this.hsvaToHex(this.hsva);
  }

  get gradientThumbLeft(): string {
    return `${this.hsva.s}%`;
  }

  get gradientThumbTop(): string {
    return `${100 - this.hsva.v}%`;
  }

  get hueThumbLeft(): string {
    return `${(this.hsva.h / 360) * 100}%`;
  }

  get alphaThumbLeft(): string {
    return `${this.hsva.a}%`;
  }

  get alphaGradient(): string {
    const rgb = this.hsvaToRgb({ ...this.hsva, a: 100 });
    return `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgb(${rgb.r},${rgb.g},${rgb.b}))`;
  }

  // ─── Gradient (SV) picker ─────────────────────────────────────────────────

  onGradientMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingGradient = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateGradientFromRect(event.clientX, event.clientY, rect);
    this.startGlobalDrag('gradient', rect);
  }

  onGradientTouchStart(event: TouchEvent): void {
    this.isDraggingGradient = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = event.touches[0];
    this.updateGradientFromRect(touch.clientX, touch.clientY, rect);
    this.startGlobalTouchDrag('gradient', rect);
  }

  private updateGradientFromRect(clientX: number, clientY: number, rect: DOMRect): void {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    this.hsva = { ...this.hsva, s: (x / rect.width) * 100, v: 100 - (y / rect.height) * 100 };
    this.syncHex();
  }

  // ─── Hue slider ───────────────────────────────────────────────────────────

  onHueMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingHue = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateHueFromRect(event.clientX, rect);
    this.startGlobalDrag('hue', rect);
  }

  onHueTouchStart(event: TouchEvent): void {
    this.isDraggingHue = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateHueFromRect(event.touches[0].clientX, rect);
    this.startGlobalTouchDrag('hue', rect);
  }

  private updateHueFromRect(clientX: number, rect: DOMRect): void {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    this.hsva = { ...this.hsva, h: (x / rect.width) * 360 };
    this.syncHex();
  }

  // ─── Alpha slider ─────────────────────────────────────────────────────────

  onAlphaMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingAlpha = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateAlphaFromRect(event.clientX, rect);
    this.startGlobalDrag('alpha', rect);
  }

  onAlphaTouchStart(event: TouchEvent): void {
    this.isDraggingAlpha = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateAlphaFromRect(event.touches[0].clientX, rect);
    this.startGlobalTouchDrag('alpha', rect);
  }

  private updateAlphaFromRect(clientX: number, rect: DOMRect): void {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    this.hsva = { ...this.hsva, a: (x / rect.width) * 100 };
    this.syncHex();
  }

  // ─── Global drag handling ─────────────────────────────────────────────────

  private startGlobalDrag(type: 'gradient' | 'hue' | 'alpha', rect: DOMRect): void {
    const onMove = (e: MouseEvent): void => {
      if (type === 'gradient') {
        this.updateGradientFromRect(e.clientX, e.clientY, rect);
      }
      if (type === 'hue') {
        this.updateHueFromRect(e.clientX, rect);
      }
      if (type === 'alpha') {
        this.updateAlphaFromRect(e.clientX, rect);
      }
    };
    const onUp = (): void => {
      this.isDraggingGradient = false;
      this.isDraggingHue = false;
      this.isDraggingAlpha = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private startGlobalTouchDrag(type: 'gradient' | 'hue' | 'alpha', rect: DOMRect): void {
    const onMove = (e: TouchEvent): void => {
      const touch = e.touches[0];
      if (type === 'gradient') {
        this.updateGradientFromRect(touch.clientX, touch.clientY, rect);
      }
      if (type === 'hue') {
        this.updateHueFromRect(touch.clientX, rect);
      }
      if (type === 'alpha') {
        this.updateAlphaFromRect(touch.clientX, rect);
      }
    };
    const onEnd = (): void => {
      this.isDraggingGradient = false;
      this.isDraggingHue = false;
      this.isDraggingAlpha = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // ─── Hex input ────────────────────────────────────────────────────────────

  onHexInput(value: string): void {
    this.hexInput = value;
    const hex = value.startsWith('#') ? value : `#${value}`;
    if (this.isValidHex(hex)) {
      this.hexError = false;
      this.setFromHex(hex);
    } else {
      this.hexError = true;
    }
  }

  // ─── Preset swatches ──────────────────────────────────────────────────────

  presetColors: string[] = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722',
    '#795548',
    '#9e9e9e',
    '#607d8b',
    '#000000',
    '#ffffff',
  ];

  selectPreset(hex: string): void {
    this.setFromHex(hex);
    this.emitColor();
  }

  // ─── Reset / Apply / close ────────────────────────────────────────────────────────

  reset(): void {
    this.setFromHex(this._defaultHex);
    this.emitColor();
    this.optionSelected.emit(this._defaultHex);
    this.onClose.emit();
  }

  apply(): void {
    this.emitColor();
    const hex = this.currentHex;
    this.optionSelected.emit(hex);
    this.onClose.emit();
  }

  clickOutside(): void {
    this.onClose.emit();
  }

  private emitColor(): void {
    const hex = this.currentHex;
    // this.colorSelected.emit(hex);
    this.optionHovered.emit(hex);
    // this.optionSelected.emit(hex as any);
  }

  // ─── Color conversion helpers ─────────────────────────────────────────────

  private syncHex(): void {
    this.hexInput = this.hsvaToHex(this.hsva);
    this.hexError = false;
    this.emitColor();
  }

  setFromHex(hex: string): void {
    const hsva = this.hexToHsva(hex);
    if (hsva) {
      this.hsva = hsva;
      this.hexInput = hex.length === 7 || hex.length === 9 ? hex : hex;
    }
  }

  private isValidHex(hex: string): boolean {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex);
  }

  private hexToHsva(hex: string): HsvaColor | null {
    let r: number,
      g: number,
      b: number,
      a = 100;
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else if (clean.length === 8) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
      a = Math.round((parseInt(clean.substring(6, 8), 16) / 255) * 100);
    } else {
      return null;
    }
    return this.rgbaToHsva(r, g, b, a);
  }

  private rgbaToHsva(r: number, g: number, b: number, a: number): HsvaColor {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (max !== min) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return { h: h * 360, s: s * 100, v: v * 100, a };
  }

  hsvaToRgb(hsva: HsvaColor): { r: number; g: number; b: number } {
    const h = hsva.h / 360,
      s = hsva.s / 100,
      v = hsva.v / 100;
    let r = 0,
      g = 0,
      b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  private hsvaToHex(hsva: HsvaColor): string {
    const { r, g, b } = this.hsvaToRgb(hsva);
    const toHex = (n: number): string => n.toString(16).padStart(2, '0');
    if (hsva.a < 100) {
      const alpha = Math.round((hsva.a / 100) * 255);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`;
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
