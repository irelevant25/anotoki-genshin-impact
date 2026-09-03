import { Injectable, inject } from '@angular/core';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { SecurityService } from '../../../../shared/local-lib/services/security.service';
import { SiteChangePasswordModalComponent } from './site-change-password-modal/site-change-password-modal.component';
import { SiteSetPasswordModalComponent } from './site-set-password-modal/site-set-password-modal.component';

/**
 * The gate in front of an account still using a password somebody else chose.
 *
 * An account made by hand in the admin panel arrives with a password read out
 * of a form and passed along - in a message, a chat window, or across a desk.
 * Every one of those is a place it now lives. The server flags such an account
 * and clears the flag the moment its owner picks their own; this is what makes
 * that happen rather than leaving it as a suggestion.
 *
 * It watches the account rather than the sign-in, because the two are not the
 * same moment: a page reloaded on an already-signed-in session never signs in
 * again, and the flag would go unnoticed until the next time somebody did.
 *
 * Which modal depends on whether there is a password to change at all. Almost
 * always there is - the flag exists for admin-made accounts, which have one -
 * but an admin can set it on an account made through Google, and asking such a
 * person for a current password they have never had would be a dead end.
 *
 * Opened once at a time. `watch()` is called from the site's root component,
 * which outlives every page, so re-entering it on each navigation would stack
 * a modal on a modal.
 */
@Injectable({ providedIn: 'root' })
export class ForcedPasswordChangeService {
  private readonly _security = inject(SecurityService);
  private readonly _modals = inject(ModalService);

  /** Whether the gate is up, so a second read does not raise a second one. */
  private _open = false;

  private _watching = false;

  watch(): void {
    if (this._watching) {
      return;
    }
    this._watching = true;

    this._security.currentUserData$.subscribe((user) => {
      if (!user?.force_password_change || this._open) {
        return;
      }

      this._open = true;

      // Static backdrop and no escape key, to match a modal with no cross in
      // its corner. All three or none: a cross that is gone while Escape still
      // works is a gate with a gap in it.
      const modal = user.has_password
        ? this._modals.open(SiteChangePasswordModalComponent, { size: '1', backdrop: 'static', keyboard: false })
        : this._modals.open(SiteSetPasswordModalComponent, { size: '1', backdrop: 'static', keyboard: false });

      if (user.has_password) {
        (modal.componentInstance as SiteChangePasswordModalComponent).forced.set(true);
      }

      // Reopened by the subscription above if the flag is still set - which it
      // is when somebody signed out instead of changing anything, except that
      // signing out clears the account and there is nothing left to reopen for.
      modal.closed.subscribe(() => (this._open = false));
    });
  }
}
