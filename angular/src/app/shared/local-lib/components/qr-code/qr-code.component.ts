import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { encodeQr } from './qr-encoder';

/**
 * The quiet zone, in modules.
 *
 * Four is what the standard asks for, and it is not decoration: a scanner
 * finds the symbol by its border, and a QR pressed up against other content is
 * a QR that often will not read.
 */
const QUIET_ZONE = 4;

/**
 * One QR code, as inline SVG.
 *
 * SVG rather than a canvas so it scales with the layout and prints properly,
 * and inline so there is no image request for something computed locally.
 *
 * The dark modules are merged into horizontal runs rather than drawn one at a
 * time, which turns a few thousand rectangles into a few hundred.
 */
@Component({
  selector: 'app-qr-code',
  template: '<div class="qr" [innerHTML]="svg()"></div>',
  styles: [
    `
      .qr {
        line-height: 0;
      }

      .qr ::ng-deep svg {
        width: 100%;
        height: auto;
        max-width: 220px;
        /* Always light, whatever the page theme - a scanner expects dark on
           light, and an inverted QR is one many will not read. */
        background: #ffffff;
      }
    `,
  ],
})
export class QrCodeComponent {
  readonly value = input.required<string>();

  private readonly _sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() => {
    const modules = encodeQr(this.value());
    const size = modules.length + QUIET_ZONE * 2;
    const rects: string[] = [];

    modules.forEach((row, y) => {
      let runStart: number | null = null;

      // One rectangle per run of dark modules, closed off at the row's end.
      for (let x = 0; x <= row.length; x++) {
        const dark = x < row.length && row[x];

        if (dark && runStart === null) {
          runStart = x;
        } else if (!dark && runStart !== null) {
          rects.push(`<rect x="${runStart + QUIET_ZONE}" y="${y + QUIET_ZONE}" width="${x - runStart}" height="1"/>`);
          runStart = null;
        }
      }
    });

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
      `<g fill="#000000">${rects.join('')}</g>` +
      `</svg>`;

    // The markup is built here out of numbers this component computed, and
    // never contains anything from a response - so there is no untrusted input
    // in it to sanitise. Angular strips SVG otherwise, leaving an empty box.
    return this._sanitizer.bypassSecurityTrustHtml(svg);
  });
}
