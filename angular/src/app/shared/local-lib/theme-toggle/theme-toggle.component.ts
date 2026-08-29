import { Component, inject } from '@angular/core';
import { ThemeToggleService } from './theme-toggle.service';

/** A single button that flips between light and dark. */
@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeToggleService);

  toggle(): void {
    this.theme.toggleTheme();
  }
}
