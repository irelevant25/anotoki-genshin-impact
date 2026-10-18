import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ANOTOKI_LEGAL_CONFIG } from '@anotoki/lib/legal';
import { siteLegalPagesConfig } from './legal-facts';

/**
 * The legal pages' frame - Terms, Privacy and Contact, the anotoki family's
 * pages (@anotoki/lib/legal/pages, each a lazy route of its own in
 * main.routes.ts): the site's own veiled column (`.container`, as every page
 * of the public site), between its header and its footer, and the pages'
 * facts, which only they read (legal-facts.ts) - loaded with the first of
 * them that is opened, out of the first load.
 *
 * Anybody may read them, signed in or not, a visitor or not, while the IAM
 * requires signing in and while the site is closed for maintenance: what the
 * site keeps, and how to reach whoever runs it, is said before anybody signs
 * in. So no page switch governs them (no routeAccessGuard; the API refuses a
 * row for them, api/site_routes.php), the public shell draws them in place of
 * its sign-in card and closed sign (sites/main/app.component.ts), and the app
 * initializer never sends somebody opening one to the IAM (app.config.ts).
 * While the site is not ready, the family's status page stands instead of
 * them, as instead of every page.
 */
@Component({
  selector: 'app-legal-frame',
  imports: [RouterOutlet],
  providers: [{ provide: ANOTOKI_LEGAL_CONFIG, useFactory: siteLegalPagesConfig }],
  templateUrl: './legal-frame.component.html',
  styleUrl: './legal-frame.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalFrameComponent {}
