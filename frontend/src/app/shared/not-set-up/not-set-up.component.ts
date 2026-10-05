import { Component, computed, inject } from '@angular/core';
import { ConfigService } from '../local-lib/services/config.service';
import { SiteSettingsService } from '../local-lib/services/site-settings.service';
import { TranslationService } from '../local-lib/i18n/translation.service';

/**
 * What the site is while its installation has no config: one panel saying so,
 * drawn by the root component instead of either site.
 *
 * The API answers every request 503 not_set_up until setup.php has written
 * backend/config/*.local.php (see config/local.php there), so there is nothing
 * else this could show - not even its own words, which live in the database it
 * cannot reach. They come from the strings a reader's browser kept from an
 * earlier visit when it has them (migration users/042), and from the English
 * written here, which is the same text, when it does not.
 */
@Component({
  selector: 'app-not-set-up',
  templateUrl: './not-set-up.component.html',
  styleUrl: './not-set-up.component.scss',
})
export class NotSetUpComponent {
  private readonly _i18n = inject(TranslationService);
  private readonly _config = inject(ConfigService);
  private readonly _settings = inject(SiteSettingsService);

  readonly language = this._i18n.language;

  readonly title = computed(() => this._text('site.notSetUp.title', 'Not set up yet'));

  readonly text = computed(() =>
    this._text('site.notSetUp.text', 'This site is installed but has not been set up, so there is nothing to show here yet.'),
  );

  readonly operator = computed(() =>
    this._text('site.notSetUp.operator', 'Running this site? Its setup page connects it to its database and to the anotoki sign-in.'),
  );

  readonly setup = computed(() => this._text('site.notSetUp.setup', 'Open the setup page'));

  /**
   * The installer, on the site's own origin (the API URL is empty, so this is
   * just /setup.php) - in development ng serve's proxy hands it to the PHP
   * server on :8000.
   */
  readonly setupUrl = computed(() => `${this._config.backendUrl ?? ''}${this._settings.setupPath()}`);

  /** The kept string where there is one, the built-in English where there is not - never the key. */
  private _text(key: string, english: string): string {
    return this._i18n.has(key) ? this._i18n.t(key) : english;
  }
}
