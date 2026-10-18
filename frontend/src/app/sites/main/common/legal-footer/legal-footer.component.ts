import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalLinksComponent } from '@anotoki/lib/legal';
import { TranslatePipe } from '@anotoki/lib/translations';

/**
 * Under every page of the public site - its pages, the closed sign and the
 * sign-in card alike: Terms · Privacy · Contact (the family's
 * <anotoki-legal-links>, @anotoki/lib/legal: the legal pages' own paths, the
 * library's words `anotoki.legalLinks.*`, the open one marked) and the fan
 * clause in genshin's own words (footer.fanDisclaimer, users/055; the owner's
 * decision of 2026-10-13 - the Terms page says it too).
 *
 * In the page's flow, on a veil of its own over the wallpaper, below the
 * page's last panel: the footer's bar of buttons (app-footer) stays fixed to
 * the window's bottom corner on a wide screen, so this keeps clear of it there
 * (its margin), and comes before it on a phone, where that bar is in the flow.
 */
@Component({
  selector: 'app-legal-footer',
  imports: [LegalLinksComponent, TranslatePipe],
  templateUrl: './legal-footer.component.html',
  styleUrl: './legal-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalFooterComponent {}
