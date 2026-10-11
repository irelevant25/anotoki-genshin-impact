import { Component, DestroyRef, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SiteGateComponent, SitePagesDirective } from '@anotoki/lib/migrations';
import { TranslationService } from '@anotoki/lib/translations';
import { filter } from 'rxjs/operators';
import { SecurityService } from './shared/local-lib/services/security.service';

/**
 * Both sites - the public one and the admin panel - behind the one gate every
 * anotoki site has (@anotoki/lib/migrations, configured in
 * shared/site-status.ts): while the site is ready, they show; while a
 * database update waits, everybody reads that the site is being updated and
 * this site's ADMIN is shown the way to the Migrations page, which still
 * works; while it is not set up or not answering, a page says so. Above both
 * sites rather than in either: neither can work while the API is not ready.
 *
 * It also tells the words where the reader is (@anotoki/lib/translations,
 * shared/site-translations.ts), which the translation service never asks the
 * router itself: after every navigation - the admin panel is English for its
 * staff, and a page that is behind asks for its words once more - and when
 * whether the reader is staff changes under a page that stays (a sign-in, a
 * role taken away): the admin panel that turns into the page saying it is not
 * theirs speaks their language again.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, SiteGateComponent, SitePagesDirective],
  providers: [],
})
export class AppComponent {
  private readonly _i18n = inject(TranslationService);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((event) => this._i18n.noteAddress(event.urlAfterRedirects));

    // Not the first time: the start and the first navigation have just read the address.
    const security = inject(SecurityService);
    let started = false;
    effect(() => {
      security.isStaff();
      if (started) {
        untracked(() => this._i18n.noteAddress(location.pathname + location.search));
      }
      started = true;
    });
  }
}
