import { Component, inject } from '@angular/core';
import { ThemeToggleService } from './theme-toggle.service';
import { NotificationService } from '../components/notification/notification.service';

/**
 * A single button that flips between light and dark - the admin panel's.
 *
 * The theme is the reader's anotoki account's, so flipping it here flips it on
 * the public site and every other anotoki site too. Its words are English, as
 * the admin panel's are.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeToggleService);
  private readonly _notifications = inject(NotificationService);

  toggle(): void {
    void this.theme.toggleTheme().then((result) => {
      if (result.outcome === 'refused') {
        this._notifications.showError('The theme could not be saved to your account, so it is back as it was. Try again in a moment.');
      }
    });
  }
}
