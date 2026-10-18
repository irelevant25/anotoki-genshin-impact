import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_LEGAL_PATHS } from '@anotoki/lib/legal';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../shared/local-lib/services/local-storage.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { StorageKeys } from '../../../../shared/state-manager.service';
import { SiteAccountModalComponent } from './site-account-modal/site-account-modal.component';
import { ChangelogEntry, SiteVersionModalComponent } from './site-version-modal/site-version-modal.component';
import { SiteWhatsNewModalComponent, WhatsNewData } from './site-whats-new-modal/site-whats-new-modal.component';
import { sameVersion } from './versions';

/**
 * The public site's footer - its own: the admin panel has the anotoki
 * family's (@anotoki/lib/footer), and the owner wants this one different.
 *
 * On the right, in this order (the owner's of 2026-10-18): the version (the
 * changelog), What's new, Feedback and the account - each a button that opens
 * its dialog - then Terms · Privacy · Contact, links to the legal pages in the
 * anotoki library's words (anotoki.legalLinks.*). On the left, alone, the fan
 * clause (footer.fanDisclaimer). Under every page: the closed sign and the
 * sign-in card keep the clause and the three links (`legalOnly`), as what the
 * site keeps is said before anybody signs in.
 *
 * It also puts this browser's wallpaper behind the page as the site starts
 * (chosen in the account panel), and opens What's new once after a release.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
})
export class FooterComponent extends AbstractModalComponent {
  /**
   * The fan clause and Terms · Privacy · Contact alone: under the closed sign
   * and the sign-in card, which stand in for the site - its own dialogs would
   * ask an API that refuses them, and a release note has no place over either.
   */
  readonly legalOnly = input(false);

  /** The legal pages' addresses: the library's own, where sites/main/main.routes.ts puts the pages (shared/site-legal.ts). */
  readonly legalPaths = DEFAULT_LEGAL_PATHS;

  /** The changelog, newest first: the version's label and dialog, and What's new, read it. */
  readonly changelog = signal<ChangelogEntry[]>([]);

  /** "v1.2.0" once the changelog has come - a version number is shown as it is, never translated. Null: the word Versions. */
  readonly version = computed(() => {
    const newest = this.changelog()[0];
    return newest ? `v${newest.version}` : null;
  });

  private readonly _http = inject(HttpClient);
  private readonly _storage = inject(LocalStorageService);
  private readonly _security = inject(SecurityService);
  private readonly _i18n = inject(TranslationService);

  /**
   * The account button says who is signed in: the name this site knows them
   * by, a proper noun - running it through the pipe would only report it as a
   * missing string. Null - nobody signed in - is the translated word.
   */
  readonly username = computed(() => this._security.currentUser()?.username || null);

  /** "What's new" once a new version is noticed, until it opens. */
  private readonly _whatsNew = signal<{ latest: ChangelogEntry; hasEarlier: boolean } | null>(null);

  constructor() {
    super();
    void this.loadVersion();
    this.initializeBackground();
    this.watchWhatsNew();
  }

  async loadVersion(): Promise<void> {
    const changelog = await firstValueFrom(this._http.get<ChangelogEntry[]>('./changelog.json'));
    this.changelog.set(changelog);
    if (changelog.length) {
      this.noticeNewVersion(changelog[0].version);
    }
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
    const lastSeen = this._storage.read(StorageKeys.VERSION);
    if (sameVersion(lastSeen, current)) {
      return;
    }

    // The list runs newest first, so everything before the version last seen
    // is unseen, and more than one of those means earlier releases were missed
    // too. A first visit — nothing stored, so not found — has nothing earlier
    // to catch up on: a newcomer is shown what is new, not the history.
    const changelog = this.changelog();
    const seenIndex = changelog.findIndex((entry) => sameVersion(entry.version, lastSeen));

    this._whatsNew.set({ latest: changelog[0], hasEarlier: seenIndex > 1 });
  }

  /**
   * Opens "What's new" once its own words are there. On the first visit after
   * the release that brings them, the strings cached from the last visit lack
   * them until the fresh ones arrive behind the page (TranslationService.init),
   * and a note of raw keys is worse than a note a moment late. Should they
   * never arrive - the release's migration not applied yet - there is no note,
   * and the version stays unseen until there is one. Nor over the closed sign
   * or the sign-in card (`legalOnly`): it waits for the site.
   *
   * The effect only notices the moment; the modal is made a microtask later,
   * outside the effect's own run. It has to be: the note's constructor makes an
   * effect of its own, and Angular refuses to create an effect inside another
   * one's run (NG0602). By then the wait may have let the version be seen
   * another way - the footer's version or What's new button, or the note in
   * another tab - and a note on what was just read is only in the way.
   */
  private watchWhatsNew(): void {
    effect(() => {
      const note = this._whatsNew();
      if (!note || this.legalOnly() || !this._i18n.has('whatsNew.title')) {
        return;
      }
      untracked(() => this._whatsNew.set(null));
      queueMicrotask(() => {
        if (sameVersion(this._storage.read(StorageKeys.VERSION), note.latest.version)) {
          return;
        }
        this.openModal(SiteWhatsNewModalComponent, { size: 'md', data: { latest: note.latest, hasEarlier: note.hasEarlier, changelog: this.changelog() } satisfies WhatsNewData });
      });
    });
  }

  initializeBackground(): void {
    const savedBackground = this._storage.read(StorageKeys.BACKGROUND);
    const defaultBackground = 'assets/backgrounds/Fontaine.avif';
    document.body.style.backgroundImage = `url("${savedBackground || defaultBackground}")`;
  }

  /** Every version: the changelog this footer has read. Opening it marks the newest one seen. */
  openVersions(): void {
    this.openModal(SiteVersionModalComponent, { size: 'md', data: this.changelog() });
  }

  /**
   * What's new whenever somebody wants it: the note that opens by itself once
   * after a release, on the newest version alone ("See all changes" has the
   * rest). Nothing to open before the changelog has come.
   */
  openWhatsNew(): void {
    const changelog = this.changelog();
    if (changelog.length) {
      this.openModal(SiteWhatsNewModalComponent, { size: 'md', data: { latest: changelog[0], hasEarlier: false, changelog } satisfies WhatsNewData });
    }
  }

  /**
   * The anotoki library's feedback form, which brings the kit's fields: its
   * code is loaded when somebody opens it. A part of the site that could not
   * be loaded - the network gone, a newer build uploaded since this page
   * loaded: nothing opens, and the button is there to press again.
   */
  openFeedback(): void {
    import('./site-feedback-modal/site-feedback-modal.component')
      .then((m) => this.openModal(m.SiteFeedbackModalComponent, { size: 'md' }))
      .catch((error: unknown) => console.error('This part of the site could not be loaded', error));
  }

  /** Who is signed in, how they like the site, and the wallpaper behind it. */
  openAccount(): void {
    this.openModal(SiteAccountModalComponent, { size: 'md' });
  }
}
