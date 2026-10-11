import { Component, inject } from '@angular/core';
import { ThemeToggleService } from './theme-toggle.service';
import { ToastService } from '@anotoki/lib/ui/toast';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';

/**
 * A single button that flips between light and dark - the admin panel's.
 *
 * The theme is the reader's anotoki account's, so flipping it here flips it on
 * the public site and every other anotoki site too. Its words are English, as
 * the admin panel's are.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [ButtonComponent, IconComponent, TooltipDirective],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeToggleService);
  private readonly _notifications = inject(ToastService);

  toggle(): void {
    void this.theme.toggleTheme().then((result) => {
      if (result.outcome === 'refused') {
        this._notifications.error('The theme could not be saved to your account, so it is back as it was. Try again in a moment.');
      }
    });
  }
}
