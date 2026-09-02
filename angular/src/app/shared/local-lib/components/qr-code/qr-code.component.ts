import { Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import qrcode from 'qrcode-generator';

/**
 * One QR code, as inline SVG.
 *
 * SVG rather than a canvas so it scales with the layout and prints properly,
 * and inline so there is no image request for something computed locally.
 *
 * The only thing this is used for is an otpauth:// URI, which is short enough
 * that the encoder picks a small version on its own - version 0 means "the
 * smallest that fits". Error correction is M, the usual compromise: readable
 * with a smudge on it without doubling the size.
 */
@Component({
  selector: 'app-qr-code',
  template: '<div class="qr" [innerHTML]="svg()"></div>',
  styles: [
    `
      .qr {
        line-height: 0;
      }

      /* The library sizes the tag itself; this makes it fit its box instead. */
      .qr ::ng-deep svg {
        width: 100%;
        height: auto;
        max-width: 220px;
        background: #ffffff;
      }
    `,
  ],
})
export class QrCodeComponent {
  readonly value = input.required<string>();

  private readonly _sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() => {
    const code = qrcode(0, 'M');
    code.addData(this.value());
    code.make();

    // The markup is generated here from a value this component was given, and
    // never contains anything from a response - bypassing the sanitiser is
    // safe because there is no untrusted input in it. Angular strips SVG
    // otherwise, which would leave an empty box.
    return this._sanitizer.bypassSecurityTrustHtml(code.createSvgTag({ cellSize: 4, margin: 2 }));
  });
}
