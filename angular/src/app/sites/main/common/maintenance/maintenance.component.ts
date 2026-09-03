import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SiteSettingsService, messageInLanguage } from '../../../../shared/local-lib/services/site-settings.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { StaffSignInComponent } from '../staff-sign-in/staff-sign-in.component';
import { STAFF_PATH } from '../../../../shared/routing-definition';

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
 * The sign-in offer appears only at /staff. It is the same form as everywhere
 * else and the API refuses everybody but an admin; keeping it off the page the
 * public lands on is so that a closed site does not show a door it will not
 * open.
 */
@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  imports: [StaffSignInComponent, TranslatePipe],
})
export class MaintenanceComponent {
  private readonly _settings = inject(SiteSettingsService);
  private readonly _i18n = inject(TranslationService);
  private readonly _router = inject(Router);

  /** Whether the address bar is on the staff path right now. */
  readonly onStaffPath = signal(this._isStaff(this._router.url));

  readonly message = computed(() => messageInLanguage(this._settings.maintenanceMessage(), this._i18n.language()));

  constructor() {
    // The router still runs while this is on screen - somebody can type /staff
    // into the address bar without reloading - so this follows it rather than
    // reading the URL once on the way in.
    this._router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.onStaffPath.set(this._isStaff(event.urlAfterRedirects));
    });
  }

  private _isStaff(url: string): boolean {
    return url.split('?')[0].replace(/\/+$/, '') === `/${STAFF_PATH}`;
  }
}
