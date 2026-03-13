import { Component } from '@angular/core';

import { ThemeToggleService, Theme } from './theme-toggle.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  showAdvancedOptions = false;
  showStatus = false;

  constructor(public readonly themeToggleService: ThemeToggleService) {}

  toggleTheme(): void {
    this.themeToggleService.toggleTheme();
  }

  onThemeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const theme = target.value as Theme;
    this.themeToggleService.setTheme(theme);
  }
}
