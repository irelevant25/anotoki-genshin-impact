import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { CommonModule } from '@angular/common';
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
}

@Component({
  selector: 'app-admin-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, CommonModule, ThemeToggleComponent, AdminNoAccessComponent],
})
export class AppComponent {
  private readonly _security = inject(SecurityService);

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

  readonly navGroups = computed<NavGroup[]>(() => {
    // Accounts, who may do what here, and where everybody is signed in are the
    // anotoki IAM's now, managed in its console for every anotoki site at once.
    // Left out if the site could not learn where that is.
    const adminUrl = this._security.adminUrl();
    const accounts: NavItem[] = adminUrl ? [{ label: 'Accounts & access', href: adminUrl, icon: 'icon icon-user-group' }] : [];
    // The Migrations page and its API are the ADMIN's alone (@anotoki/lib/migrations).
    const migrations: NavItem[] = this._security.role() === 'ADMIN' ? [{ label: 'Migrations', path: 'migrations', icon: 'icon icon-database', readOnly: true }] : [];

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
        ],
      },
      {
        label: 'System',
        items: [
          ...accounts,
          { label: 'Site Settings', path: 'settings', icon: 'icon icon-settings' },
          { label: 'Feedback', path: 'feedback', icon: 'icon icon-mail' },
          { label: 'Audit Logs', path: 'audit-logs', icon: 'icon icon-history', readOnly: true },
          { label: 'Error Log', path: 'errors', icon: 'icon icon-triangle-alert', readOnly: true },
          { label: 'Files Explorer', path: 'files-explorer', icon: 'icon icon-computer', readOnly: true },
          ...migrations,
          { label: 'Backups', path: 'backups', icon: 'icon icon-download' },
        ],
      },
    ];
  });
}
