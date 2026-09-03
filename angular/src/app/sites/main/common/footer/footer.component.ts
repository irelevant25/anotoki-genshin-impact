import { Component, signal, WritableSignal } from '@angular/core';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { ChangelogEntry, SiteVersionModalComponent } from './site-version-modal/site-version-modal.component';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { CustomModalRef, ModalConfig } from '../../../../shared/local-lib/components/modal/modal-core/modal-core.class';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SiteFeedbackContactModalComponent } from './site-feedback-contact-modal/site-feedback-contact-modal.component';
import { SiteBackgroundsModalComponent } from './site-backgrounds/site-backgrounds-modal.component';
import { LocalStorageService } from '../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../shared/state-manager.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { SiteAccountModalComponent } from './site-account-modal/site-account-modal.component';

export interface ButtomMenuItem {
  id: string;
  /** A translation key, unless `titleLiteral` says otherwise. */
  title: string;
  /**
   * Text to show as-is. Proper nouns and the version number are not
   * translatable, and running them through the pipe would only report them
   * as missing strings.
   */
  titleLiteral?: string;
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
  imports: [NgTemplateOutlet, KeyValuePipe, TranslatePipe],
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
      title: 'footer.backgrounds',
      modal: {
        compoponent: SiteBackgroundsModalComponent,
        config: { size: '6' }
      }
    }),
    feedback: signal<ButtomMenuItem>({
      id: 'site-feedback-contact',
      title: 'footer.feedback',
      modal: {
        compoponent: SiteFeedbackContactModalComponent,
        config: { size: '3' }
      }
    }),
    github: signal<ButtomMenuItem>({
      id: 'site-github',
      title: 'footer.github',
      titleLiteral: 'GitHub',
      icon: 'icon-github fs-18 d-block', // Changed from icon path to CSS class
      url: 'https://github.com/irelevant25/anotoki-genshin-impact',
    }),
    versions: signal<ButtomMenuItem>({
      id: 'site-versions',
      title: 'footer.versions',
      modal: {
        compoponent: SiteVersionModalComponent,
        config: { size: '3' }
      }
    }),
    account: signal<ButtomMenuItem>({
      id: 'site-account',
      title: 'footer.account',
      modal: {
        compoponent: SiteAccountModalComponent,
        config: { size: '3' }
      }
    })
    // logout: signal<ButtomMenuItem>({
    //   id: 'site-logout',
    //   title: 'Logout',
    //   hidden: true
    // })
  };
  changelog: ChangelogEntry[] = [];

  constructor(private _http: HttpClient, private _storageService: LocalStorageService, private readonly _securityService: SecurityService, private readonly _notificationService: NotificationService) {
    super();
    this.loadVersion();
    this.initializeBackground();
    this.watchAccount();
  }

  /**
   * The account button says who is signed in.
   *
   * `titleLiteral` rather than a translation, because a username is a proper
   * noun - running it through the pipe would only report it as a missing
   * string. Signed out it goes back to the translated word.
   */
  private watchAccount(): void {
    this._securityService.currentUserData$.subscribe((user) => {
      this.menuItems['account'].update((item) => ({ ...item, titleLiteral: user?.username || undefined }));
    });
  }

  async loadVersion(): Promise<void> {
    this.changelog = await firstValueFrom(this._http.get<ChangelogEntry[]>('./changelog.json'));
    this.menuItems['versions'].update(item => ({ ...item, titleLiteral: `v${this.changelog[0].version}` }));
  }

  initializeBackground(): void {
    const savedBackground = this._storageService.read(StorageKeys.BACKGROUND);
    const defaultBackground = 'assets/backgrounds/Fontaine.avif';
    document.body.style.backgroundImage = `url("${savedBackground || defaultBackground}")`;
  }

  preserveOrder = () => 0;

  onMenuItemClick(menuItem: ButtomMenuItem) {
    if (!menuItem.modal) {
      return;
    }
    const modal: CustomModalRef<any, any> = this.openModal(menuItem.modal.compoponent, menuItem.modal.config || { size: '2' });
    modal.componentInstance.data = this.changelog;
  }
}
