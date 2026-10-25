import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackUnread } from '@anotoki/lib/admin';
import { AdminFrameAction, AdminFrameBrand, AdminFrameComponent, AdminFrameLink, AdminFramePerson, SideNavGroup, SideNavLink } from '@anotoki/lib/admin/frame';
import { SiteFooterComponent } from '@anotoki/lib/footer';
import { SiteStatus } from '@anotoki/lib/migrations';
import { PageNoticeComponent } from '@anotoki/lib/site-settings';
import { ThemeService, ThemeToggleComponent } from '@anotoki/lib/shell';
import { AnotokiDialog, ConfirmHostComponent } from '@anotoki/lib/ui/dialog';
import { AnotokiIcons } from '@anotoki/lib/ui/icon';
import { ToastHostComponent } from '@anotoki/lib/ui/toast';
import { firstValueFrom } from 'rxjs';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { SiteShellTheme } from '../../shared/local-lib/theme-toggle/shell-theme';
import type { ChangelogEntry } from '../main/common/footer/site-version-modal/site-version-modal.component';
import type { WhatsNewData } from '../main/common/footer/site-whats-new-modal/site-whats-new-modal.component';
import { AdminNoAccessComponent } from './no-access/no-access.component';
import { ADMIN_ICONS } from './admin-icons';

/**
 * The admin panel's frame: the anotoki family's, `<anotoki-admin-frame>` (@anotoki/lib/admin/frame, anotoki-lib 0.10.0)
 * - this panel's own frame, made every anotoki admin panel's at the owner's request of 2026-10-24, so that a panel is
 * never mistaken for its site. On a computer a column beside the page - the panel's name, who is signed in, Back to the
 * site, Sign out, the theme, then the pages under their headings - each scrolling on its own; up to 860 px a row with
 * the name and Menu, whose drawer holds all of the column. Under every page the family's footer (<anotoki-site-footer>,
 * @anotoki/lib/footer, anotoki-lib 0.6.3 - the owner's choice of 2026-10-18: one footer in every admin panel; the
 * public site keeps its own, which is "completely different"): the version, What's new and Feedback, then About ·
 * Support · Terms · Privacy · Contact (links to the public site's pages, which are anybody's) and the fan clause, in
 * English as the panel is.
 */
@Component({
  selector: 'app-admin-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, AdminFrameComponent, ThemeToggleComponent, PageNoticeComponent, SiteFooterComponent, ToastHostComponent, ConfirmHostComponent, AdminNoAccessComponent],
  // The family's theme switch reads the shell's ThemeService: in this panel, genshin's one theme service behind it.
  providers: [{ provide: ThemeService, useExisting: SiteShellTheme }],
})
export class AppComponent {
  private readonly _security = inject(SecurityService);
  private readonly _site = inject(SiteStatus);
  private readonly _dialogs = inject(AnotokiDialog);

  /** The panel's name at the top of the frame, and its home. */
  readonly brand: AdminFrameBrand = { name: 'Genshin Admin', path: '/admin' };

  /** The way out of the panel: the public site's home. */
  readonly back: AdminFrameLink = { label: 'Back to the site', path: '/' };

  /** Who is signed in, as this site knows them: the name and the address (SecurityService - the token's address). */
  readonly person = computed<AdminFramePerson | null>(() => {
    const user = this._security.currentUser();
    return user ? { name: user.username, email: user.email } : null;
  });

  /**
   * Sign out: the one the Account window runs - the IAM ends its session, so every anotoki site signs out with this
   * one. A promise, so the frame says "Saving…" until it is done.
   */
  readonly signOut: AdminFrameAction = () => this._security.logout();

  /**
   * The site's versions, newest first: public/changelog.json, the one source of
   * the version - the public footer shows its newest entry too. Empty until it
   * has come, and if it never does (the footer then shows neither the version
   * nor What's new).
   */
  private readonly _changelog = signal<ChangelogEntry[]>([]);

  /** The footer's version: the changelog's newest. */
  readonly version = computed(() => this._changelog()[0]?.version ?? null);

