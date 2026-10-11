# frontend

The site and its admin panel: Angular 21, standalone components, zoneless,
signals. Its API client (`src/app/api/`) is generated from the backend - `npm run
api` - and never edited by hand.

## Layout

```text
src/app/sites/main/     the public site: database, quizzes, daily, games, profile, sign-in callback;
                        common/ the closed sign (maintenance) and the sign-in card (sign-in-required,
                        while the IAM requires signing in), each drawn instead of the site; the
                        visitor notice (visitor-notice: how long a visitor's games are kept, and
                        Sign in) on the Profile, the quizzes hub and the Daily page; the shell
                        (app.component) says once what happened to a visitor's games, in toasts
src/app/sites/admin/    the admin panel (ADMIN / EDITOR): content, files, the words, settings,
                        backups, the audit log; /admin/translations and /admin/languages are the
                        shared library's pages (@anotoki/lib/translations/admin),
                        localization/guides/ the guides' pages; /admin/migrations is the shared
                        library's Migrations page (ADMIN only)
src/app/shared/         local-lib (the UI kit, abstract bases, the IAM's browser SDK in iam/ -
                        1.2.0, copied from the IAM byte for byte - i18n/ (dates), theme-toggle/;
                        services/: who a request is - issued-as.ts, visitor-key.service.ts (this
                        browser's visitor key and the move at sign-in), saves-in-flight.service.ts,
                        http.interceptor.ts; account-preferences.service.ts - the anotoki account's
                        theme, dates, clock and language, and saving to them); site-status.ts
                        (@anotoki/lib/migrations set up for this site: the gate the root component
                        puts around both sites, its "being updated" and "not set up" pages, the
                        Migrations page - @anotoki/lib/migrations/page, in admin.routes.ts);
                        site-translations.ts (@anotoki/lib/translations set up for this site: the
                        `translate` pipe and TranslationService everywhere, the account's language,
                        the admin pages' notes on guides); dynamic-keys.ts (the keys put together
                        at run time, for `translations.php --status`)
src/app/api/            the generated API client - services, models, types (a player's own
                        routes take a trailing `context?: HttpContext`: whom it is issued as)
public/                 config.json (where the API is: empty - its own origin, here as in
                        production), changelog.json, favicon.png
proxy.conf.json         ng serve hands /api, /.well-known and /setup.php to the PHP server on :8000
scripts/                prepare-deploy.mjs (the production config.json and the SPA .htaccess)
api-config.mjs          corrections for the generator; generate-api.mjs, generate-openapi.mjs
api-spec.json           read from the backend by `npm run api:spec`
```

A component is always three files (`.ts`, `.html`, `.scss`); ESLint refuses an
inline template or styles.

A player's saved games and results go through
`sites/main/features/quizzes/shared/quiz-progress.service.ts`: the account's, this
browser's visitor's (kept by the server under the visitor key) or, while there is
neither, the browser's own. Each request to a player's own routes is issued as the
person or the visitor (`issuedAs()`) - see CLAUDE.md, *Signing in*.

## Commands

```bash
npm start                 # bun ci, then ng serve on http://localhost:4200 with proxy.conf.json
npm run api               # regenerate the API client after a backend change (npm start does not)
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build:deploy      # production -> dist/angular/browser/
```

`@anotoki/lib` - the anotoki sites' shared library - comes from its release's
tarball (the URL in `package.json`); updating it, with its PHP half: `../DEV.md`,
*The shared library*.

Setting up, checking a change, and deploying: [`../DEV.md`](../DEV.md). The
conventions - signals, local-lib, i18n, theming: [`../CLAUDE.md`](../CLAUDE.md).
