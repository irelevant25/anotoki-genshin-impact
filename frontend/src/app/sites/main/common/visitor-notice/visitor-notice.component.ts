import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { SiteSettingsService } from '../../../../shared/local-lib/services/site-settings.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

/**
 * What somebody playing without signing in is told about their games: the
 * server keeps them for this browser, and deletes them after `keep_days`
 * without a visit - the server's own number, relayed in the public settings,
 * so the line never promises longer than the sweep keeps them
 * (api/visitors.php). Signing in keeps them for good: the move brings them
 * into the account (VisitorKey).
 *
 * Where it goes is the page's to decide: the Profile shows it to every
 * visitor, the Daily page and the quizzes hub only once the server holds
 * something of theirs (`VisitorKey.active()`) - before that there is nothing
 * to lose.
 */
@Component({
  selector: 'app-visitor-notice',
  templateUrl: './visitor-notice.component.html',
  styleUrls: ['./visitor-notice.component.scss'],
  imports: [ButtonComponent, TranslatePipe],
})
export class VisitorNoticeComponent {
  private readonly _security = inject(SecurityService);
  private readonly _notifications = inject(NotificationService);
  private readonly _i18n = inject(TranslationService);

  /** Days a visitor's games are kept after their last visit - the server's number. */
  readonly keepDays = inject(SiteSettingsService).visitorKeepDays;

  /** Whether there is an IAM to send anybody to. */
  readonly available = this._security.available;

  signIn(): void {
    // Back to this page; the sign-in waits for the saves on their way first.
    this._security.login().catch(() => this._notifications.showError(this._i18n.t('auth.startFailed')));
  }
}
