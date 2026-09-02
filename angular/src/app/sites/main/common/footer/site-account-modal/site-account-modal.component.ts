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
import { SiteSetPasswordModalComponent } from '../site-set-password-modal/site-set-password-modal.component';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent, LoaderComponent, GoogleButtonComponent, TranslatePipe],
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

  constructor(private readonly _securityService: SecurityService) {
    super();
    // Null when signed out, which is a state this modal now renders.
    this._securityService.currentUserData$.subscribe((data) => this.userData.set(data));
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

  setLanguage(code: string): void {
    void this.i18n.setLanguage(code);
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
