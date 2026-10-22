import { Component, computed, inject, signal } from '@angular/core';
import { SiteSettingsService } from '../../../../../shared/local-lib/services/site-settings.service';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { AccountPreferences } from '@anotoki/lib/auth';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { SelectComponent } from '@anotoki/lib/ui/forms';
import { SegmentedComponent, SegmentedOption } from '@anotoki/lib/ui/segmented';
import { Theme, ThemeToggleService } from '../../../../../shared/local-lib/theme-toggle/theme-toggle.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { SiteBackgroundsModalComponent } from '../site-backgrounds/site-backgrounds-modal.component';
import { wallpaperName } from '../site-backgrounds/wallpapers';

/**
 * Who is signed in, and how they like the site.
 *
 * The account itself - password, two-factor, Google, sessions - is the anotoki
 * IAM's, shared by every anotoki site, and this panel only links to the IAM's
 * page for it. The appearance and the language are the account's too
 * (AccountPreferences): chosen here, they are saved to it, and every anotoki
 * site follows them. So are the dates and the clock, which the site writes
 * every date by (AppDatePipe) - but they are chosen on the IAM's account page
 * alone (the owner's decision of 2026-10-22). Signed out, the appearance and
 * the language are this device's. What is this site's own is the name and
 * role it knows the reader by - and the wallpaper behind the site, this
 * browser's alone, chosen in a window of its own opened from here.
 */
@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ButtonComponent, DialogFooterDirective, SegmentedComponent, SelectComponent, TranslatePipe, AppDatePipe],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractModalComponent {
  readonly security = inject(SecurityService);

  /** One theme for the whole site, the admin panel included. */
  readonly theme = inject(ThemeToggleService);

  /** The language the site is read in; the admin panel stays English. */
  readonly i18n = inject(TranslationService);

  /** Whether the choices here are the anotoki account's - see the template. */
  readonly account = inject(AccountPreferences);

  private readonly _settings = inject(SiteSettingsService);

  private readonly _storage = inject(LocalStorageService);

  /** Null when signed out, which is a state this modal renders. */
  readonly user = this.security.currentUser;

  /** The wallpaper behind the site now, by its name (a place or a character, shown as it is). */
  readonly wallpaper = signal(wallpaperName(this._storage.read(StorageKeys.BACKGROUND)));

  /** The role as a word rather than a code: ADMIN is "Administrator". */
  constructor() {
    super();
    this.dialogHeading(() => this.i18n.t('account.title'));
  }

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

  // The choices as the kit's choosers take them, in the reader's language.
  readonly themeChoices = computed<SegmentedOption[]>(() => this.themeOptions.map((option) => ({ value: option.value, label: this.i18n.t(option.label) })));
  readonly languageChoices = computed(() => this.i18n.languages().map((language) => ({ value: language.code, label: language.native_name, lang: language.code })));

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
   * Shown at once - a chooser that lags a round trip behind feels broken -
   * and saved to the account after. A refusal puts the account's theme back,
   * and says so.
   */
  setTheme(theme: Theme): void {
    void this.theme.setTheme(theme).then((result) => {
      if (result.outcome === 'refused') {
        this._notSaved();
      }
    });
  }

  /**
   * The wallpapers' window, over this one - the kit's widest (64rem): a
   * wallpaper is chosen by its picture. One chosen there is shown at once and
   * kept in this browser; once the window closes, the focus is back on the
   * button here, which names it.
   */
  chooseBackground(): void {
    void this.openModal(SiteBackgroundsModalComponent, { size: 'xl' }).closed.then(() => this.wallpaper.set(wallpaperName(this._storage.read(StorageKeys.BACKGROUND))));
  }

  toAdmin(): void {
    window.open('/admin', '_blank');
  }

  private _notSaved(): void {
    this.notificationService.error(this.i18n.t('account.formats.failed'));
  }

  private _cannotStart(): void {
    this.notificationService.error(this.i18n.t('auth.startFailed'));
  }
}
