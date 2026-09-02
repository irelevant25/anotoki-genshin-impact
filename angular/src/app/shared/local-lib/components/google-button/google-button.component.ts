import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { GoogleSignInService } from '../../services/google-sign-in.service';

/**
 * Google's own sign-in button, or nothing at all.
 *
 * Nothing at all is the ordinary case rather than a failure: a deployment with
 * no client id configured has Google switched off, and so does one where the
 * script could not be fetched. Everything around this stays usable either way,
 * which is why it draws no placeholder and reports no error - there is nothing
 * for a visitor to do about it.
 *
 * What comes out is the id token Google handed the browser. It means nothing
 * until the server has checked it, and the server checks that it was minted
 * for this site before it means anything at all.
 */
@Component({
  selector: 'app-google-button',
  template: '<div class="google-button" [class.google-button-ready]="ready()" #host></div>',
  styles: [
    `
      .google-button {
        display: none;
      }

      /* Shown only once Google has actually drawn something into it. */
      .google-button-ready {
        display: block;
        min-height: 40px;
      }
    `,
  ],
})
export class GoogleButtonComponent implements OnInit, OnDestroy {
  private readonly _google = inject(GoogleSignInService);

  /** The id token, once somebody has signed in with it. */
  readonly credential = output<string>();

  readonly ready = signal(false);

  @ViewChild('host', { static: true }) private _host!: ElementRef<HTMLElement>;

  private readonly _onCredential = (credential: string) => this.credential.emit(credential);

  ngOnInit(): void {
    this._google.clientId().subscribe(async (clientId) => {
      if (!clientId) {
        return;
      }

      this.ready.set(await this._google.renderButton(this._host.nativeElement, clientId, this._onCredential));
    });
  }

  ngOnDestroy(): void {
    // The callback is global to the page, so a button that has gone away has
    // to stop owning it - see GoogleSignInService.
    this._google.release(this._onCredential);
  }
}
