import { Component, computed, inject } from '@angular/core';
import { SiteSettingsService } from '../../../../../shared/local-lib/services/site-settings.service';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { AccountPreferences, type PreferenceSave } from '@anotoki/lib/auth';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { Theme, ThemeToggleService } from '../../../../../shared/local-lib/theme-toggle/theme-toggle.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { DateFormatChoice, DateFormatService, TimeFormatChoice } from '../../../../../shared/local-lib/i18n/date-format.service';

/**
 * Who is signed in, and how they like the site.
 *
 * The account itself - password, two-factor, Google, sessions - is the anotoki
 * IAM's, shared by every anotoki site, and this panel only links to the IAM's
 * page for it. The appearance, the dates, the clock and the language are the
 * account's too (AccountPreferences): chosen here, they are saved to it, and
 * every anotoki site follows them. Signed out, the appearance and the language
 * are this device's. What is this site's own is the name and role it knows the
 * reader by.
 */
@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent, TranslatePipe, AppDatePipe],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractModalComponent {
  readonly security = inject(SecurityService);

  /** One theme for the whole site, the admin panel included. */
  readonly theme = inject(ThemeToggleService);

  /** The language the site is read in; the admin panel stays English. */
  readonly i18n = inject(TranslationService);

  /** How dates and times are written for this reader. */
  readonly formats = inject(DateFormatService);

  /** Whether the choices here are the anotoki account's - see the template. */
  readonly account = inject(AccountPreferences);

  private readonly _settings = inject(SiteSettingsService);

  /** Null when signed out, which is a state this modal renders. */
  readonly user = this.security.currentUser;

  /** The role as a word rather than a code: ADMIN is "Administrator". */
  readonly roleKey = computed(() => `account.roleName.${(this.user()?.role ?? 'user').toLowerCase()}`);

  /**
   * Whether to offer signing in at all.
   *
   * Not while the site is closed - the API would refuse whoever arrived, and
   * a door that opens onto a closed sign reads as a fault. An admin still has
   * /staff. And not when the site could not learn where its IAM is.
   */
  readonly signInOffered = computed(() => this.security.available() && !this._settings.maintenance());

  /** Labels are keys - the chooser is translated like everything else. */
  readonly themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'theme.light' },
    { value: 'dark', label: 'theme.dark' },
    { value: 'auto', label: 'theme.auto' },
  ];

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

  /** Off to the IAM, coming back to the page this was opened on. */
  login(): void {
    this.security.login().catch(() => this._cannotStart());
  }

  /**
   * The same, opening on the IAM's registration form.
   *
   * A button of its own rather than a link on the IAM's sign-in page:
   * somebody who has never been here before is not looking for a form they
   * cannot fill in.
   */
  register(): void {
    this.security.register().catch(() => this._cannotStart());
  }

  /**
   * Signs out everywhere - the IAM ends its session, so every anotoki site
   * signs out with this one - and lands back on the home page.
   */
  logout(): void {
    this.loading.set(true);
    this.security.logout().catch(() => this.loading.set(false));
  }

  /**
   * Shown once its strings are here; saved to the account after, while the
   * account's choices apply (@anotoki/lib/translations: one save at a time,
   * the latest last). A refusal leaves the page in the chosen language for
   * the visit, and the public shell says so - but for a language the IAM
   * does not offer (`invalid_request`), which stays this site's own without a
   * word: nothing went wrong, the IAM just does not have it.
   */
  setLanguage(code: string): void {
    void this.i18n.setLanguage(code);
  }

  /**
   * Each is shown at once - a chooser that lags a round trip behind feels
   * broken - and saved to the account after. A refusal puts the account's
   * value back, and says so.
   */
  setDateFormat(choice: DateFormatChoice): void {
    void this.formats.chooseDateFormat(choice).then((result) => this._saidFormats(result));
  }

  setTimeFormat(choice: TimeFormatChoice): void {
    void this.formats.chooseTimeFormat(choice).then((result) => this._saidFormats(result));
  }

  setTheme(theme: Theme): void {
    void this.theme.setTheme(theme).then((result) => {
      if (result.outcome === 'refused') {
        this._notSaved();
      }
    });
  }

  toAdmin(): void {
    window.open('/admin', '_blank');
  }

  private _saidFormats(result: PreferenceSave): void {
    if (result.outcome === 'saved') {
      this.notificationService.showSuccess(this.i18n.t('account.formats.saved'));
    } else if (result.outcome === 'refused') {
      this._notSaved();
    }
  }

  private _notSaved(): void {
    this.notificationService.showError(this.i18n.t('account.formats.failed'));
  }

  private _cannotStart(): void {
    this.notificationService.showError(this.i18n.t('auth.startFailed'));
  }
}