  /**
   * The footer's Feedback - the library's form in the kit's dialog, its code
   * loaded with the press (shared/site-feedback.ts). Everybody in the panel is
   * signed in, so it is sent as them; but not offered while the site waits for
   * an update (only its ADMIN, on the Migrations page, has the panel then): the
   * server would refuse the message, 503.
   */
  readonly feedbackOffered = computed(() => !this._site.blocked());

  /**
   * The feedback nobody has opened yet, beside "Feedback": no mail is sent for
   * a message, so this is how the ADMIN hears of one (@anotoki/lib/admin; the
   * Feedback page keeps it in step). Asked whenever the reader becomes this
   * site's ADMIN - it asks nothing for anybody else.
   */
  private readonly _unread = inject(FeedbackUnread);

  /**
   * Whether the panel is still for whoever is reading it.
   *
   * The route guard asked on the way in. This asks again the whole time the
   * panel is open, because the answer can change under it: a sign-out in
   * another tab, or a role taken away at the IAM, which reaches this page with
   * the next token. The panel then turns into the page that says so, rather
   * than staying up with every request behind it refused.
   */
  readonly allowed = this._security.isStaff;

  /**
   * The panel's pages for the frame's side navigation (@anotoki/lib/ui/side-nav),
   * in the one shape every anotoki admin panel has (the owner's request of
   * 2026-10-25): the site's own pages at the top with no heading - the
   * dashboard, then the Database and Lookup Tables groups -, then Localization,
   * then System: the site's own system pages first (Accounts & access, Quiz
   * levels, Files Explorer), then the family's, in the family's order and words
   * - Site settings, People, Feedback, Error log, Audit log, Backups,
   * Migrations. A read-only page says so in its own header (the lookup tables'
   * "Read-only" badge), so the navigation marks only what waits for somebody:
   * the feedback nobody has opened, heard "Feedback, 3 new".
   */
  readonly navGroups = computed<SideNavGroup[]>(() => {
    // Accounts, who may do what here, and where everybody is signed in are the
    // anotoki IAM's now, managed in its console for every anotoki site at once.
    // Left out if the site could not learn where that is.
    const adminUrl = this._security.adminUrl();
    const accounts: SideNavLink[] = adminUrl ? [{ label: 'Accounts & access', href: adminUrl, newTab: true, icon: 'admin-user-group' }] : [];
    // The anotoki library's pages are the ADMIN's alone, and so are their APIs:
    // the file explorer, the site settings and the other admin tools
    // (shared/site-admin-tools.ts), the People page (people.ts) and the
    // Migrations page (@anotoki/lib/migrations) - the owner's decision:
    // EDITORs see none of them (the server refuses them too).
    const admin = this._security.role() === 'ADMIN';
    const explorer: SideNavLink[] = admin ? [{ label: 'Files Explorer', path: 'files-explorer', icon: 'admin-computer' }] : [];
    const family: SideNavLink[] = admin
      ? [
          { label: 'Site settings', path: 'site-settings', icon: 'admin-settings' },
          { label: 'People', path: 'people', icon: 'admin-user-check' },
          { label: 'Feedback', path: 'feedback', icon: 'admin-mail', badge: this._unread.count() || null },
          { label: 'Error log', path: 'errors', icon: 'admin-triangle-alert' },
          { label: 'Audit log', path: 'audit-logs', icon: 'admin-history' },
          { label: 'Backups', path: 'backups', icon: 'admin-download' },
          { label: 'Migrations', path: 'migrations', icon: 'admin-database' },
        ]
      : [];

    return [
      { id: 'home', links: [{ label: 'Dashboard', path: 'dashboard', icon: 'admin-gauge' }] },
      {
        label: 'Database',
        links: [
          { label: 'Characters', path: 'characters', icon: 'admin-swords' },
          { label: 'Enemies', path: 'enemies', icon: 'admin-skull' },
          { label: 'Materials', path: 'materials', icon: 'admin-boxes' },
          { label: 'Artifacts', path: 'artifacts', icon: 'admin-ring' },
          { label: 'Weapons', path: 'weapons', icon: 'admin-sword' },
          { label: 'Foods', path: 'foods', icon: 'admin-utensils' },
          { label: 'Banners', path: 'banners', icon: 'admin-scroll' },
          { label: 'Backgrounds', path: 'backgrounds', icon: 'admin-image' },
          { label: 'Files', path: 'files', icon: 'admin-folder' },
          { label: 'File Categories', path: 'file-categories', icon: 'admin-layers' },
        ],
      },
      {
        label: 'Lookup Tables',
        links: [
          { label: 'Relationship Types', path: 'relationship-types', icon: 'admin-heart' },
          { label: 'Talent Types', path: 'talent-types', icon: 'admin-star' },
          { label: 'Food Types', path: 'food-types', icon: 'admin-utensils' },
          { label: 'Material Types', path: 'material-types', icon: 'admin-boxes' },
          { label: 'Material Groups', path: 'material-groups', icon: 'admin-layers' },
          { label: 'Regions', path: 'regions', icon: 'admin-globe' },
          { label: 'Roles', path: 'roles', icon: 'admin-tag' },
          { label: 'Enemy Types', path: 'enemy-types', icon: 'admin-skull' },
          { label: 'Domain Levels', path: 'domain-levels', icon: 'admin-dungeon' },
          { label: 'Enemy Families', path: 'enemy-families', icon: 'admin-flame' },
          { label: 'Enemy Groups', path: 'enemy-groups', icon: 'admin-user-group' },
          { label: 'Stats', path: 'stats', icon: 'admin-chart' },
          { label: 'Elements', path: 'elements', icon: 'admin-wind' },
          { label: 'Weapon Types', path: 'weapon-types', icon: 'admin-shield' },
          { label: 'Character States', path: 'character-states', icon: 'admin-circle-dot' },
          { label: 'Rarities', path: 'rarities', icon: 'admin-gem' },
          { label: 'Artifact Piece Types', path: 'artifact-piece-types', icon: 'admin-puzzle' },
        ],
      },
      {
        label: 'Localization',
        links: [
          { label: 'Translations', path: 'translations', icon: 'admin-list' },
          { label: 'Languages', path: 'languages', icon: 'admin-globe' },
          { label: 'Guides', path: 'guides', icon: 'admin-book' },
        ],
      },
      {
        label: 'System',
        // The site's own first - the quiz levels, how the site plays, for whoever may change its content -, then the
        // family's.
        links: [...accounts, { label: 'Quiz levels', path: 'quiz-levels', icon: 'admin-levels' }, ...explorer, ...family],
      },
    ];
  });

