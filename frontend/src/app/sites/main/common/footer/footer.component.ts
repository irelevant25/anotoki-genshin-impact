import { Component, effect, inject, signal, Type, untracked, WritableSignal } from '@angular/core';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { ChangelogEntry, SiteVersionModalComponent } from './site-version-modal/site-version-modal.component';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { AnotokiDialogOptions } from '@anotoki/lib/ui/dialog';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SiteBackgroundsModalComponent } from './site-backgrounds/site-backgrounds-modal.component';
import { LocalStorageService } from '../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../shared/state-manager.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { ToastService } from '@anotoki/lib/ui/toast';
import { SiteAccountModalComponent } from './site-account-modal/site-account-modal.component';
import { SiteWhatsNewModalComponent, WhatsNewData } from './site-whats-new-modal/site-whats-new-modal.component';
import { sameVersion } from './versions';

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
    compoponent: Type<unknown>;
    config?: AnotokiDialogOptions;
  };
  /** A dialog whose code is loaded only when it is opened - what no page needs before then. */
  lazyModal?: {
    load: () => Promise<Type<unknown>>;
    config?: AnotokiDialogOptions;
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
        // The kit's widest (64rem): a wallpaper is chosen by its picture.
        config: { size: 'xl' }
      }
    }),
    // The anotoki library's feedback form, which brings the kit's fields:
    // loaded when somebody opens it.
    feedback: signal<ButtomMenuItem>({
      id: 'site-feedback-contact',
      title: 'footer.feedback',
      lazyModal: {
        load: () => import('./site-feedback-modal/site-feedback-modal.component').then((m) => m.SiteFeedbackModalComponent),
        config: { size: 'md' },
      },
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
        config: { size: 'md' }
      }
    }),
    account: signal<ButtomMenuItem>({
      id: 'site-account',
      title: 'footer.account',
      modal: {
        compoponent: SiteAccountModalComponent,
        config: { size: 'md' }
      }
    })
    // logout: signal<ButtomMenuItem>({
    //   id: 'site-logout',
    //   title: 'Logout',
    //   hidden: true
    // })
  };
  changelog: ChangelogEntry[] = [];

  private readonly _i18n = inject(TranslationService);
  /** "What's new" once a new version is noticed, until it opens. */
  private readonly _whatsNew = signal<{ latest: ChangelogEntry; hasEarlier: boolean } | null>(null);

  constructor(private _http: HttpClient, private _storageService: LocalStorageService, private readonly _securityService: SecurityService, private readonly _notificationService: ToastService) {
    super();
    this.loadVersion();
    this.initializeBackground();
    this.watchAccount();
    this.watchWhatsNew();
  }

  /**
   * The account button says who is signed in.
   *
   * `titleLiteral` rather than a translation, because a username is a proper
   * noun - running it through the pipe would only report it as a missing
   * string. Signed out it goes back to the translated word.
   */
  private watchAccount(): void {
    effect(() => {
      const username = this._securityService.currentUser()?.username;
      untracked(() => this.menuItems['account'].update((item) => ({ ...item, titleLiteral: username || undefined })));
    });
  }

  async loadVersion(): Promise<void> {
    this.changelog = await firstValueFrom(this._http.get<ChangelogEntry[]>('./changelog.json'));
    if (!this.changelog.length) {
      return;
    }
    const current = this.changelog[0].version;
    this.menuItems['versions'].update(item => ({ ...item, titleLiteral: `v${current}` }));
    this.noticeNewVersion(current);
  }

  /**
   * Queues "What's new" the first time somebody sees a new version.
   *
   * The last version a visitor saw is kept in this browser's localStorage. On a
   * new version — or a first visit, where nothing is stored — a short note on
   * the newest version opens (watchWhatsNew), and opening it records that
   * version so it does not show again. It is about the newest version only: a
   * visitor who skipped releases is told there were earlier ones, and its "See
   * all changes" opens the full changelog, the same one the footer's version
   * button does. Kept per browser rather than per account on purpose: a
   * signed-in visitor on a second device is signed out there with an empty
   * localStorage, so an account could not tell us they had already seen it —
   * the browser is the thing that actually knows. The version kept may be an
   * old name of a changelog entry ("1.0" for "1.0.0"), so they are compared
   * as versions (sameVersion), never as text.
   */
  private noticeNewVersion(current: string): void {
    const lastSeen = this._storageService.read(StorageKeys.VERSION);
    if (sameVersion(lastSeen, current)) {
      return;
    }

    // The list runs newest first, so everything before the version last seen
    // is unseen, and more than one of those means earlier releases were missed
    // too. A first visit — nothing stored, so not found — has nothing earlier
    // to catch up on: a newcomer is shown what is new, not the history.
    const seenIndex = this.changelog.findIndex((entry) => sameVersion(entry.version, lastSeen));

    this._whatsNew.set({ latest: this.changelog[0], hasEarlier: seenIndex > 1 });
  }

  /**
   * Opens "What's new" once its own words are there. On the first visit after
   * the release that brings them, the strings cached from the last visit lack
   * them until the fresh ones arrive behind the page (TranslationService.init),
   * and a note of raw keys is worse than a note a moment late. Should they
   * never arrive - the release's migration not applied yet - there is no note,
   * and the version stays unseen until there is one.
   *
   * The effect only notices the moment; the modal is made a microtask later,
   * outside the effect's own run. It has to be: the note's constructor makes an
   * effect of its own, and Angular refuses to create an effect inside another
   * one's run (NG0602). By then the wait may have let the version be seen
   * another way - the footer's version button, or the note in another tab -
   * and a note on what was just read is only in the way.
   */
  private watchWhatsNew(): void {
    effect(() => {
      const note = this._whatsNew();
      if (!note || !this._i18n.has('whatsNew.title')) {
        return;
      }
      untracked(() => this._whatsNew.set(null));
      queueMicrotask(() => {
        if (sameVersion(this._storageService.read(StorageKeys.VERSION), note.latest.version)) {
          return;
        }
        this.openModal(SiteWhatsNewModalComponent, { size: 'md', data: { latest: note.latest, hasEarlier: note.hasEarlier, changelog: this.changelog } satisfies WhatsNewData });
      });
    });
  }

  initializeBackground(): void {
    const savedBackground = this._storageService.read(StorageKeys.BACKGROUND);
    const defaultBackground = 'assets/backgrounds/Fontaine.avif';
    document.body.style.backgroundImage = `url("${savedBackground || defaultBackground}")`;
  }

  preserveOrder = (): number => 0;

  /**
   * Whether a menu link is safe to render as an anchor.
   *
   * The URLs are configured by an admin, not typed by a visitor, and Angular's
   * own sanitiser already neutralises a `javascript:` href — but a link is only
   * ever meant to be an ordinary web address, so anything that is not http(s)
   * is dropped rather than trusted to the framework's default.
   */
  isSafeUrl(url: string | undefined): boolean {
    return !!url && /^https?:\/\//i.test(url.trim());
  }

  onMenuItemClick(menuItem: ButtomMenuItem): void {
    const lazy = menuItem.lazyModal;
    if (lazy) {
      lazy
        .load()
        .then((component) => this.openModal(component, lazy.config ?? { size: 'sm' }))
        // A part of the site that could not be loaded - the network gone, a
        // newer build uploaded since this page loaded: nothing opens, and the
        // button is there to press again.
        .catch((error: unknown) => console.error('This part of the site could not be loaded', error));
      return;
    }
    if (!menuItem.modal) {
      return;
    }
    // The version list reads the changelog this footer already has; the rest ignore it.
    this.openModal(menuItem.modal.compoponent, { size: 'sm', ...menuItem.modal.config, data: this.changelog });
  }
}
