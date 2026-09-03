import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { GuideIconComponent } from '../guide/guide-icon.component';
import { GuideId } from '../guide/guide-catalog';

interface TopMenuItem {
  readonly id: string;
  readonly title: string;
  /** Shows the unfinished-daily marker. */
  readonly badge?: boolean;
  /** Which guide the question mark opens, where there is one. */
  readonly guide?: GuideId;
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
  readonly menuItems: readonly TopMenuItem[] = [
    { id: 'daily', title: 'nav.daily', badge: true, guide: 'daily' },
    { id: 'quizzes', title: 'nav.quizzes', guide: 'quizzes' },
    { id: 'games', title: 'nav.games', guide: 'games' },
    { id: 'database', title: 'nav.database' },
    { id: 'profile', title: 'nav.profile' },
  ];
}
