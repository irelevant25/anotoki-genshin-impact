import { Component, computed, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './common/header/header.component';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { FooterComponent } from './common/footer/footer.component';
import { AnnouncementComponent } from './common/announcement/announcement.component';
import { MaintenanceComponent } from './common/maintenance/maintenance.component';
import { RouteNoticeComponent } from './common/route-notice/route-notice.component';
import { SignInRequiredComponent } from './common/sign-in-required/sign-in-required.component';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { VisitorKey } from '../../shared/local-lib/services/visitor-key.service';
import { NotificationService } from '../../shared/local-lib/components/notification/notification.service';
import { TranslationService } from '@anotoki/lib/translations';
import { QuizProgressService } from './features/quizzes/shared/quiz-progress.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, NotificationComponent, FooterComponent, AnnouncementComponent, MaintenanceComponent, RouteNoticeComponent, SignInRequiredComponent],
  providers: [],
})
export class AppComponent {
  private readonly _settings = inject(SiteSettingsService);
  private readonly _security = inject(SecurityService);
  private readonly _visitorKey = inject(VisitorKey);
  private readonly _progress = inject(QuizProgressService);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);

  /**
   * Whether to draw the closed sign instead of the site.
   *
   * Admins are exempt, which is what makes maintenance mode usable: whoever
   * closed the site has to be able to look at it while it is closed, and to
   * open it again. It follows the session rather than reading it once, so the
   * sign goes up again the moment an admin signs out in another tab.
   */
  readonly closed = computed(() => this._settings.maintenance() && !this._settings.isAdmin());

  /**
   * Whether to draw the sign-in card instead of the site: the IAM wants
   * everybody signed in here, and this reader is not.
   *
   * Normally only for a moment - the app initializer has already sent them to
   * sign in - and for longer where going again by itself would not help: a
   * sign-in that came back without working, a session this site's API refuses,
   * a browser that would not start it. Followed
   * rather than read once, so a sign-out in another tab puts the card up here
   * too. The closed sign comes first: maintenance outranks it, as on the API.
   */
  readonly signInFirst = computed(() => this._settings.loginRequired() && !this._security.isLoggedIn());

  constructor() {
    document.body.style.backgroundImage = `url('assets/backgrounds/Fontaine.avif')`;

    // What happened to the games of somebody playing without signing in, said
    // here, once, whichever page it happened on. The services only keep the
    // facts (VisitorKey, QuizProgressService); the words are the shell's.

    // A sign-in brought this browser's visitor into the account.
    effect(() => {
      const moved = this._visitorKey.moved();
      if (moved) {
        untracked(() => this._sayMoved(moved.games.moved > 0 || moved.results > 0, moved.games.kept));
      }
    });

    // A person's first load carried the games this browser kept by itself
    // (from before the server kept visitors, or while it could not) into the
    // account. Into a visitor it is no news: the games are where they were.
    effect(() => {
      const carried = this._progress.carried();
      if (carried && untracked(this._progress.owner).startsWith('person:')) {
        untracked(() => this._sayMoved(true, carried.kept));
      }
    });

    // The server no longer knew this browser's key: kept too long unseen, or
    // moved into an account in another browser's sign-in. Said once.
    effect(() => {
      if (this._visitorKey.lost()) {
        untracked(() => {
          this._notifications.showInfo(this._i18n.t('visitor.lost', { days: this._settings.visitorKeepDays() }));
          this._visitorKey.lost.set(false);
        });
      }
    });

    // Why this page load stopped keeping the games on the server: once each.
    effect(() => {
      const refusal = this._progress.refusal();
      if (refusal) {
        untracked(() => this._notifications.showWarning(this._i18n.t(refusal === 'full' ? 'visitor.full' : 'visitor.busy')));
      }
    });

    // A language chosen in the account panel that the anotoki account would
    // not take (the IAM out of reach, the sign-in ended): the page stays in it
    // for the visit, and says it was not saved - once, whenever the panel was
    // closed meanwhile. A language the IAM does not offer is no such refusal
    // (@anotoki/lib/translations calls it quiet): it stays this site's own.
    effect(() => {
      if (this._i18n.languageNotSaved()) {
        untracked(() => {
          this._notifications.showError(this._i18n.t('account.formats.failed'));
          this._i18n.clearLanguageNotSaved();
        });
      }
    });
  }

  /** `moved`: something came into the account; `kept`: games where the account's own stayed instead. */
  private _sayMoved(moved: boolean, kept: number): void {
    const words = [moved ? this._i18n.t('visitor.moved') : '', kept > 0 ? this._i18n.t('visitor.kept') : ''];
    const message = words.filter(Boolean).join(' ');
    if (message) {
      this._notifications.showSuccess(message);
    }
  }
}
