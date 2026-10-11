import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { DrawerComponent } from '@anotoki/lib/ui/drawer';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { filter } from 'rxjs';
import { FeedbackUnread } from '@anotoki/lib/admin';
import { NgTemplateOutlet } from '@angular/common';
import { ConfirmHostComponent } from '@anotoki/lib/ui/dialog';
import { ToastHostComponent } from '@anotoki/lib/ui/toast';
import { ThemeToggleComponent } from '../../shared/local-lib/theme-toggle/theme-toggle.component';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { AdminNoAccessComponent } from './no-access/no-access.component';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  /** A route inside the admin panel. */
  path?: string;
  /** Or a page somewhere else, opened in a new tab. */
  href?: string;
  icon?: string;
  readOnly?: boolean;
  /** How many wait for somebody to look: the feedback nobody has opened yet. */
  badge?: number | null;
}

@Component({
  selector: 'app-admin-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    ButtonComponent,
    DrawerComponent,
    IconComponent,
    ToastHostComponent,
    ConfirmHostComponent,
    ThemeToggleComponent,
    AdminNoAccessComponent,
  ],
})
export class AppComponent {
  private readonly _security = inject(SecurityService);

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

  /** The navigation's drawer, on a phone: open until a page is chosen or it is put away. */
  readonly menuOpen = signal(false);

  readonly navGroups = computed<NavGroup[]>(() => {
    // Accounts, who may do what here, and where everybody is signed in are the
    // anotoki IAM's now, managed in its console for every anotoki site at once.
    // Left out if the site could not learn where that is.
    const adminUrl = this._security.adminUrl();
    const accounts: NavItem[] = adminUrl ? [{ label: 'Accounts & access', href: adminUrl, icon: 'icon icon-user-group' }] : [];
    // The anotoki library's pages are the ADMIN's alone, and so are their APIs:
    // the Migrations page (@anotoki/lib/migrations), the admin tools
    // (shared/site-admin-tools.ts) and the People page (people.ts) - the
    // owner's decision: EDITORs see none
    // of them.
    const admin = this._security.role() === 'ADMIN';
    const people: NavItem[] = admin ? [{ label: 'People', path: 'people', icon: 'icon icon-user-check' }] : [];
    const tools: NavItem[] = admin
      ? [
          { label: 'Feedback', path: 'feedback', icon: 'icon icon-mail', badge: this._unread.count() || null },
          { label: 'Audit Logs', path: 'audit-logs', icon: 'icon icon-history', readOnly: true },
          { label: 'Error Log', path: 'errors', icon: 'icon icon-triangle-alert', readOnly: true },
          { label: 'Files Explorer', path: 'files-explorer', icon: 'icon icon-computer' },
          { label: 'Migrations', path: 'migrations', icon: 'icon icon-database', readOnly: true },
          { label: 'Backups', path: 'backups', icon: 'icon icon-download' },
        ]
      : [];

    return [
      {
        label: 'Database',
        items: [
          { label: 'Characters', path: 'characters', icon: 'icon icon-swords' },
          { label: 'Enemies', path: 'enemies', icon: 'icon icon-skull' },
          { label: 'Materials', path: 'materials', icon: 'icon icon-boxes' },
          { label: 'Artifacts', path: 'artifacts', icon: 'icon icon-ring' },
          { label: 'Weapons', path: 'weapons', icon: 'icon icon-sword' },
          { label: 'Foods', path: 'foods', icon: 'icon icon-utensils' },
          { label: 'Banners', path: 'banners', icon: 'icon icon-scroll' },
          { label: 'Backgrounds', path: 'backgrounds', icon: 'icon icon-image' },
          { label: 'Files', path: 'files', icon: 'icon icon-folder' },
          { label: 'File Categories', path: 'file-categories', icon: 'icon icon-layers' },
        ],
      },
      {
        label: 'Lookup Tables',
        items: [
          { label: 'Relationship Types', path: 'relationship-types', icon: 'icon icon-heart' },
          { label: 'Talent Types', path: 'talent-types', icon: 'icon icon-star' },
          { label: 'Food Types', path: 'food-types', icon: 'icon icon-utensils' },
          { label: 'Material Types', path: 'material-types', icon: 'icon icon-boxes' },
          { label: 'Material Groups', path: 'material-groups', icon: 'icon icon-layers' },
          { label: 'Regions', path: 'regions', icon: 'icon icon-globe' },
          { label: 'Roles', path: 'roles', icon: 'icon icon-tag' },
          { label: 'Enemy Types', path: 'enemy-types', icon: 'icon icon-skull' },
          { label: 'Domain Levels', path: 'domain-levels', icon: 'icon icon-dungeon' },
          { label: 'Enemy Families', path: 'enemy-families', icon: 'icon icon-flame' },
          { label: 'Enemy Groups', path: 'enemy-groups', icon: 'icon icon-user-group' },
          { label: 'Stats', path: 'stats', icon: 'icon icon-chart' },
          { label: 'Elements', path: 'elements', icon: 'icon icon-wind', readOnly: true },
          { label: 'Weapon Types', path: 'weapon-types', icon: 'icon icon-shield', readOnly: true },
          { label: 'Character States', path: 'character-states', icon: 'icon icon-circle-dot', readOnly: true },
          { label: 'Rarities', path: 'rarities', icon: 'icon icon-gem', readOnly: true },
          { label: 'Artifact Piece Types', path: 'artifact-piece-types', icon: 'icon icon-puzzle', readOnly: true },
        ],
      },
      {
        label: 'Localization',
        items: [
          { label: 'Languages', path: 'languages', icon: 'icon icon-globe' },
          { label: 'Translations', path: 'translations', icon: 'icon icon-list' },
          { label: 'Guides', path: 'guides', icon: 'icon icon-book' },
        ],
      },
      {
        label: 'System',
        items: [...accounts, ...people, { label: 'Site Settings', path: 'settings', icon: 'icon icon-settings' }, ...tools],
      },
    ];
  });

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));

    effect(() => {
      if (this._security.role() === 'ADMIN') {
        untracked(() => void this._unread.refresh());
      }
    });
  }
}
