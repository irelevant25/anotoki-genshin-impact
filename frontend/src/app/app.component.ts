import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteGateComponent, SitePagesDirective } from '@anotoki/lib/migrations';

/**
 * Both sites - the public one and the admin panel - behind the one gate every
 * anotoki site has (@anotoki/lib/migrations, configured in
 * shared/site-status.ts): while the site is ready, they show; while a
 * database update waits, everybody reads that the site is being updated and
 * this site's ADMIN is shown the way to the Migrations page, which still
 * works; while it is not set up or not answering, a page says so. Above both
 * sites rather than in either: neither can work while the API is not ready.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, SiteGateComponent, SitePagesDirective],
  providers: [],
})
export class AppComponent {}
