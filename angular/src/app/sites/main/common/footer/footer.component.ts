import { Component, signal, WritableSignal } from '@angular/core';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { ChangelogEntry, SiteVersionModalComponent } from './site-version-modal/site-version-modal.component';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { CustomModalRef, ModalConfig } from '../../../../shared/local-lib/components/modal/modal-core/modal-core.class';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SiteFeedbackContactModalComponent } from './site-feedback-contact-modal/site-feedback-contact-modal.component';
import { ThemeToggleComponent } from '../../../../shared/local-lib/theme-toggle/theme-toggle.component';
import { SiteBackgroundsModalComponent } from './site-backgrounds/site-backgrounds-modal.component';
import { LocalStorageService } from '../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../shared/state-manager.service';
import { SiteLoginModalComponent } from './site-login-modal/site-login-modal.component';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';

export interface ButtomMenuItem {
  id: string;
  title: string;
  icon?: string;
  url?: string;
  hidden?: boolean;
  modal?: {
    compoponent: any;
    config?: ModalConfig;
  };
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [NgTemplateOutlet, KeyValuePipe, ThemeToggleComponent],
  providers: [],
})
export class FooterComponent extends AbstractModalComponent {
  menuItems: Record<string, WritableSignal<ButtomMenuItem>> = {
    // difficulties: signal<ButtomMenuItem>({
    //   id: 'site-difficulties',
    //   title: 'Difficulties',
    // }),
    backgrounds: signal<ButtomMenuItem>({
      id: 'site-backgrounds',
      title: 'Backgrounds',
      modal: {
        compoponent: SiteBackgroundsModalComponent,
        config: { size: '6' }
      }
    }),
    feedback: signal<ButtomMenuItem>({
      id: 'site-feedback-contact',
      title: 'Feedback/Contact',
      modal: {
        compoponent: SiteFeedbackContactModalComponent,
        config: { size: '3' }
      }
    }),
    github: signal<ButtomMenuItem>({
      id: 'site-github',
      title: 'GitHub',
      icon: 'icon-github fs-18 d-block', // Changed from icon path to CSS class
      url: 'https://github.com/irelevant25/anotoki-genshin-impact',
    }),
    versions: signal<ButtomMenuItem>({
      id: 'site-versions',
      title: 'Versions',
      modal: {
        compoponent: SiteVersionModalComponent,
        config: { size: '3' }
      }
    }),
    auth: signal<ButtomMenuItem>({
      id: 'site-login',
      title: 'Login',
      modal: {
        compoponent: SiteLoginModalComponent,
        config: { size: '1' }
      }
    }),
    // profile: signal<ButtomMenuItem>({
    //   id: 'site-profile',
    //   title: 'Profile',
    //   modal: {
    //     compoponent: SiteVersionModalComponent,
    //     config: { size: '3' }
    //   }
    // })
    logout: signal<ButtomMenuItem>({
      id: 'site-logout',
      title: 'Logout',
      hidden: true
    })
  };
  changelog: ChangelogEntry[] = [];

  constructor(private _http: HttpClient, private _storageService: LocalStorageService, private readonly _securityService: SecurityService, private readonly _notificationService: NotificationService) {
    super();
    this._securityService.isLoggedIn$.subscribe(isLoggedIn => {
      this.menuItems['auth'].update(item => ({ ...item, hidden: isLoggedIn }));
      this.menuItems['logout'].update(item => ({ ...item, hidden: !isLoggedIn }));
    });
    this.loadVersion();
    this.initializeBackground();
  }

  async loadVersion(): Promise<void> {
    this.changelog = await firstValueFrom(this._http.get<ChangelogEntry[]>('./changelog.json'));
    this.menuItems['versions'].update(item => ({ ...item, title: `v${this.changelog[0].version}` }));
  }

  initializeBackground(): void {
    const savedBackground = this._storageService.read(StorageKeys.BACKGROUND);
    const defaultBackground = 'assets/wallpaper/Fontaine.avif';
    document.body.style.backgroundImage = `url("${savedBackground || defaultBackground}")`;
  }

  preserveOrder = () => 0;

  onMenuItemClick(menuItem: ButtomMenuItem) {
    if (menuItem.id === 'site-logout') {
      this._securityService.logout();
      this._notificationService.showSuccess('You was successfully logged out.');
      return;
    }
    if (!menuItem.modal) {
      return;
    }
    const modal: CustomModalRef<any, any> = this.openModal(menuItem.modal.compoponent, menuItem.modal.config || { size: '2' });
    modal.componentInstance.data = this.changelog;
  }

  onLogin(): void {

  }
}
