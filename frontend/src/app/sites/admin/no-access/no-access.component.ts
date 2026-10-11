import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ToastService } from '@anotoki/lib/ui/toast';
import { SecurityService } from '../../../shared/local-lib/services/security.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';

function currentPath(): string {
  return location.pathname + location.search;
}

/**
 * What /admin/... is for somebody it is not for.
 *
 * Signed in without a role here - an ordinary player who followed a link - it
 * says so, and offers the way back to the site, or to sign in as somebody
 * else. Not signed in, it is the page on screen while the guard sends them to
 * the IAM, with a button of its own in case that could not start; and it is
 * what the admin panel turns into when its session ends in another tab.
 *
 * Unlike the rest of the admin panel it is translated: the people who see it
 * are, by definition, not the admins the panel's English is written for - the
 * panel is English for its staff only (shared/site-translations.ts), so this
 * page reads in the reader's own language, and says which itself.
 */
@Component({
  selector: 'app-admin-no-access',
  templateUrl: './no-access.component.html',
  styleUrls: ['./no-access.component.scss'],
  imports: [RouterLink, ButtonComponent, TranslatePipe],
})
export class AdminNoAccessComponent {
  readonly security = inject(SecurityService);
  readonly i18n = inject(TranslationService);
  private readonly _notifications = inject(ToastService);

  readonly user = this.security.currentUser;

  signIn(): void {
    this._start(this.security.login({ returnTo: currentPath() }));
  }

  /**
   * The IAM remembers who is signed in there, so an admin who is signed in to
   * it as somebody else would only come straight back as that somebody. This
   * asks it for the credentials again.
   */
  switchAccount(): void {
    this._start(this.security.login({ returnTo: currentPath(), prompt: 'login' }));
  }

  private _start(start: Promise<void>): void {
    start.catch(() => this._notifications.error(this.i18n.t('auth.startFailed')));
  }
}
