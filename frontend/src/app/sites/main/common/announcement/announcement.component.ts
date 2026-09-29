import { Component, computed, inject, signal } from '@angular/core';
import { LocalStorageService } from '../../../../shared/local-lib/services/local-storage.service';
import { SiteSettingsService, messageInLanguage } from '../../../../shared/local-lib/services/site-settings.service';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

/** Where the dismissed announcement is remembered, per browser. */
const DISMISSED_KEY = 'announcement-dismissed';

/**
 * A line across the top of every page, when there is something to say.
 *
 * Above the header rather than inside it: this is not navigation, it is the
 * site talking, and it should be the first thing read rather than something
 * found among the links.
 *
 * It can be dismissed, and what is remembered is the message itself rather
 * than the fact of having dismissed one. A notice somebody has read and closed
 * should stay closed; the next notice is a different notice and has not been
 * read. Remembered in this browser only - there is nowhere else to put it for
 * a visitor who has never signed in, and it is a convenience rather than a
 * setting.
 */
@Component({
  selector: 'app-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss'],
  imports: [TranslatePipe],
})
export class AnnouncementComponent {
  private readonly _settings = inject(SiteSettingsService);
  private readonly _i18n = inject(TranslationService);
  private readonly _storage = inject(LocalStorageService);

  private readonly _dismissed = signal(this._storage.read(DISMISSED_KEY) ?? '');

  /**
   * The message in the language being read, or nothing.
   *
   * Written as a computed over both the settings and the language signal, so
   * switching language mid-visit swaps the wording rather than leaving the
   * first one on screen.
   */
  readonly text = computed(() => messageInLanguage(this._settings.announcement()?.message, this._i18n.language()));

  /** info, warning or danger. Anything else is drawn as information. */
  readonly level = computed(() => {
    const level = this._settings.announcement()?.level ?? 'info';

    return ['info', 'warning', 'danger'].includes(level) ? level : 'info';
  });

  readonly visible = computed(() => this.text() !== '' && this.text() !== this._dismissed());

  dismiss(): void {
    this._storage.write(DISMISSED_KEY, this.text());
    this._dismissed.set(this.text());
  }
}
