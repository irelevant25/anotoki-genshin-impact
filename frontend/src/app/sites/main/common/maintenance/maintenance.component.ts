import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SiteSettingsService, messageInLanguage } from '../../../../shared/local-lib/services/site-settings.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { StaffSignInComponent } from '../staff-sign-in/staff-sign-in.component';
import { SignInFailureComponent } from '../sign-in-failure/sign-in-failure.component';
import { AUTH_CALLBACK_PATH, STAFF_PATH } from '../../../../shared/routing-definition';

/**
 * What the site is while it is closed.
 *
 * Drawn instead of the header, the page and the footer rather than over them:
 * a maintenance notice with a working menu behind it invites somebody to go
 * round it, and every link would answer 503 anyway.
 *
 * The words are the admin's, in the language being read, and fall back to the
 * built-in wording rather than to nothing - a blank closed sign is the one
 * thing worse than no closed sign.
 *
 * The sign-in offer appears only at /staff. It is the same sign-in as
 * everywhere else, at the IAM, and the API refuses everybody but an admin;
 * keeping it off the page the public lands on is so that a closed site does
 * not show a door it will not open. An admin whose sign-in came back without
 * working lands on the callback's address, and is told so there - otherwise
 * the closed sign would swallow the only explanation.
 */
@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  imports: [StaffSignInComponent, SignInFailureComponent, TranslatePipe],
})
export class MaintenanceComponent {
  private readonly _settings = inject(SiteSettingsService);
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);
  private readonly _router = inject(Router);

  /** The address bar's path right now, without the query. */
  private readonly _path = signal(this._pathOf(this._router.url));

  readonly onStaffPath = computed(() => this._path() === `/${STAFF_PATH}`);

  /** A sign-in that did not work, to be explained at the callback's address. */
  readonly signInFailure = computed(() => (this._path() === AUTH_CALLBACK_PATH ? this._security.signInFailure() : null));

  readonly message = computed(() => messageInLanguage(this._settings.maintenanceMessage(), this._i18n.language()));

  constructor() {
    // The router still runs while this is on screen - somebody can type /staff
    // into the address bar without reloading - so this follows it rather than
    // reading the URL once on the way in.
    this._router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this._path.set(this._pathOf(event.urlAfterRedirects));
    });
  }

  private _pathOf(url: string): string {
    return url.split('?')[0].replace(/\/+$/, '') || '/';
  }
}
