import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';
import { SiteSettings } from '@anotoki/lib/site-settings';
import { TranslatePipe } from '@anotoki/lib/translations';
import { GuideIconComponent } from '../guide/guide-icon.component';
import { GuideId } from '../guide/guide-catalog';
import { DailyProgressService } from '../../features/quizzes/shared/daily-progress.service';

interface TopMenuItem {
  readonly id: string;
  readonly title: string;
  /** Carries the count of unfinished dailies. */
  readonly daily?: boolean;
  /** Which guide the question mark opens, where there is one. */
  readonly guide?: GuideId;
}

/** A menu item, plus whether an admin is the only one seeing it, and where it leads from the page open now. */
interface DrawnMenuItem extends TopMenuItem {
  readonly hidden: boolean;
  /** The address the item's link goes to - the home page from the section's own page (see menuItems). */
  readonly target: string;
  /** `page` on the section's own page, `true` on a page inside it, null anywhere else. */
  readonly current: 'page' | 'true' | null;
}

/**
 * The top menu.
 *
 * The guide text used to live here, as three English template literals copied
 * across from the old site's data file. They are translations now, behind the
 * question marks, so this is a list of links again.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [RouterModule, TranslatePipe, GuideIconComponent],
  providers: [],
})
export class HeaderComponent {
  /** Read by the count on the Daily item; see DailyProgressService. */
  readonly daily = inject(DailyProgressService);

  /** Page access (@anotoki/lib/site-settings): which pages this reader may have, and what an admin is told of each. */
  private readonly _settings = inject(SiteSettings);
  private readonly _router = inject(Router);

  private readonly _allItems: readonly TopMenuItem[] = [
    { id: 'daily', title: 'nav.daily', daily: true, guide: 'daily' },
    { id: 'quizzes', title: 'nav.quizzes', guide: 'quizzes' },
    { id: 'games', title: 'nav.games', guide: 'games' },
    { id: 'database', title: 'nav.database' },
    { id: 'profile', title: 'nav.profile' },
  ];

  /** The path's segments of the page open now (`/quizzes/pixelate`: quizzes, pixelate), as the router last settled on it. */
  private readonly _segments = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this._currentSegments()),
    ),
    { initialValue: this._currentSegments() },
  );

  /**
   * The menu as this reader gets it.
   *
   * A page switched off or set to a kind of reader this one is not simply is
   * not here: a link that leads to a not-found page is worse than no link,
   * because it says the page is there and then contradicts itself. The router
   * refuses the same pages, so a bookmark behaves the way the menu does.
   *
   * An admin keeps every item and gets a mark on the ones nobody else can see.
   * They are exempt from the switches, which means the menu would otherwise
   * look exactly the same to them whatever they had just switched off.
   *
   * An item opens and closes its section (the owner's decision of 2026-10-21):
   * on the section's own page (`/quizzes`) it closes it, back to the home page;
   * on a page inside it (`/quizzes/pixelate`) it goes to the section's page; from
   * anywhere else it opens the section. The link's address is where it goes, so
   * hovering it says so, and the item of the section open now is marked as the
   * current one (`aria-current`: the page itself, or a page inside it).
   */
  readonly menuItems = computed<DrawnMenuItem[]>(() => {
    const [section, ...inside] = this._segments();
    return this._allItems
      .filter((item) => this._settings.mayNavigate(`/${item.id}`))
      .map((item) => {
        const open = section === item.id;
        const onItsPage = open && inside.length === 0;
        return {
          ...item,
          hidden: this._settings.noticeFor(`/${item.id}`) !== null,
          target: onItsPage ? '/' : `/${item.id}`,
          current: onItsPage ? 'page' : open ? 'true' : null,
        };
      });
  });

  private _currentSegments(): string[] {
    return this._router.parseUrl(this._router.url).root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  }
}
