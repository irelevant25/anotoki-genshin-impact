import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteSettingsService } from './shared/local-lib/services/site-settings.service';
import { NotSetUpComponent } from './shared/not-set-up/not-set-up.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, NotSetUpComponent],
  providers: [],
})
export class AppComponent {
  /**
   * Whether the API said this installation has no config yet. Above both
   * sites rather than in either: the admin panel cannot work without it any
   * more than the public site can.
   */
  readonly notSetUp = inject(SiteSettingsService).notSetUp;
}
