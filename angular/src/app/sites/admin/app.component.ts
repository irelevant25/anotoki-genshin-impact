import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { CommonModule } from '@angular/common';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, CommonModule],
})
export class AppComponent implements OnInit {
  navGroups: NavGroup[] = [
    {
      label: 'Database',
      items: [
        { label: 'Characters', path: 'characters', icon: 'fa-solid fa-user-ninja' },
        { label: 'Enemies', path: 'enemies', icon: 'fa-solid fa-skull-crossbones' },
        { label: 'Materials', path: 'materials', icon: 'fa-solid fa-cubes-stacked' },
        { label: 'Artifacts', path: 'artifacts', icon: 'fa-solid fa-ring' },
      ],
    },
    {
      label: 'Lookup Tables',
      items: [
        { label: 'Relationship Types', path: 'relationship-types', icon: 'fa-solid fa-heart' },
        { label: 'Talent Types', path: 'talent-types', icon: 'fa-solid fa-star' },
        { label: 'Food Types', path: 'food-types', icon: 'fa-solid fa-utensils' },
        { label: 'Material Types', path: 'material-types', icon: 'fa-solid fa-cubes' },
        { label: 'Material Groups', path: 'material-groups', icon: 'fa-solid fa-layer-group' },
        { label: 'Regions', path: 'regions', icon: 'fa-solid fa-earth-asia' },
        { label: 'Roles', path: 'roles', icon: 'fa-solid fa-tag' },
        { label: 'Enemy Types', path: 'enemy-types', icon: 'fa-solid fa-skull' },
        { label: 'Domain Levels', path: 'domain-levels', icon: 'fa-solid fa-dungeon' },
        { label: 'Enemy Families', path: 'enemy-families', icon: 'fa-solid fa-dragon' },
        { label: 'Enemy Groups', path: 'enemy-groups', icon: 'fa-solid fa-users-rectangle' },
        { label: 'Stats', path: 'stats', icon: 'fa-solid fa-chart-bar' },
        { label: 'Elements', path: 'elements', icon: 'fa-solid fa-wind', readOnly: true },
        { label: 'Weapon Types', path: 'weapon-types', icon: 'fa-solid fa-shield-halved', readOnly: true },
        { label: 'Voice Over Types', path: 'voice-over-types', icon: 'fa-solid fa-microphone', readOnly: true },
        { label: 'Character States', path: 'character-states', icon: 'fa-solid fa-circle-dot', readOnly: true },
        { label: 'Languages', path: 'languages', icon: 'fa-solid fa-language', readOnly: true },
        { label: 'Rarities', path: 'rarities', icon: 'fa-solid fa-gem', readOnly: true },
        { label: 'Artifact Piece Types', path: 'artifact-piece-types', icon: 'fa-solid fa-puzzle-piece', readOnly: true },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Migrations', path: 'migrations', icon: 'fa-solid fa-database', readOnly: true },
      ],
    },
  ];

  ngOnInit(): void {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
