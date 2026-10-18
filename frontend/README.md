# frontend

The site and its admin panel: Angular 21, standalone components, zoneless,
signals. Its API client (`src/app/api/`) is generated from the backend - `npm run
api` - and never edited by hand.

## Layout

```text
src/app/sites/main/     the public site: database, quizzes, daily, games, profile; /auth/callback
                        is the shared library's page (@anotoki/lib/auth: "Signing you in…", or why a
                        sign-in did not work); common/ the closed sign (maintenance) and the
                        sign-in card (sign-in-required, while the IAM requires signing in), each
                        drawn instead of the site; the visitor notice (visitor-notice: how long a
                        visitor's games are kept, and Sign in) on the Profile, the quizzes hub and
                        the Daily page; the footer under every page (footer/: the version, What's
                        new, Feedback - the library's form, loaded when opened -, the account with
                        its wallpapers, Terms · Privacy · Contact, and the fan clause on its left;
                        the links and the clause alone under the closed sign and the card); the shell
                        (app.component) says once what happened to a visitor's games, in toasts;
                        legal/ - /terms, /privacy, /contact: the library's pages
                        (@anotoki/lib/legal/pages) in their frame, with this site's facts
                        (legal-facts.ts), anybody's, each loaded when opened
src/app/sites/admin/    the admin panel (ADMIN / EDITOR): content, files, the words, settings;
                        /admin/translations and /admin/languages are the shared library's pages
                        (@anotoki/lib/translations/admin), localization/guides/ the guides' pages;
                        for the ADMIN alone, the library's /admin/migrations, People
                        (/admin/people, configured in people.ts) and admin tools - Feedback, Audit
                        Logs, Error Log, Files Explorer, Backups (@anotoki/lib/admin/*; the new
                        feedback counted beside Feedback in the navigation); app.component the
                        frame: the kit's side navigation beside the page, in the kit's drawer on a
                        phone (admin-icons.ts: its icons and the forms' tabs'), and the family's
                        footer under every page (@anotoki/lib/footer: the version, What's new - the
                        public footer's dialog -, Feedback, Terms · Privacy · Contact, the fan clause)
src/app/shared/         local-lib (what the family's kit has no piece for: the field adapters over
                        the kit's fields - a birthday mapped to the kit's date field in
                        stored-dates.ts -, the site's own fields (the folder chooser, the HTML editor
                        on the kit's rich-text toolbar), the waypoint loader; the abstract
                        bases; components.scss, the own fields drawn as the kit's; design-tokens.scss,
                        the site's colour names over the kit's tokens; i18n/ (dates), theme-toggle/;
                        services/: security.service.ts - this site's view of the library's sign-in
                        and its own record of the person (/api/me), visitor-key.service.ts (this
                        browser's visitor key and the move at sign-in), http.interceptor.ts (the
                        site's part of a request, before the library's)); site-auth.ts
                        (@anotoki/lib/auth set up for this site: the IAM from the public settings,
                        the sign-in hint, the interceptor, the visitor key on a player's own
                        routes); silent-sign-in.ts (the library's IAM client, noting whether a
                        session was made by the hint's silent sign-in - the visitor's move and the
                        browser's games' carry at sign-in say so, and the server then brings them
                        only into an account with nothing here yet); site-feedback.ts
                        (@anotoki/lib/feedback: the visitors' form's
                        sections and extra fields); site-legal.ts (@anotoki/lib/legal: the legal
                        pages' language and words, their paths); site-admin-tools.ts (@anotoki/lib/admin: the
                        admin tools' configuration, at the app's root, where the library's pages
                        and the feedback count read it); site-status.ts (@anotoki/lib/migrations set up
                        for this site: the gate the root component puts around both sites, its
                        "being updated" and "not set up" pages, the Migrations page -
                        @anotoki/lib/migrations/page, in admin.routes.ts); site-translations.ts
                        (@anotoki/lib/translations set up for this site: the `translate` pipe and
                        TranslationService everywhere, the account's language, the admin pages'
                        notes on guides); dynamic-keys.ts (the keys put together at run time, for
                        `translations.php --status`)
src/app/api/            the generated API client - services, models, types (a player's own
                        routes take a trailing `context?: HttpContext`: whom it is issued as)
public/                 config.json (where the API is: empty - its own origin, here as in
                        production), changelog.json, robots.txt (crawlers kept off /auth/),
                        favicon.png
proxy.conf.json         ng serve hands /api, /.well-known and /setup.php to the PHP server on :8000
scripts/                prepare-deploy.mjs (the production config.json and the SPA .htaccess);
                        screenshots.mjs + cdp.mjs (every page in headless Edge, light and dark,
                        1280 and 390 px, on a throwaway site of its own; a refused sign-in's
                        screens; a thrown error read back from the error log; the status page
                        alone while the site is not ready, and the frame back once it is)
src/styles.scss         the family's styles (@anotoki/lib/styles) in genshin's colours, light and
                        dark - the one palette - then the site's own globals
api-config.mjs          corrections for the generator; generate-api.mjs, generate-openapi.mjs
api-spec.json           read from the backend by `npm run api:spec`
```

A component is always three files (`.ts`, `.html`, `.scss`); ESLint refuses an
inline template or styles.

The pages are drawn with the anotoki family's UI kit (`@anotoki/lib/ui/*`, each
piece from its own entry point, never `@anotoki/lib/ui`) in genshin's colours,
which `styles.scss` gives the family's tokens; `local-lib` keeps only what the
kit has no piece for. See CLAUDE.md, *The kit and the palette*.

A player's saved games and results go through
`sites/main/features/quizzes/shared/quiz-progress.service.ts`: the account's, this
browser's visitor's (kept by the server under the visitor key) or, while there is
neither, the browser's own. Each request to a player's own routes is issued as the
person or the visitor (`issuedAs()`, the library's) - see CLAUDE.md, *Signing in*.

Signing in is the shared library's (`@anotoki/lib/auth`, set up in
`shared/site-auth.ts`): somebody signed in at the anotoki IAM is signed in here
without a click (the IAM's sign-in hint), and every page keeps
`SecurityService`'s signals. Its screens load as they are shown - the closed
sign and the sign-in card embed `<anotoki-sign-in-failure-route>`.

The browser's errors go to the site's error log: `app.config.ts` gives the app
the library's ErrorHandler (`@anotoki/lib/error-report`, with Angular's global
error listeners), which reports each one, scrubbed, through the app's
HttpClient to `POST /api/client-errors`.

## Commands

```bash
npm start                 # bun ci, then ng serve on http://localhost:4200 with proxy.conf.json
npm run api               # regenerate the API client after a backend change (npm start does not)
npm run lint
npx tsc --noEmit -p tsconfig.app.json
cd .. && bun run format:check   # Prettier on every file of both halves, at the root (bun install there first)
node scripts/screenshots.mjs  # every page, light and dark, 1280 and 390 px, on a throwaway site (PHP= a PHP 8.2+)
npm run build:deploy      # production -> dist/angular/browser/
```

`@anotoki/lib` - the anotoki sites' shared library - comes from its release's
tarball (the URL in `package.json`); updating it, with its PHP half: `../DEV.md`,
*The shared library*.

Setting up, checking a change, and deploying: [`../DEV.md`](../DEV.md). The
conventions - signals, the kit and local-lib, i18n, theming: [`../CLAUDE.md`](../CLAUDE.md).
