# frontend

The site and its admin panel: Angular 21, standalone components, zoneless,
signals. Its API client (`src/app/api/`) is generated from the backend - `npm run
api` - and never edited by hand.

Everything about it is in the repository root:

- [`../DEVELOPING.md`](../DEVELOPING.md) - running it (`npm start`, on
  `http://localhost:4200`), checking it, and building it (`npm run build:deploy`).
- [`../CLAUDE.md`](../CLAUDE.md) - the conventions: components are always three
  files (`.ts`, `.html`, `.scss`), signals, the local-lib UI kit, i18n, theming.
