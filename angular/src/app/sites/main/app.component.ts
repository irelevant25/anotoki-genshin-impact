import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './common/header/header.component';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { FooterComponent } from './common/footer/footer.component';
import { AnnouncementComponent } from './common/announcement/announcement.component';
import { MaintenanceComponent } from './common/maintenance/maintenance.component';
import { RouteNoticeComponent } from './common/route-notice/route-notice.component';
import { ForcedPasswordChangeService } from './common/footer/forced-password-change.service';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, NotificationComponent, FooterComponent, AnnouncementComponent, MaintenanceComponent, RouteNoticeComponent],
  providers: [],
})
export class AppComponent {
  private readonly _security = inject(SecurityService);
  private readonly _settings = inject(SiteSettingsService);

  /**
   * Watched from the root because the root outlives every page.
   *
   * An account still on a password an admin chose is stopped here, on whatever
   * page it happens to be on, rather than only on the way in - a session that
   * was already signed in when the flag was set never signs in again.
   */
  private readonly _forcedPasswordChange = inject(ForcedPasswordChangeService);

  /** Whether an admin is reading. Followed rather than read once - see below. */
  private readonly _isAdmin = signal(false);

  /**
   * Whether to draw the closed sign instead of the site.
   *
   * Admins are exempt, which is what makes maintenance mode usable: whoever
   * closed the site has to be able to look at it while it is closed, and to
   * open it again. It follows the session rather than reading it once, so an
   * admin who signs in at /staff gets the site back without a reload.
   */
  readonly closed = computed(() => this._settings.maintenance() && !this._isAdmin());

  constructor() {
    document.body.style.backgroundImage = `url('assets/backgrounds/Fontaine.avif')`;
    this._forcedPasswordChange.watch();

    this._security.currentUserData$.subscribe((user) => {
      this._isAdmin.set((user?.roles ?? '').toUpperCase() === 'ADMIN');
    });
  }
}
