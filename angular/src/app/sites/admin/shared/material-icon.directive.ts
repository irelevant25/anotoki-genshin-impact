import { Directive, effect, ElementRef, inject, input } from '@angular/core';

/**
 * Materials have no icon column - their art is resolved from the name, and the
 * asset dump uses two conventions:
 *
 *   "Dandelion Seed"      -> assets/materials/Dandelion Seed.avif
 *   "Adventurer's EXP"    -> assets/materials/ADVENTURERS_EXP.png
 *
 * The browser cannot stat the folder, so the candidates are tried in order and
 * the next one is used whenever the current src fails to load.
 */
export const MATERIAL_ASSET_ROOT = 'assets/materials';

/** Apostrophes, quotes and hyphens are dropped; every other run becomes one underscore. */
export function materialUpperSnake(name: string): string {
  return name
    .replace(/['’"-]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function materialIconCandidates(name: string | number | undefined | null): string[] {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    return [];
  }
  return [
    `${MATERIAL_ASSET_ROOT}/${trimmed}.avif`,
    `${MATERIAL_ASSET_ROOT}/${trimmed}.png`,
    `${MATERIAL_ASSET_ROOT}/${materialUpperSnake(trimmed)}.png`,
  ];
}

@Directive({
  selector: 'img[appMaterialIcon]',
  host: { '(error)': 'onError()' },
})
export class MaterialIconDirective {
  appMaterialIcon = input<string | number | undefined | null>();

  private readonly _element = inject(ElementRef<HTMLImageElement>);
  private _candidates: string[] = [];
  private _index = 0;

  constructor() {
    effect(() => {
      this._candidates = materialIconCandidates(this.appMaterialIcon());
      this._index = 0;
      this._apply();
    });
  }

  onError(): void {
    if (this._index < this._candidates.length - 1) {
      this._index++;
      this._apply();
    } else {
      // Nothing matched; leave the slot empty rather than showing a broken image.
      this._element.nativeElement.style.visibility = 'hidden';
    }
  }

  private _apply(): void {
    const image = this._element.nativeElement as HTMLImageElement;
    const next = this._candidates[this._index];
    image.style.visibility = next ? '' : 'hidden';
    if (next) {
      image.src = next;
    } else {
      image.removeAttribute('src');
    }
  }
}
