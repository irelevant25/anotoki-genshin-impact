import { Directive, effect, ElementRef, inject, input } from '@angular/core';

/**
 * Some entities have no icon column - materials, banners and backgrounds resolve
 * their art from the name instead, and the asset dump uses two conventions:
 *
 *   "Dandelion Seed"      -> assets/materials/Dandelion Seed.avif
 *   "Adventurer's EXP"    -> assets/materials/ADVENTURERS_EXP.png
 *
 * The browser cannot stat the folder, so the candidates are tried in order and
 * the next one is used whenever the current src fails to load.
 */
export const DEFAULT_ASSET_FOLDER = 'materials';

/** Apostrophes, quotes and hyphens are dropped; every other run becomes one underscore. */
export function materialUpperSnake(name: string): string {
  return name
    .replace(/['’"-]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function materialIconCandidates(name: string | number | undefined | null, folder = DEFAULT_ASSET_FOLDER): string[] {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    return [];
  }
  const root = `assets/${folder}`;
  return [`${root}/${trimmed}.avif`, `${root}/${trimmed}.png`, `${root}/${materialUpperSnake(trimmed)}.png`];
}

@Directive({
  selector: 'img[appMaterialIcon]',
  host: { '(error)': 'onError()' },
})
export class MaterialIconDirective {
  appMaterialIcon = input<string | number | undefined | null>();
  /** Folder under assets/ to look in; materials by default. */
  appAssetFolder = input<string>(DEFAULT_ASSET_FOLDER);

  private readonly _element = inject(ElementRef<HTMLImageElement>);
  private _candidates: string[] = [];
  private _index = 0;

  constructor() {
    effect(() => {
      this._candidates = materialIconCandidates(this.appMaterialIcon(), this.appAssetFolder());
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
