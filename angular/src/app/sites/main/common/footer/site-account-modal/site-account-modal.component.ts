import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';
import { AbstractDetailComponent } from '../../../../../shared/local-lib/abstract-detail.class';
import { Observable, of } from 'rxjs';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";
import { LoaderComponent } from "../../../../../shared/local-lib/components/loader/loader.component";
import { GoogleButtonComponent } from '../../../../../shared/local-lib/components/google-button/google-button.component';
import { Theme, ThemeToggleService } from '../../../../../shared/local-lib/theme-toggle/theme-toggle.service';
import { ModalService } from '../../../../../shared/local-lib/components/modal/modal.service';
import { SiteLoginModalComponent } from '../site-login-modal/site-login-modal.component';
import { SiteRegisterModalComponent } from '../site-register-modal/site-register-modal.component';
import { SiteSetPasswordModalComponent } from '../site-set-password-modal/site-set-password-modal.component';
import { SiteChangePasswordModalComponent } from '../site-change-password-modal/site-change-password-modal.component';
import { SiteSessionsModalComponent } from '../site-sessions-modal/site-sessions-modal.component';
import { SiteTwoFactorModalComponent } from '../site-two-factor-modal/site-two-factor-modal.component';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { DateFormatChoice, DateFormatService, TimeFormatChoice } from '../../../../../shared/local-lib/i18n/date-format.service';
import { SessionEntry } from '../../../../../api';

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent, LoaderComponent, GoogleButtonComponent, TranslatePipe, AppDatePipe],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractDetailComponent<any> {
  /**
   * A signal rather than a field.
   *
   * The app is zoneless, so an assignment on its own repaints nothing - and
   * connecting Google or turning the password off has to be visible in this
   * modal the moment it happens, not after the next time something else
   * causes a render.
   */
  readonly userData = signal<UserInfo | null>(null);

  /** What went wrong with the last thing pressed in the sign-in methods list. */
  readonly refusal = signal<string | null>(null);

  /**
   * The session this panel is being read from, and how many are live.
   *
   * The whole list used to be a section on the profile page, among the quiz
   * statistics. It belongs here: whether somebody has played has no bearing on
   * where their account is signed in. What is shown here is the one session
   * they are sitting in - the rest is a click away, because a panel is not a
   * place for a table of thirty rows.
   */
  readonly currentSession = signal<SessionEntry | null>(null);
  readonly liveSessions = signal(0);

  /** The site's own appearance; the admin panel keeps a separate one. */
  readonly theme = inject(ThemeToggleService);
  private readonly _modals = inject(ModalService);
  /** Labels are keys - the chooser is translated like everything else. */
  readonly themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'theme.light' },
    { value: 'dark', label: 'theme.dark' },
    { value: 'auto', label: 'theme.auto' },
  ];

  /** The language the site is read in; the admin panel stays English. */
  readonly i18n = inject(TranslationService);

  /** How dates and times are written for this reader. */
  readonly formats = inject(DateFormatService);

  /**
   * The orders on offer, labelled by an example rather than by a pattern.
   *
   * "1.3.2026" tells you what you are choosing; "d.M.yyyy" tells you only if
   * you already know. The label behind the tooltip says which is which for
   * anybody who wants the name.
   */
  readonly dateOptions: { value: DateFormatChoice; label: string }[] = [
    { value: 'auto', label: 'account.formats.auto' },
    { value: 'dmy_dot', label: 'account.formats.dmyDot' },
    { value: 'dmy_slash', label: 'account.formats.dmySlash' },
    { value: 'mdy_slash', label: 'account.formats.mdySlash' },
    { value: 'ymd_dash', label: 'account.formats.ymdDash' },
  ];

  readonly timeOptions: { value: TimeFormatChoice; label: string }[] = [
    { value: 'auto', label: 'account.formats.auto' },
    { value: '24', label: 'account.formats.clock24' },
    { value: '12', label: 'account.formats.clock12' },
  ];

  constructor(private readonly _securityService: SecurityService) {
    super();
    // Null when signed out, which is a state this modal now renders.
    this._securityService.currentUserData$.subscribe((data) => {
      this.userData.set(data);
      data ? this._loadSessions() : this.currentSession.set(null);
    });
  }

  /**
   * Reads the session list for the one row this panel shows.
   *
   * Quietly on failure: the sessions row simply does not appear. Nothing else
   * in the panel depends on it, and an error banner about a summary line would
   * be louder than the line itself.
   */
  private _loadSessions(): void {
    this._securityService.getSessions().subscribe({
      next: (list) => {
        this.currentSession.set(list.sessions.find((session) => session.current) ?? null);
        this.liveSessions.set(list.sessions.filter((session) => session.active).length);
      },
      error: () => this.currentSession.set(null),
    });
  }

  /**
   * The browser this session is in, roughly.
   *
   * Same reading as the sessions modal does, and for the same reason: a user
   * agent is a long string designed to be lied to, and every one of them claims
   * to be Mozilla. It labels a row and nothing depends on it.
   */
  browser(session: SessionEntry): string {
    const agent = session.user_agent ?? '';

    if (!agent) {
      return this.i18n.t('account.sessions.unknownBrowser');
    }

    const name = ['Edg', 'OPR', 'Firefox', 'Chrome', 'Safari'].find((candidate) => agent.includes(candidate));
    const platform = ['Android', 'iPhone', 'iPad', 'Windows', 'Macintosh', 'Linux'].find((candidate) => agent.includes(candidate));

    const label = { Edg: 'Edge', OPR: 'Opera' }[name ?? ''] ?? name;

    if (!label && !platform) {
      return agent.length > 40 ? `${agent.slice(0, 37)}...` : agent;
    }

    return [label, platform].filter(Boolean).join(' · ');
  }

  /** Every session this account has, in a modal big enough to hold them. */
  sessions(): void {
    const modal = this._modals.open(SiteSessionsModalComponent, { size: '4', scrollable: true });
    // Ending one from in there changes the count out here.
    modal.closed.subscribe(() => this._loadSessions());
  }

  protected override loadData$(): Observable<any> {
    return of(null);
  }

  // ── The ways into this account ─────────────────────────────────────────────
  //
  // An account must always keep at least one, so each of these is offered only
  // when it would leave one behind. The server enforces the same rule; these
  // conditions are so the button is not there to be pressed rather than the
  // only thing standing between an account and being locked out of itself.

  /** Password sign-in can be turned off only if Google can still get in. */
  canDisablePassword(): boolean {
    const user = this.userData();
    return !!user?.has_password && !!user?.password_login_enabled && !!user?.google_connected;
  }

  /** And disconnecting Google needs a password that is actually accepted. */
  canDisconnectGoogle(): boolean {
    const user = this.userData();
    return !!user?.google_connected && !!user?.has_password && !!user?.password_login_enabled;
  }

  connectGoogle(credential: string): void {
    this._run(this._securityService.connectGoogle(credential), 'account.methods.googleConnected');
  }

  disconnectGoogle(): void {
    this._run(this._securityService.disconnectGoogle(), 'account.methods.googleDisconnected');
  }

  setPasswordLoginEnabled(enabled: boolean): void {
    this._run(
      this._securityService.setPasswordLoginEnabled(enabled),
      enabled ? 'account.methods.passwordEnabled' : 'account.methods.passwordDisabled',
    );
  }

  /** Setting a first password is a form, so it gets a modal of its own. */
  setPassword(): void {
    this._modals.open(SiteSetPasswordModalComponent, { size: '1' });
  }

  /**
   * And so is changing one that exists, which asks for the old one first.
   *
   * A different modal rather than the same one with a hidden field: the two
   * prove different things. Setting a first password is proved by being signed
   * in at all, since that took Google or a code from the account's own mailbox;
   * changing one is not, because a session left open on a shared machine is
   * exactly where somebody else would like to change a password.
   */
  changePassword(): void {
    this._modals.open(SiteChangePasswordModalComponent, { size: '1' });
  }

  /**
   * Two-factor, on or off - the modal reads the account and works out which.
   *
   * Off is deliberately the default for this site: being locked out of a game
   * reference is worse than somebody getting into one, so it is offered rather
   * than pressed.
   */
  twoFactor(): void {
    this._modals.open(SiteTwoFactorModalComponent, { size: '1' });
  }

  private _run(request: Observable<unknown>, successKey: string): void {
    this.refusal.set(null);
    this.loading.set(true);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(this.i18n.t(successKey));
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        // These refusals are prose meant to be read - "set a password first, or
        // you would not be able to sign in again" - so they are shown as they
        // came rather than flattened into one message.
        this.refusal.set(error?.error?.error ?? this.i18n.t('account.methods.failed'));
      },
    });
  }

  logout(): void {
    this.loading.set(true);
    this._securityService.logout((isSuccess) => {
      this.loading.set(false);
      if (isSuccess) {
        this.closeModal(true);
      }
    });
  }

  /** Signing in happens in its own modal; this one is the way to it. */
  login(): void {
    this.closeModal();
    this._modals.open(SiteLoginModalComponent, { size: '1' });
  }

  /**
   * And so does making an account.
   *
   * A button of its own rather than only the link under the sign-in form:
   * somebody who has never been here before is not looking for a form they
   * cannot fill in.
   */
  register(): void {
    this.closeModal();
    this._modals.open(SiteRegisterModalComponent, { size: '1' });
  }

  setLanguage(code: string): void {
    void this.i18n.setLanguage(code);
  }

  setDateFormat(choice: DateFormatChoice): void {
    // Shown before the server answers. The setting is a preference, not a
    // fact about the account, and a chooser that lags a round trip behind
    // feels broken - the reload behind it puts it right if the save fails.
    this.formats.dateChoice.set(choice);
    this._run(this._securityService.setDateFormats({ date_format: choice === 'auto' ? null : choice }), 'account.formats.saved');
  }

  setTimeFormat(choice: TimeFormatChoice): void {
    this.formats.timeChoice.set(choice);
    this._run(this._securityService.setDateFormats({ time_format: choice === 'auto' ? null : choice }), 'account.formats.saved');
  }

  /** Ask for a code again from every browser this account has remembered. */
  forgetDevices(): void {
    this._run(this._securityService.forgetTrustedDevices(), 'account.devices.forgotten');
  }

  setTheme(theme: Theme): void {
    // Always the site's own setting, even though this modal can be opened from
    // a page the admin panel shares.
    this.theme.setThemeFor('main', theme);
  }

  toAdmin(): void {
    window.open('/admin', '_blank');
  }
}
