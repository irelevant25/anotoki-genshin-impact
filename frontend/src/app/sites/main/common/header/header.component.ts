import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { GuideIconComponent } from '../guide/guide-icon.component';
import { GuideId } from '../guide/guide-catalog';
import { DailyProgressService } from '../../features/quizzes/shared/daily-progress.service';
import { SiteSettingsService } from '../../../../shared/local-lib/services/site-settings.service';

interface TopMenuItem {
  readonly id: string;
  readonly title: string;
  /** Carries the count of unfinished dailies. */
  readonly daily?: boolean;
  /** Which guide the question mark opens, where there is one. */
  readonly guide?: GuideId;
}

/** A menu item, plus whether an admin is the only one seeing it. */
interface DrawnMenuItem extends TopMenuItem {
  readonly hidden: boolean;
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

  private readonly _settings = inject(SiteSettingsService);

  private readonly _allItems: readonly TopMenuItem[] = [
    { id: 'daily', title: 'nav.daily', daily: true, guide: 'daily' },
    { id: 'quizzes', title: 'nav.quizzes', guide: 'quizzes' },
    { id: 'games', title: 'nav.games', guide: 'games' },
    { id: 'database', title: 'nav.database' },
    { id: 'profile', title: 'nav.profile' },
  ];

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
   */
  readonly menuItems = computed<DrawnMenuItem[]>(() =>
    this._allItems
      .filter((item) => this._settings.mayNavigate('/' + item.id))
      .map((item) => ({ ...item, hidden: this._settings.noticeFor('/' + item.id) !== null })),
  );
}
