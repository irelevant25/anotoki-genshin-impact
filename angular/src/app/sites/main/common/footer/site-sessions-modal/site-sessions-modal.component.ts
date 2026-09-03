import { Component, computed, inject, signal } from '@angular/core';
import { SessionEntry } from '../../../../../api';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

/**
 * Where this account is signed in, and where it has been.
 *
 * Every session it has opened, live ones and finished ones together, with how
 * each was signed in. The point is not the record-keeping - it is that
 * somebody can look at it, not recognise something, and end it from here.
 *
 * Finished sessions are shown rather than hidden. "Signed in from somewhere I
 * do not know, three days ago" is the thing worth noticing, and it is only
 * noticeable if the row is still there.
 *
 * This was a section on the profile page, in among the quiz statistics. It
 * belongs with the account: whether anybody has played has no bearing on where
 * their account is signed in, and this is the part with a consequence. The
 * account panel shows the one session being read from and opens this for the
 * rest, which is also why this is a table now - a list of two is a list, and a
 * list of thirty is a table.
 */
@Component({
  selector: 'app-site-sessions-modal',
  templateUrl: './site-sessions-modal.component.html',
  styleUrls: ['./site-sessions-modal.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent, AppDatePipe, TranslatePipe],
})
export class SiteSessionsModalComponent extends AbstractModalComponent {
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  readonly busy = signal(true);
  readonly failed = signal(false);
  readonly sessions = signal<SessionEntry[]>([]);

  /**
   * Whether anything has been drawn yet.
   *
   * The loader stands in for the table only the first time. Ending a session
   * re-reads the list, and taking the table off screen to say so makes the row
   * that was just ended flicker away along with every other row - the thing
   * somebody is looking at while they decide whether the right one went.
   */
  readonly everLoaded = signal(false);

  /** Failed sign-ins since the last successful one - see the API for why. */
  readonly failedAttempts = signal(0);

  /** Which row the "end this" button is waiting for confirmation on. */
  readonly endConfirm = signal<number | null>(null);

  readonly liveCount = computed(() => this.sessions().filter((session) => session.active).length);

  /** True when there is anything for "sign out everywhere else" to end. */
  readonly hasOthers = computed(() => this.sessions().some((session) => session.active && !session.current));

  constructor() {
    super();
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this.failed.set(false);

    this._security.getSessions().subscribe({
      next: (list) => {
        this.sessions.set(list.sessions);
        this.failedAttempts.set(list.failed_since_last_login);
        this.everLoaded.set(true);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
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
      return this._i18n.t('account.sessions.unknownBrowser');
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
      return 'account.sessions.thisDevice';
    }

    if (session.active) {
      return 'account.sessions.active';
    }

    return session.revoked_reason ? `account.sessions.ended.${session.revoked_reason}` : 'account.sessions.expired';
  }

  askToEnd(id: number): void {
    this.endConfirm.set(id);
  }

  cancelEnd(): void {
    this.endConfirm.set(null);
  }

  endSession(session: SessionEntry): void {
    this.busy.set(true);
    this.endConfirm.set(null);

    this._security.endSession(session.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this._i18n.t('account.sessions.endedOne'));
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  endOthers(): void {
    this.busy.set(true);

    this._security.endOtherSessions().subscribe({
      next: () => {
        this.notificationService.showSuccess(this._i18n.t('account.sessions.endedOthers'));
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }
}
