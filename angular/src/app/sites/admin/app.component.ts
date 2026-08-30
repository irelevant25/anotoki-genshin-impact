import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../../shared/local-lib/theme-toggle/theme-toggle.component';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon?: string;
  readOnly?: boolean;
}

@Component({
  selector: 'app-admin-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, CommonModule, ThemeToggleComponent],
})
export class AppComponent {
  navGroups: NavGroup[] = [
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
        { label: 'Voice Over Types', path: 'voice-over-types', icon: 'icon icon-microphone', readOnly: true },
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
        { label: 'Feedback', path: 'feedback', icon: 'icon icon-mail' },
        { label: 'Audit Logs', path: 'audit-logs', icon: 'icon icon-history', readOnly: true },
        { label: 'Migrations', path: 'migrations', icon: 'icon icon-database', readOnly: true },
      ],
    },
  ];
}
