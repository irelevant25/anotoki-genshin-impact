import { Component, inject, signal } from '@angular/core';
import { SessionEntry } from '../../../../../api';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { NotificationService } from '../../../../../shared/local-lib/components/notification/notification.service';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

/**
 * Where this account is signed in, and where it has been.
 *
 * The list is the account's own history: every session it has opened, live
 * ones and finished ones together, with how each was signed in. The point is
 * not the record-keeping - it is that somebody can look at it, not recognise
 * something, and end it from here.
 *
 * Finished sessions are shown rather than hidden. "Signed in from somewhere I
 * do not know, three days ago" is the thing worth noticing, and it is only
 * noticeable if the row is still there.
 */
@Component({
  selector: 'app-profile-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  imports: [ButtonComponent, AppDatePipe, TranslatePipe],
})
export class ProfileSessionsComponent {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);
  private readonly _notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly sessions = signal<SessionEntry[]>([]);

  /** Failed sign-ins since the last successful one - see the API for why. */
  readonly failedAttempts = signal(0);

  constructor() {
    this._load();
  }

  /** True when there is anything for "sign out everywhere else" to end. */
  hasOthers(): boolean {
    return this.sessions().some((session) => session.active && !session.current);
  }

  /**
   * The browser, roughly.
   *
   * A user agent is a long string designed to be lied to, and every one of them
   * claims to be Mozilla. This picks out the part a person would recognise and
   * gives up gracefully - it labels a row, and nothing depends on it.
   */
  browser(session: SessionEntry): string {
    const agent = session.user_agent ?? '';

    if (!agent) {
      return this._i18n.t('profile.sessions.unknownBrowser');
    }

    const name = ['Edg', 'OPR', 'Firefox', 'Chrome', 'Safari'].find((candidate) => agent.includes(candidate));
    const platform = ['Android', 'iPhone', 'iPad', 'Windows', 'Macintosh', 'Linux'].find((candidate) => agent.includes(candidate));

    const label = { Edg: 'Edge', OPR: 'Opera' }[name ?? ''] ?? name;

    if (!label && !platform) {
      return agent.length > 40 ? `${agent.slice(0, 37)}...` : agent;
    }

    return [label, platform].filter(Boolean).join(' · ');
  }

  /** How it was signed in, and if it has ended, why. */
  statusKey(session: SessionEntry): string {
    if (session.current) {
      return 'profile.sessions.thisDevice';
    }

    if (session.active) {
      return 'profile.sessions.active';
    }

    return session.revoked_reason ? `profile.sessions.ended.${session.revoked_reason}` : 'profile.sessions.expired';
  }

  endSession(session: SessionEntry): void {
    this.loading.set(true);
    this._security.endSession(session.id).subscribe({
      next: () => {
        this._notifications.showSuccess(this._i18n.t('profile.sessions.endedOne'));
        this._load();
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  endOthers(): void {
    this.loading.set(true);
    this._security.endOtherSessions().subscribe({
      next: () => {
        this._notifications.showSuccess(this._i18n.t('profile.sessions.endedOthers'));
        this._load();
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  private _load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this._security.getSessions().subscribe({
      next: (list) => {
        this.sessions.set(list.sessions);
        this.failedAttempts.set(list.failed_since_last_login);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}
