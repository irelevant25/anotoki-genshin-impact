import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

/** What became of the token in the address bar. */
type ConfirmState = 'working' | 'done' | 'failed' | 'missing';

/**
 * Where the confirmation link lands.
 *
 * The whole page is one request made on arrival, so there is nothing to press:
 * the account is confirmed and signed in by the time it has finished drawing.
 *
 * The token is taken out of the query string and never put back. It is a live
 * key to an account, and an address bar is copied into chat windows, pasted
 * into issues and read over shoulders - so once it has been spent the URL is
 * replaced with a clean one.
 */
@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['../account-landing.scss'],
  imports: [RouterModule, ButtonComponent, LoaderComponent, TranslatePipe],
})
export class ConfirmEmailComponent {
  private readonly _security = inject(SecurityService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  readonly state = signal<ConfirmState>('working');

  constructor() {
    const token = this._route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('missing');
      return;
    }

    this._security.confirmEmail(token).subscribe({
      next: () => {
        this.state.set('done');
        this._forgetToken();
      },
      // Expired, already used, or never issued - the API does not say which,
      // on purpose, and neither does this.
      error: () => {
        this.state.set('failed');
        this._forgetToken();
      },
    });
  }

  /** Drops the token from the address bar without adding a history entry. */
  private _forgetToken(): void {
    void this._router.navigate([], { relativeTo: this._route, queryParams: {}, replaceUrl: true });
  }
}
