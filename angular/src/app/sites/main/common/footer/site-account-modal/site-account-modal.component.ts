import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';
import { AbstractDetailComponent } from '../../../../../shared/local-lib/abstract-detail.class';
import { Observable, of } from 'rxjs';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";
import { LoaderComponent } from "../../../../../shared/local-lib/components/loader/loader.component";
import { Theme, ThemeToggleService } from '../../../../../shared/local-lib/theme-toggle/theme-toggle.service';
import { ModalService } from '../../../../../shared/local-lib/components/modal/modal.service';
import { SiteLoginModalComponent } from '../site-login-modal/site-login-modal.component';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent, LoaderComponent, TranslatePipe],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractDetailComponent<any> {
  userData: UserInfo | null = null;

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
    this._securityService.currentUserData$.subscribe((data) => (this.userData = data));
  }

  protected override loadData$(): Observable<any> {
    return of(null);
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
