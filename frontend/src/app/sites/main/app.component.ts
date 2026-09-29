import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './common/header/header.component';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { FooterComponent } from './common/footer/footer.component';
import { AnnouncementComponent } from './common/announcement/announcement.component';
import { MaintenanceComponent } from './common/maintenance/maintenance.component';
import { RouteNoticeComponent } from './common/route-notice/route-notice.component';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, NotificationComponent, FooterComponent, AnnouncementComponent, MaintenanceComponent, RouteNoticeComponent],
  providers: [],
})
export class AppComponent {
  private readonly _settings = inject(SiteSettingsService);

  /**
   * Whether to draw the closed sign instead of the site.
   *
   * Admins are exempt, which is what makes maintenance mode usable: whoever
   * closed the site has to be able to look at it while it is closed, and to
   * open it again. It follows the session rather than reading it once, so the
   * sign goes up again the moment an admin signs out in another tab.
   */
  readonly closed = computed(() => this._settings.maintenance() && !this._settings.isAdmin());

  constructor() {
    document.body.style.backgroundImage = `url('assets/backgrounds/Fontaine.avif')`;
  }
}
