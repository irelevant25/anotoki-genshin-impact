import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './common/header/header.component';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { FooterComponent } from './common/footer/footer.component';
import { ForcedPasswordChangeService } from './common/footer/forced-password-change.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, NotificationComponent, FooterComponent],
  providers: [],
})
export class AppComponent {
  /**
   * Watched from the root because the root outlives every page.
   *
   * An account still on a password an admin chose is stopped here, on whatever
   * page it happens to be on, rather than only on the way in - a session that
   * was already signed in when the flag was set never signs in again.
   */
  private readonly _forcedPasswordChange = inject(ForcedPasswordChangeService);

  constructor() {
    document.body.style.backgroundImage = `url('assets/backgrounds/Fontaine.avif')`;
    this._forcedPasswordChange.watch();
  }
}
