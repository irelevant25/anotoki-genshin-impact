import { Component, computed, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { AnotokiIcons, IconComponent } from '@anotoki/lib/ui/icon';
import { SideNavComponent, SideNavGroup, SideNavLink, SideNavTriggerDirective } from '@anotoki/lib/ui/side-nav';
import { FeedbackUnread } from '@anotoki/lib/admin';
import { ConfirmHostComponent } from '@anotoki/lib/ui/dialog';
import { ToastHostComponent } from '@anotoki/lib/ui/toast';
import { ThemeToggleComponent } from '../../shared/local-lib/theme-toggle/theme-toggle.component';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { AdminNoAccessComponent } from './no-access/no-access.component';
import { ADMIN_ICONS } from './admin-icons';

@Component({
  selector: 'app-admin-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    ButtonComponent,
    IconComponent,
    SideNavComponent,
    SideNavTriggerDirective,
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

  /**
   * The panel's pages for the kit's side navigation (@anotoki/lib/ui/side-nav):
   * the dashboard alone, then the groups under their headings. A read-only page
   * says so in its own header (the lookup tables' "Read-only" badge), so the
   * navigation marks only what waits for somebody: the feedback nobody has
   * opened, heard "Feedback, 3 new".
   */
  readonly navGroups = computed<SideNavGroup[]>(() => {
    // Accounts, who may do what here, and where everybody is signed in are the
    // anotoki IAM's now, managed in its console for every anotoki site at once.
    // Left out if the site could not learn where that is.
    const adminUrl = this._security.adminUrl();
    const accounts: SideNavLink[] = adminUrl ? [{ label: 'Accounts & access', href: adminUrl, newTab: true, icon: 'admin-user-group' }] : [];
    // The anotoki library's pages are the ADMIN's alone, and so are their APIs:
    // the Migrations page (@anotoki/lib/migrations), the admin tools
    // (shared/site-admin-tools.ts) and the People page (people.ts) - the
    // owner's decision: EDITORs see none
    // of them.
    const admin = this._security.role() === 'ADMIN';
    const people: SideNavLink[] = admin ? [{ label: 'People', path: 'people', icon: 'admin-user-check' }] : [];
    const tools: SideNavLink[] = admin
      ? [
          { label: 'Feedback', path: 'feedback', icon: 'admin-mail', badge: this._unread.count() || null },
          { label: 'Audit Logs', path: 'audit-logs', icon: 'admin-history' },
          { label: 'Error Log', path: 'errors', icon: 'admin-triangle-alert' },
          { label: 'Files Explorer', path: 'files-explorer', icon: 'admin-computer' },
          { label: 'Migrations', path: 'migrations', icon: 'admin-database' },
          { label: 'Backups', path: 'backups', icon: 'admin-download' },
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
          { label: 'Languages', path: 'languages', icon: 'admin-globe' },
          { label: 'Translations', path: 'translations', icon: 'admin-list' },
          { label: 'Guides', path: 'guides', icon: 'admin-book' },
        ],
      },
      {
        label: 'System',
        links: [...accounts, ...people, { label: 'Site Settings', path: 'settings', icon: 'admin-settings' }, ...tools],
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
  }
}