  constructor() {
    // The panel's icons (its navigation's, its forms' tabs'), before they are first drawn: lazy with it.
    inject(AnotokiIcons).register(ADMIN_ICONS);

    effect(() => {
      if (this._security.role() === 'ADMIN') {
        untracked(() => void this._unread.refresh());
      }
    });

    // The footer's version and What's new: a file of the build, never the API - asked whatever the site's state,
    // and nothing waits for it. One that does not come leaves the row to Feedback.
    firstValueFrom(inject(HttpClient).get<ChangelogEntry[]>('./changelog.json'))
      .then((entries) => this._changelog.set(Array.isArray(entries) ? entries : []))
      .catch(() => undefined);
  }

  /**
   * The footer's What's new, pressed: the site's own note on its newest version -
   * the public footer's dialog (sites/main/common/footer/site-whats-new-modal),
   * its code loaded with the press, "See all changes" to the whole changelog.
   * Shown, it marks the version seen in this browser, as on the site.
   */
  async openWhatsNew(): Promise<void> {
    const changelog = this._changelog();
    if (!changelog.length) {
      return;
    }
    try {
      const { SiteWhatsNewModalComponent } = await import('../main/common/footer/site-whats-new-modal/site-whats-new-modal.component');
      this._dialogs.open(SiteWhatsNewModalComponent, { size: 'md', data: { latest: changelog[0], hasEarlier: false, changelog } satisfies WhatsNewData });
    } catch (error) {
      // The network gone, or a newer build uploaded since this page loaded: nothing opens, and the button is there
      // to press again.
      console.error('This part of the site could not be loaded', error);
    }
  }
}
