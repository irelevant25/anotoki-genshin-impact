import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { RouteNotice, SiteSettingsService } from '../../../../shared/local-lib/services/site-settings.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

/**
 * What an admin is told about the page they are standing on.
 *
 * An admin is exempt from both switches, which is what makes them usable -
 * whoever switched a page off has to be able to look at it. The cost of being
 * exempt is that the site looks entirely normal: a page that is off is
 * indistinguishable from a page that is on, and it is easy to switch something
 * off, look at it, and conclude that nothing happened.
 *
 * So this sits above the page and says which of the two it is. Nobody else
 * ever sees it, because nobody else is on the page: they got a page that is
 * not there, or the link was never in their menu.
 *
 * In the shell rather than on each page, following the router. Twenty-seven
 * pages would otherwise each need to remember to ask, and the ones that forgot
 * would be exactly the ones somebody had just switched off.
 */
@Component({
  selector: 'app-route-notice',
  templateUrl: './route-notice.component.html',
  styleUrls: ['./route-notice.component.scss'],
  imports: [TranslatePipe],
})
export class RouteNoticeComponent {
  private readonly _settings = inject(SiteSettingsService);
  private readonly _i18n = inject(TranslationService);
  private readonly _router = inject(Router);

  /** The URL being looked at, without its query string. */
  private readonly _path = signal(this._clean(this._router.url));

  readonly notice = computed<RouteNotice>(() => this._settings.noticeFor(this._path()));

  /** Who the page is drawn for, in words, for the restricted case. */
  readonly audience = computed(() => {
    const notice = this.notice();

    return notice?.kind === 'restricted' ? this._i18n.t('route.audience.' + notice.visibility) : '';
  });

  constructor() {
    this._router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this._path.set(this._clean(event.urlAfterRedirects));
    });
  }

  private _clean(url: string): string {
    return url.split('?')[0].split('#')[0].replace(/(.)\/+$/, '$1');
  }
}
