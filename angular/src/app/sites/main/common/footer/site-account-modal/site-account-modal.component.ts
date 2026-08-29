import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';
import { AbstractDetailComponent } from '../../../../../shared/local-lib/abstract-detail.class';
import { Observable, of } from 'rxjs';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";
import { LoaderComponent } from "../../../../../shared/local-lib/components/loader/loader.component";
import { Theme, ThemeToggleService } from '../../../../../shared/local-lib/theme-toggle/theme-toggle.service';

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent, LoaderComponent],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractDetailComponent<any> {
  userData: UserInfo | null = null;

  /** The site's own appearance; the admin panel keeps a separate one. */
  readonly theme = inject(ThemeToggleService);
  readonly themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'System' },
  ];

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
      this.loadingElement?.loadingCtrl.loading$.subscribe(loading => {
        if (!loading && isSuccess) {
          this.closeModal(true);
        }
      });
    });
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
