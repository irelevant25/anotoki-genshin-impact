// Every page of the site and of its admin panel in a real browser, light and dark, 1280 and 390 px wide -
// screenshots to look at, before and after a change to the pages, and the checks a picture cannot be trusted
// with: a page wider than a phone, an error in the console, a key shown where a word should be.
//
//   node scripts/screenshots.mjs [--out <folder>] [--no-build | --from <build>] [--only <text>] [--widths 1280,390] [--keep]
//
// From frontend/. It builds the site (production, into dist/screenshots; --no-build takes the last one, --from
// a build made elsewhere),
// makes a throwaway site to show it - a database of its own with a little game content in it and a backend
// copy serving it (backend/tests/tools/browser-env.php), the anotoki library's stand-in IAM to sign in at -,
// serves the build and that API on one origin as the hosting does, and drives headless Edge (or Chrome)
// through the pages: the public site as a visitor - Terms, Privacy and Contact in English and Slovak among them -,
// a sign-in the IAM refuses (the anotoki library's screens of it), a legal page while the IAM requires signing in
// (drawn, never the sign-in card), an error thrown in a page (which must reach the site's error log, scrubbed),
// the status page while the site is not ready (STATUS: alone, with nothing of either site's frame round it, and
// the frame back once the site is), then the admin panel as its ADMIN (the Errors page with that error as its
// row, and the row opened; the family's footer under its pages and what it opens). Then it stops all of it and
// drops the database - also when something fails. Nothing here touches your database, your settings, your
// browser or a real IAM.
//
// The screenshots go to --out (default: a folder under the system's temporary one, named at the end), one
// per page, width and theme: `main-home--1280-light.png`, `admin-characters-form--390-dark.png` - the whole
// page, as tall as it is - with `focus-*` ones of the keyboard's focus, and `report.json`, what each page
// said and measured. A page taken in the two pairings (light in English, dark in Slovak) says its language
// too: `status-update-waiting--390-dark-sk.png`. --only keeps the pages whose name holds the text (`--only admin-`).
//
// Needs: PHP 8.2 or later (PHP=<its command>, where `php` is an older one), config/database.local.php in
// backend/ (setup.php writes it: its PostgreSQL server and user are borrowed, never its database), and Edge
// or Chrome (BROWSER=, else where Windows, macOS or Linux usually put them). Ports 8592-8595 must be free, or
// GENSHIN_SHOTS_SITE_PORT, _API_PORT, _IAM_PORT and _BROWSER_PORT name others.

import { execFileSync, spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeBrowser, openPage, sleep, waitFor } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, '..');
const backend = resolve(frontend, '../backend');
const windows = process.platform === 'win32';

const argv = process.argv.slice(2);
const option = (name, fallback = null) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] !== undefined ? argv[at + 1] : fallback;
};
const flag = (name) => argv.includes(name);

function portOf(name, usual) {
  const given = process.env[`GENSHIN_SHOTS_${name}_PORT`];
  const value = Number(given ?? usual);
  if (!Number.isInteger(value) || value < 1024 || value > 65535) {
    throw new Error(`GENSHIN_SHOTS_${name}_PORT is not a port: ${given}`);
  }
  return value;
}
const SITE = portOf('SITE', 8592);
const API = portOf('API', 8593);
const IAM = portOf('IAM', 8594);
const BROWSER = portOf('BROWSER', 8595);
const origin = `http://127.0.0.1:${SITE}`;
const issuer = `http://127.0.0.1:${IAM}`;

const work = mkdtempSync(join(tmpdir(), 'genshin-shots-'));
const out = resolve(option('--out', join(tmpdir(), `genshin-screenshots-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`)));
const only = option('--only');
const widths = (option('--widths', '1280,390') ?? '').split(',').map(Number).filter(Boolean);
// --from: a production build made elsewhere (its folder, which holds browser/), taken as it is.
const build = option('--from') ? resolve(option('--from')) : join(frontend, 'dist', 'screenshots');
const php = process.env.PHP ?? 'php';

// ─────────────────────────────────────────────────────────────────────────────
// The pages. `then` runs once the page has settled - a dialog opened, a tab
// chosen - before its screenshots; `focus` is how many presses of Tab the
// focus shot takes; `data` is where the page shows dotted names that are not
// words to translate (measure()); `widths`, the only widths it is taken at.
// ─────────────────────────────────────────────────────────────────────────────

/** Clicks the first element under `scope` whose own words match `words` (a RegExp source). */
const click = (scope, words) => async (page) =>
  page.evaluate(`(() => {
    const pattern = new RegExp(${JSON.stringify(words)}, 'i');
    const found = [...document.querySelectorAll(${JSON.stringify(scope)})].find((element) => pattern.test(element.textContent.replace(/\\s+/g, ' ').trim()));
    if (!found) return false;
    found.scrollIntoView({ block: 'center' });
    found.click();
    return true;
  })()`);

/** Clicks the first element `selector` matches - a button with no words of its own, named by its aria-label. */
const press = (selector) => async (page) =>
  page.evaluate(`(() => {
    const found = document.querySelector(${JSON.stringify(selector)});
    if (!found) return false;
    found.scrollIntoView({ block: 'center' });
    found.click();
    return true;
  })()`);

/**
 * Types into the first field `selector` matches, as a person would: the field focused, then the words given
 * (Input.insertText) - a search that shows what matches as it is typed.
 */
const typeInto = (selector, words) => async (page) => {
  const focused = await page.evaluate(`(() => {
    const field = document.querySelector(${JSON.stringify(selector)});
    if (!field) return false;
    field.scrollIntoView({ block: 'center' });
    field.focus();
    return document.activeElement === field;
  })()`);
  if (!focused) return false;
  await page.send('Input.insertText', { text: words });
  return true;
};

/** One action after another - a tab, then what folds in it - each given a moment to be drawn. */
const steps =
  (...actions) =>
  async (page) => {
    for (const action of actions) {
      if (!(await action(page))) return false;
      await sleep(700);
    }
    return true;
  };

/**
 * The Privacy page names the hosting company the owner named (GENSHIN_HOSTING in sites/main/legal/legal-facts.ts):
 * WebSupport s.r.o., linked to its own address - the code's, never a string's. A page without it is one to look at.
 */
const hostingNamed = (page) =>
  waitFor(
    page,
    `[...document.querySelectorAll('anotoki-privacy-page [data-recipient] a[href="https://www.websupport.sk"]')].some((a) => a.textContent.trim() === 'WebSupport s.r.o.')`,
    15000,
  );

/**
 * A stored text's markup never runs where it is drawn: Hu Tao's voice-over lines are seeded with an image whose
 * onerror marks the page (backend/tests/tools/browser-env.php) - what anybody who may edit could save, the server
 * keeping a text as it was written. Drawn through the allow-list (rich-html.ts: the HTML editor as it loads the line,
 * the character page's app-rich-text) it never runs; a page where it ran is one to look at. Given a moment, as an
 * image's error comes after it is drawn.
 */
const storedMarkupInert = async (page) => {
  await sleep(1500);
  return page.evaluate("document.documentElement.dataset.storedScript !== 'ran'");
};

const MAIN = [
  { name: 'main-home', path: '/', focus: 4 },
  { name: 'main-daily', path: '/daily' },
  { name: 'main-quizzes', path: '/quizzes' },
  { name: 'main-quiz-banners', path: '/quizzes/banners' },
  { name: 'main-quiz-dish', path: '/quizzes/dish' },
  { name: 'main-quiz-mismatch', path: '/quizzes/mismatch' },
  { name: 'main-quiz-music', path: '/quizzes/music' },
  { name: 'main-quiz-pixelate', path: '/quizzes/pixelate' },
  // The kit's combobox with the characters' pictures, a name begun.
  { name: 'main-quiz-pixelate-search', path: '/quizzes/pixelate', then: typeInto('anotoki-combobox input', 'a') },
  { name: 'main-quiz-voice', path: '/quizzes/voice' },
  { name: 'main-daily-banners', path: '/daily/banners' },
  { name: 'main-games', path: '/games' },
  { name: 'main-game-tournament', path: '/games/tournament' },
  { name: 'main-game-minesweeper', path: '/games/minesweeper' },
  { name: 'main-database', path: '/database' },
  { name: 'main-database-characters', path: '/database/characters', focus: 6 },
  { name: 'main-database-character', path: '/database/characters/1' },
  { name: 'main-database-character-constellations', path: '/database/characters/1', then: click('[role=tab], .tab, app-tab, button', '^(Constellations?|Konštelácie)$') },
  { name: 'main-database-character-voice-overs', path: '/database/characters/1', then: steps(click('[role=tab]', '^Voice'), storedMarkupInert) },
  { name: 'main-database-weapons', path: '/database/weapons' },
  { name: 'main-database-weapon', path: '/database/weapons/1' },
  { name: 'main-database-materials', path: '/database/materials' },
  { name: 'main-database-material', path: '/database/materials/1' },
  { name: 'main-database-banners', path: '/database/banners' },
  { name: 'main-profile', path: '/profile' },
  { name: 'main-staff', path: '/staff' },
  { name: 'main-not-found', path: '/no-such-page' },
  { name: 'main-dialog-account', path: '/', then: click('app-footer a, app-footer button, app-footer .item', '^Account$') },
  { name: 'main-dialog-versions', path: '/', then: click('app-footer a, app-footer button, app-footer .item', '^v\\d') },
  { name: 'main-dialog-backgrounds', path: '/', then: click('app-footer a, app-footer button, app-footer .item', '^Backgrounds$') },
  { name: 'main-dialog-feedback', path: '/', then: click('app-footer a, app-footer button, app-footer .item', '^Feedback') },
  { name: 'main-dialog-whats-new', path: '/', fresh: true },
  { name: 'main-dialog-guide', path: '/quizzes', then: press('button.guide-icon') },
  // The anotoki family's legal pages with genshin's facts (anotoki-lib 0.6), in English and in Slovak (`lang`: the
  // language this browser chose), and the Contact page's feedback form opened in its dialog. The Privacy page must
  // name the hosting company (hostingNamed).
  { name: 'main-terms', path: '/terms' },
  { name: 'main-privacy', path: '/privacy', focus: 3, then: hostingNamed },
  { name: 'main-contact', path: '/contact' },
  { name: 'main-terms-sk', path: '/terms', lang: 'sk' },
  { name: 'main-privacy-sk', path: '/privacy', lang: 'sk', then: hostingNamed },
  { name: 'main-contact-sk', path: '/contact', lang: 'sk' },
  {
    name: 'main-contact-feedback',
    path: '/contact',
    then: steps(press('[data-open-feedback]'), (page) => waitFor(page, "!!document.querySelector('anotoki-dialog dialog[open], dialog[open]')", 10000)),
  },
];

/**
 * A legal page while the IAM requires signing in: drawn for somebody signed out - never the sign-in card, and
 * never a trip to the IAM first (no tokens kept): what the site keeps is said before anybody signs in.
 */
const LEGAL_SIGNED_OUT = [
  {
    name: 'main-privacy-sign-in-required',
    path: '/privacy',
    iam: { login_required: true },
    then: (page) =>
      waitFor(page, "location.pathname === '/privacy' && !!document.querySelector('anotoki-privacy-page h1') && !document.querySelector('app-sign-in-required') && !localStorage.getItem('anotoki-auth:genshin')", 15000),
  },
];

const lookups = [
  'elements',
  'weapon-types',
  'character-states',
  'rarities',
  'artifact-piece-types',
  'relationship-types',
  'talent-types',
  'food-types',
  'material-types',
  'material-groups',
  'regions',
  'roles',
  'enemy-types',
  'domain-levels',
  'enemy-families',
  'enemy-groups',
  'stats',
];

const ADMIN = [
  { name: 'admin-home', path: '/admin', focus: 5 },
  // The activity feed names an action about nothing in particular by itself (migrations.applied).
  { name: 'admin-dashboard', path: '/admin/dashboard', data: '.feed-title' },
  ...['characters', 'enemies', 'materials', 'artifacts', 'weapons', 'foods', 'banners'].flatMap((entity) => [
    { name: `admin-${entity}`, path: `/admin/${entity}`, focus: entity === 'characters' ? 6 : 0 },
    { name: `admin-${entity}-create`, path: `/admin/${entity}/create` },
    { name: `admin-${entity}-edit`, path: `/admin/${entity}/1/edit` },
  ]),
  { name: 'admin-characters-edit-talents', path: '/admin/characters/1/edit', then: click('[role=tab], .tab, app-tab, button', '^Talents$') },
  // The parts that fold (the kit's accordion of disclosures), opened: a voice-over group and its first line; an
  // enemy's drop group.
  {
    name: 'admin-characters-edit-voice-overs',
    path: '/admin/characters/1/edit',
    // The line opened in the HTML editor carries an onerror in its stored text (storedMarkupInert).
    then: steps(
      click('[role=tab]', '^Voice Overs$'),
      press('anotoki-disclosure .anotoki-disclosure__button'),
      press('anotoki-disclosure anotoki-disclosure .anotoki-disclosure__button'),
      storedMarkupInert,
    ),
  },
  { name: 'admin-enemies-edit-drops', path: '/admin/enemies/1/edit', then: steps(click('[role=tab]', '^Drops$'), press('anotoki-disclosure .anotoki-disclosure__button')) },
  // The overlays the panel's pages open: a list's filter of several choices, the question before a delete
  // (answered by nobody - the shot is taken with it open), and on a phone the navigation's drawer.
  { name: 'admin-characters-filter', path: '/admin/characters', then: press('.multiselect-trigger') },
  { name: 'admin-characters-delete', path: '/admin/characters', then: press('button[aria-label="Delete"]') },
  { name: 'admin-menu', path: '/admin/dashboard', data: '.feed-title', widths: [390], then: click('button', '^Menu$') },
  { name: 'admin-image-upload', path: '/admin/characters/1/edit', then: click('button', '^(Upload|Replace)$') },
  // The kit's date field: a birthday's calendar, a day and a month without a year.
  { name: 'admin-characters-edit-birthday', path: '/admin/characters/1/edit', then: press('app-calendar .anotoki-date-field__toggle') },
  // The voice-over import: the kit's file picker for its JSON, and the example under the kit's disclosure.
  { name: 'admin-voice-overs-import', path: '/admin/characters/1/edit', then: steps(click('[role=tab]', '^Voice Overs$'), click('button', 'Import from files')) },
  ...lookups.map((lookup) => ({ name: `admin-lookup-${lookup}`, path: `/admin/${lookup}` })),
  { name: 'admin-backgrounds', path: '/admin/backgrounds' },
  { name: 'admin-files', path: '/admin/files' },
  { name: 'admin-file-categories', path: '/admin/file-categories' },
  { name: 'admin-guides', path: '/admin/guides' },
  { name: 'admin-guides-editor', path: '/admin/guides', then: click('button, a', '^Edit') },
  // The editor's own parts beside the kit's toolbar: the link asked in its dialog, the colour panel (the kit's field).
  { name: 'admin-guides-editor-link', path: '/admin/guides', then: steps(click('button, a', '^Edit'), press('anotoki-rich-text-toolbar button[aria-label="Link"]')) },
  { name: 'admin-guides-editor-colour', path: '/admin/guides', then: steps(click('button, a', '^Edit'), press('button[aria-label="Text colour"]')) },
  { name: 'admin-settings', path: '/admin/settings' },
  { name: 'admin-settings-group', path: '/admin/settings', then: press('button.card') },
  { name: 'admin-settings-routes', path: '/admin/settings', then: click('button.card', '^Parts of the site') },
  { name: 'admin-files-trash', path: '/admin/files', then: click('button', '^Trash$') },
  { name: 'admin-translations', path: '/admin/translations' },
  { name: 'admin-languages', path: '/admin/languages' },
  { name: 'admin-migrations', path: '/admin/migrations' },
  { name: 'admin-feedback', path: '/admin/feedback' },
  { name: 'admin-audit-logs', path: '/admin/audit-logs' },
  // A row: the page's own error the run threw (error-report, below) - and the row opened, its details shown.
  { name: 'admin-errors', path: '/admin/errors', then: (page) => waitFor(page, "!!document.querySelector('anotoki-error-log-page [data-groups] [data-fingerprint]')", 15000) },
  {
    name: 'admin-errors-row',
    path: '/admin/errors',
    then: steps(
      (page) => waitFor(page, "!!document.querySelector('anotoki-error-log-page [data-groups] [data-fingerprint] button[data-toggle]')", 15000),
      press('anotoki-error-log-page [data-groups] [data-fingerprint] button[data-toggle]'),
      (page) => waitFor(page, "!!document.querySelector('anotoki-error-log-page [data-groups] button[data-toggle][aria-expanded=true]')", 10000),
    ),
  },
  { name: 'admin-files-explorer', path: '/admin/files-explorer' },
  { name: 'admin-backups', path: '/admin/backups' },
  { name: 'admin-people', path: '/admin/people' },
  { name: 'admin-not-found', path: '/admin/no-such-page' },
];

/**
 * A sign-in the IAM refuses (the stand-in's `deny`), signed out: the anotoki library's screen of it - which it
 * loads as it is shown, since anotoki-lib 0.5.0 - on the callback's page, and in the sign-in card the site draws
 * while the IAM requires signing in (`<anotoki-sign-in-failure-route>`). `iam` is the stand-in's state for the
 * page, put back after it.
 */
const failureShown = (page) => waitFor(page, "location.pathname === '/auth/callback' && !!document.querySelector('anotoki-sign-in-failure button')", 20000);
const SIGN_IN_FAILED = [
  { name: 'main-sign-in-failed', path: '/admin', iam: { deny: true }, then: failureShown },
  { name: 'main-sign-in-required-failed', path: '/', iam: { deny: true, login_required: true }, then: failureShown },
];

// ─────────────────────────────────────────────────────────────────────────────
// The site while it is not ready: the family's status page alone (anotoki-lib
// 0.6.3, the owner's rule of 2026-10-18). An update waiting, the database out
// of reach, not set up: the gate draws its page in a <main> of its own, and
// both sites' frames - the public site's header, footers and notes, the admin
// panel's navigation and the family's footer - are inside the pages it does
// not make. `closed` is the state a page is shown in (closeSite()), `reopened`
// what must be there once the site is ready again; `pairings` the two the
// owner looks at: light in English, dark in Slovak.
// ─────────────────────────────────────────────────────────────────────────────

/** Whatever of a site's frame could stand round the status page: landmarks, and both sites' parts. */
const FRAME = [
  'header',
  'nav',
  'footer',
  '[role=banner]',
  '[role=navigation]',
  '[role=contentinfo]',
  'app-header',
  'app-footer',
  'app-legal-footer',
  'app-announcement',
  'app-route-notice',
  'app-admin-root',
  'anotoki-side-nav',
  'anotoki-site-footer',
].join(', ');

/** The status page drawn alone: its heading in the gate's <main>, the page's one <main>, nothing of FRAME anywhere. */
const statusAlone = async (page) => {
  if (!(await waitFor(page, "!!document.querySelector('main.anotoki-site-gate__status anotoki-site-status h1')", 20000))) {
    heard.push('the status page was not drawn');
    return true;
  }
  const facts = await page.evaluate(`(() => ({
    frame: [...new Set([...document.querySelectorAll(${JSON.stringify(FRAME)})].map((element) => element.tagName.toLowerCase()))],
    mains: document.querySelectorAll('main').length,
  }))()`);
  if (facts.frame.length) {
    heard.push(`the status page has the site's frame round it: ${facts.frame.join(', ')}`);
  }
  if (facts.mains !== 1) {
    heard.push(`the status page is one of ${facts.mains} <main> elements`);
  }
  return true;
};

/** The public site back once it is ready: its header and its footers, and no status page. */
const publicFrameBack = (page) =>
  waitFor(
    page,
    "!!document.querySelector('app-header') && !!document.querySelector('app-footer') && !!document.querySelector('app-legal-footer') && !document.querySelector('anotoki-site-status')",
    45000,
  );

/** The admin panel back once the site is ready: its navigation and the family's footer, Feedback in it, and no status page. */
const adminFrameBack = (page) =>
  waitFor(
    page,
    "!!document.querySelector('app-admin-root anotoki-side-nav') && !!document.querySelector('app-admin-root anotoki-site-footer [data-open-feedback]') && !document.querySelector('anotoki-site-status')",
    45000,
  );

/**
 * "Try again" on the status page (the database out of reach, not set up): it asks again at once, and loads afresh
 * once the site is ready. While an update waits there is no button: the page asks again by itself every 30
 * seconds, which the frame's wait outlasts.
 */
const triesAgain = (back) => steps(press('anotoki-site-status button'), back);

/**
 * The admin panel's footer (the family's, anotoki-lib 0.6.3) with the parts it shows: "Version" and the
 * changelog's newest, What's new and - while the site can take a message - Feedback; Terms · Privacy · Contact;
 * the fan clause. Anything missing or extra is said.
 */
const adminFooter =
  ({ feedback }) =>
  async (page) => {
    if (!(await waitFor(page, "!!document.querySelector('app-admin-root anotoki-site-footer [data-version]')", 15000))) {
      heard.push('the admin panel has no footer with its version');
      return true;
    }
    const parts = await page.evaluate(`(() => {
      const footer = document.querySelector('app-admin-root anotoki-site-footer');
      return {
        version: footer.querySelector('[data-version]')?.textContent.trim() ?? null,
        whatsNew: !!footer.querySelector('[data-whats-new]'),
        feedback: !!footer.querySelector('[data-open-feedback]'),
        links: [...footer.querySelectorAll('anotoki-legal-links a')].map((a) => a.getAttribute('href')),
        fan: !!footer.querySelector('[data-fan]'),
        inMain: !!footer.closest('main'),
      };
    })()`);
    const expected = { version: `Version ${version}`, whatsNew: true, feedback, links: ['/terms', '/privacy', '/contact'], fan: true, inMain: false };
    if (JSON.stringify(parts) !== JSON.stringify(expected)) {
      heard.push(`the admin footer: ${JSON.stringify(parts)}, not ${JSON.stringify(expected)}`);
    }
    return true;
  };

/** A dialog the footer opened, drawn. */
const dialogOpen = (page) => waitFor(page, "!!document.querySelector('dialog[open]')", 15000);

/** Signed out: the public site's pages, and a legal page, while the site is not ready. */
const STATUS = [
  { name: 'status-update-waiting', path: '/', closed: 'update_pending', pairings: true, then: statusAlone, reopened: publicFrameBack },
  { name: 'status-update-waiting-privacy', path: '/privacy', closed: 'update_pending', pairings: true, then: statusAlone },
  { name: 'status-unavailable', path: '/', closed: 'unavailable', pairings: true, then: statusAlone, reopened: triesAgain(publicFrameBack) },
  { name: 'status-not-set-up', path: '/', closed: 'not_set_up', pairings: true, then: statusAlone, reopened: triesAgain(publicFrameBack) },
];

/** The site's ADMIN while an update waits: the status page alone anywhere but on Migrations, which keeps the panel's frame - its footer without Feedback. */
const ADMIN_STATUS = [
  { name: 'status-admin-update-waiting', path: '/admin/dashboard', data: '.feed-title', closed: 'update_pending', then: statusAlone, reopened: adminFrameBack },
  {
    name: 'admin-migrations-update-waiting',
    path: '/admin/migrations',
    closed: 'update_pending',
    then: steps((page) => waitFor(page, "!!document.querySelector('anotoki-migrations-page')", 15000), adminFooter({ feedback: false })),
  },
];

/** The admin panel's footer, and the two dialogs it opens: the site's What's new, the library's feedback form. */
const ADMIN_FOOTER = [
  { name: 'admin-footer', path: '/admin/settings', then: adminFooter({ feedback: true }) },
  { name: 'admin-footer-whats-new', path: '/admin/settings', then: steps(adminFooter({ feedback: true }), press('app-admin-root anotoki-site-footer [data-whats-new]'), dialogOpen) },
  { name: 'admin-footer-feedback', path: '/admin/settings', then: steps(adminFooter({ feedback: true }), press('app-admin-root anotoki-site-footer [data-open-feedback]'), dialogOpen) },
];

/** After the admin panel: the public site for somebody signed in. */
const SIGNED_IN = [
  { name: 'main-home-signed-in', path: '/' },
  { name: 'main-profile-signed-in', path: '/profile' },
  { name: 'main-privacy-signed-in', path: '/privacy' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Servers
// ─────────────────────────────────────────────────────────────────────────────

const children = [];
let browserStarted = false;

function portFree(port) {
  return new Promise((done) => {
    const probe = createNetServer();
    probe.once('error', () => done(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => done(true)));
  });
}

function run(command, args, options = {}) {
  // npx is npx.cmd on Windows: a batch file, which only a shell runs.
  return execFileSync(command, args, { stdio: 'inherit', shell: windows && command === 'npx', ...options });
}

function start(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'ignore', ...options });
  children.push(child);
  return child;
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new Error('No Edge or Chrome found: set BROWSER to its executable.');
  }
  return found;
}

async function waitForUrl(url, what) {
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(url)).status < 500) {
        return;
      }
    } catch {
      // not up yet
    }
    await sleep(150);
  }
  throw new Error(`${what} did not start (${url}).`);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain',
};

/** The build and the API on one origin, as on the hosting: files where there is one, the API's paths to the backend, index.html for the rest. */
function serveSite(root) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, origin).pathname);
    if (/^\/(api|\.well-known|uploads)(\/|$)/.test(path)) {
      const forward = request({ host: '127.0.0.1', port: API, path: req.url, method: req.method, headers: req.headers }, (answer) => {
        res.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(res);
      });
      forward.on('error', () => {
        res.writeHead(502);
        res.end();
      });
      req.pipe(forward);
      return;
    }
    const file = normalize(join(root, path));
    const inside = file.startsWith(root + sep) && existsSync(file) && statSync(file).isFile();
    const served = inside ? file : join(root, 'index.html');
    res.writeHead(inside || path === '/' || !extname(path) ? 200 : 404, { 'Content-Type': TYPES[extname(served)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (!inside && extname(path)) {
      res.end();
      return;
    }
    createReadStream(served).pipe(res);
  });
  return new Promise((done) => server.listen(SITE, '127.0.0.1', () => done(server)));
}

// ─────────────────────────────────────────────────────────────────────────────
// The pass
// ─────────────────────────────────────────────────────────────────────────────

const report = [];
/** The site's version (its changelog's newest), which the pages are told was seen already. */
let version = '';
let page;
let heard = [];
let inFlight = new Set();

async function setIam(changes) {
  const answer = await fetch(`${issuer}/_test/state`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
  if (!answer.ok) {
    throw new Error(`the stand-in IAM refused its state: ${answer.status}`);
  }
}

/** The backend copy that serves the API (browser-env.php's), once it is up. */
let backendCopy = null;

/**
 * The stand-in IAM's state, and the backend asked afresh: it keeps the IAM's answer about this site (sign-in
 * required or not) for a minute in its storage/cache, which a page about that answer cannot wait for.
 */
async function iamState(changes) {
  await setIam(changes);
  const cache = join(backendCopy, 'storage', 'cache');
  for (const file of existsSync(cache) ? readdirSync(cache) : []) {
    if (/^anotoki-iam-application-.*\.json$/.test(file)) {
      rmSync(join(cache, file), { force: true });
    }
  }
}

/** The lines the error log holds (backend storage/error-log), each as written. */
function errorLogLines() {
  const folder = join(backendCopy, 'storage', 'error-log');
  return (existsSync(folder) ? readdirSync(folder) : [])
    .filter((file) => /^errors-.*\.jsonl$/.test(file))
    .flatMap((file) => readFileSync(join(folder, file), 'utf8').split('\n'))
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

/**
 * The API as it answers while the database is out of reach or the site is not set up - the status path with the
 * state, every other path what the API says then (backend/api/site_state.php, the library's SiteGate) - answered by
 * the browser itself (the DevTools protocol's Fetch, on for these pages alone): the throwaway site could not be
 * made so without touching its settings or its database. Null: the API answers.
 */
let siteAnswers = null;
const ANSWERS = {
  // The gate lets every request through to a database that does not answer: a 500 of the error handler's.
  unavailable: { state: { state: 'unavailable', installed: true }, status: 500, body: { error: 'Internal Server Error' } },
  not_set_up: {
    state: { state: 'not_set_up', installed: false },
    status: 503,
    body: { code: 'not_set_up', installed: false, message: 'This site is not set up yet. Its setup page connects it to its database.', setup: '/setup.php' },
  },
};

/** A paused API request (Fetch.requestPaused): answered as the site's state says, or passed on to the API. */
async function answerPaused(event) {
  const answers = siteAnswers === null ? null : ANSWERS[siteAnswers];
  if (answers === null) {
    await page.send('Fetch.continueRequest', { requestId: event.requestId }).catch(() => undefined);
    return;
  }
  const [status, body] = new URL(event.request.url).pathname === '/api/site-status' ? [200, answers.state] : [answers.status, answers.body];
  await page
    .send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: status,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Cache-Control', value: 'no-store' },
      ],
      body: Buffer.from(JSON.stringify(body)).toString('base64'),
    })
    .catch(() => undefined);
}

/** The migration file a waiting update is: in the backend copy alone, never applied, gone with the copy. */
const waitingMigration = () => join(backendCopy, 'migrations', 'genshin_impact', '999_screenshots_update_waiting.sql');

/**
 * The site made not ready: 'update_pending' by a migration file the throwaway database has not run - the real
 * thing, the API's gate and the Migrations page as they are -, 'unavailable' and 'not_set_up' by the browser
 * answering for the API (siteAnswers).
 */
async function closeSite(state) {
  if (state === 'update_pending') {
    writeFileSync(waitingMigration(), '-- screenshots.mjs: an update that waits, so the site shows it (never applied)\nSELECT 1;\n');
    return;
  }
  siteAnswers = state;
  await page.send('Fetch.enable', { patterns: [{ urlPattern: `${origin}/api/*`, requestStage: 'Request' }] });
}

/** The site ready again. */
async function openSite() {
  rmSync(waitingMigration(), { force: true });
  if (siteAnswers !== null) {
    siteAnswers = null;
    await page.send('Fetch.disable').catch(() => undefined);
  }
}

async function viewport(width, height = width < 1000 ? 844 : 900) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 1000 });
}

/** The page has loaded, the API has answered, and the minimum a loader stays up is over. */
async function settle() {
  await waitFor(page, "document.readyState === 'complete' && !!document.querySelector('app-root')?.children.length", 20000);
  const started = Date.now();
  let quietSince = Date.now();
  while (Date.now() - started < 15000) {
    if (inFlight.size > 0) {
      quietSince = Date.now();
    } else if (Date.now() - quietSince > 700) {
      break;
    }
    await sleep(100);
  }
  await page.evaluate('document.fonts.ready.then(() => true)');
  await sleep(400);
}

/** How tall the page is, counting what scrolls inside it - at most 9000 px. */
const measureHeight = `(() => {
  let tallest = document.documentElement.scrollHeight;
  for (const element of document.querySelectorAll('*')) {
    const style = getComputedStyle(element);
    if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) {
      tallest = Math.max(tallest, element.getBoundingClientRect().top + window.scrollY + element.scrollHeight);
    }
  }
  return Math.min(Math.ceil(tallest), 9000);
})()`;

/**
 * The whole page, as tall as it is. The admin panel scrolls inside a column of its own, so the window is made
 * as tall as the tallest thing that scrolls and then captured, and put back. A taller window can make the page
 * taller again (a list as high as 70vh), so it grows until the page stops growing.
 */
async function capture(file, width) {
  const usual = width < 1000 ? 844 : 900;
  let height = usual;
  for (let round = 0; round < 4; round++) {
    const tall = await page.evaluate(measureHeight);
    if (tall <= height) {
      break;
    }
    height = tall;
    await viewport(width, height);
    await sleep(300);
  }
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(data, 'base64'));
  if (height > usual) {
    await viewport(width);
    await sleep(150);
  }
}

/**
 * What a picture cannot be trusted with. A key is looked for in the page's words only: an admin page shows
 * dotted names as data too - a category's code, a migration's file, a log's action - in code, a table's cells,
 * a select's choices, or where the page's `data` selector says.
 */
async function measure(data) {
  const notWords = ['script', 'style', 'code', 'kbd', 'pre', 'samp', 'td', 'th', 'select', ...(data ? [data] : [])].join(',');
  return page.evaluate(`(() => {
    const width = window.innerWidth;
    const wide = [];
    if (document.documentElement.scrollWidth > width + 1) {
      for (const element of document.querySelectorAll('body *')) {
        const box = element.getBoundingClientRect();
        if (box.width > 0 && box.right > width + 1 && getComputedStyle(element).position !== 'fixed') {
          const name = element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (typeof element.className === 'string' && element.className ? '.' + element.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
          wide.push(name + ' ' + Math.round(box.right));
        }
        if (wide.length >= 6) break;
      }
    }
    const keys = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim();
      if (/^[a-z][a-zA-Z0-9]*(\\.[a-z][a-zA-Z0-9]*)+$/.test(text) && !/^v?\\d/.test(text) && walker.currentNode.parentElement?.closest(${JSON.stringify(notWords)}) === null) {
        keys.push(text);
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, width, wide, keys: [...new Set(keys)].slice(0, 10), title: document.querySelector('h1')?.textContent.trim() ?? null, path: location.pathname };
  })()`);
}

/**
 * What the page finds in this browser's storage before it starts: the theme (the site keeps the device's in
 * `anotoki-genshin-impact-theme` while nobody signed in has one), the language chosen (English, or the entry's
 * `lang`) and, but for the page that shows it, the version last seen - or "What's new" would open over every page.
 */
let bootScript = null;
async function boot(themeName, fresh, lang = 'en') {
  if (bootScript) {
    await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: bootScript });
  }
  // The language this browser chose (`lang`, English unless the page asks for Slovak) - and no `?lang=` held for the
  // tab from an earlier page, which would outrank it.
  const keys = { 'anotoki-genshin-impact-theme': themeName, 'anotoki-genshin-impact-language': lang, ...(fresh ? {} : { 'anotoki-genshin-impact-version': version }) };
  const source = `try { ${Object.entries(keys)
    .map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`)
    .join(' ')} sessionStorage.removeItem('anotoki-genshin-impact-language'); ${fresh ? "localStorage.removeItem('anotoki-genshin-impact-version');" : ''} } catch {}`;
  ({ identifier: bootScript } = await page.send('Page.addScriptToEvaluateOnNewDocument', { source }));
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: themeName }] });
}

async function tab(times) {
  for (let i = 0; i < times; i++) {
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(80);
  }
  await sleep(250);
}

async function visit(entry, width) {
  if (entry.iam) {
    await iamState(entry.iam);
  }
  try {
    await visitAs(entry, width);
  } finally {
    if (entry.iam) {
      await iamState({ deny: false, login_required: false });
    }
  }
}

async function visitAs(entry, width) {
  let facts = null;
  const keys = [];
  const problems = [];
  // Light and dark in the page's language - or the two pairings the owner looks at, light in English and dark in
  // Slovak, each file saying its language.
  const rounds = entry.pairings
    ? [
        ['light', 'en'],
        ['dark', 'sk'],
      ]
    : [
        ['light', entry.lang],
        ['dark', entry.lang],
      ];
  for (const [themeName, lang] of rounds) {
    heard = [];
    await boot(themeName, entry.fresh, lang);
    if (entry.closed) {
      await closeSite(entry.closed);
    }
    try {
      await page.send('Page.navigate', { url: origin + entry.path });
      await settle();
      if (entry.then) {
        const done = await entry.then(page);
        if (!done) {
          heard.push(`could not open what ${entry.name} shows`);
        }
        await settle();
      }
      const measured = await measure(entry.data);
      facts ??= measured;
      keys.push(...measured.keys.filter((key) => !keys.includes(key)));
      await capture(join(out, `${entry.name}--${width}-${themeName}${entry.pairings ? `-${lang}` : ''}.png`), width);
      if (entry.focus && width === 1280) {
        await page.evaluate('document.activeElement?.blur?.(); window.scrollTo(0, 0); true');
        await tab(entry.focus);
        const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(out, `focus-${entry.name}--${width}-${themeName}.png`), Buffer.from(data, 'base64'));
      }
      // The site ready again: the page that stood in for it must give way to the site's own, frame and all.
      if (entry.closed) {
        await openSite();
        if (entry.reopened && !(await entry.reopened(page))) {
          heard.push('the site did not come back, frame and all, once it was ready');
        }
      }
    } finally {
      if (entry.closed) {
        await openSite();
      }
    }
    problems.push(...heard.filter((line) => !problems.includes(line)));
  }
  if (facts.scrollWidth > facts.width + 1) {
    problems.push(`wider than the window: ${facts.scrollWidth} of ${facts.width} (${facts.wide.join(', ')})`);
  }
  if (keys.length) {
    problems.push(`keys where words should be: ${keys.join(', ')}`);
  }
  report.push({ page: entry.name, width, path: facts.path, title: facts.title, problems });
  console.log(`${problems.length ? 'LOOK' : 'ok  '} ${entry.name} ${width}${problems.length ? ' - ' + problems.join(' | ') : ''}`);
}

async function pass(entries) {
  for (const width of widths) {
    await viewport(width);
    for (const entry of entries) {
      if ((only && !entry.name.includes(only)) || (entry.widths && !entry.widths.includes(width))) {
        continue;
      }
      try {
        await visit(entry, width);
      } catch (error) {
        report.push({ page: entry.name, width, problems: [`failed: ${error.message}`] });
        console.log(`FAIL ${entry.name} ${width} - ${error.message}`);
      }
    }
  }
}

let code = 1;
let database = null;
try {
  for (const [name, port] of [
    ['SITE', SITE],
    ['API', API],
    ['IAM', IAM],
    ['BROWSER', BROWSER],
  ]) {
    if (!(await portFree(port))) {
      throw new Error(`Port ${port} is taken: name a free one with GENSHIN_SHOTS_${name}_PORT.`);
    }
  }
  if (!flag('--no-build') && !option('--from')) {
    run('npx', ['ng', 'build', '--configuration', 'production', '--output-path', build], { cwd: frontend });
  }
  const browserRoot = join(build, 'browser');
  version = existsSync(join(browserRoot, 'changelog.json')) ? (JSON.parse(readFileSync(join(browserRoot, 'changelog.json'), 'utf8'))[0]?.version ?? '') : '';
  if (!existsSync(join(browserRoot, 'index.html'))) {
    throw new Error(`There is no build in ${build}: run without --no-build.`);
  }

  const env = JSON.parse(execFileSync(php, ['tests/tools/browser-env.php', 'up', work, issuer], { cwd: backend, encoding: 'utf8' }).trim().split('\n').pop());
  database = env.database;
  backendCopy = env.backend;
  const iamDir = join(work, 'stand-in-iam');
  execFileSync(
    php,
    ['-r', 'require $argv[1] . "/vendor/autoload.php"; \\Anotoki\\Lib\\Auth\\Testing\\TestIam::create($argv[2], $argv[3], "genshin", "screenshots");', '--', env.backend, iamDir, issuer],
    { stdio: 'inherit' },
  );

  start(php, ['-S', `127.0.0.1:${IAM}`, join(env.backend, 'vendor/anotoki/lib/php/testing/stand-in-iam.php')], {
    cwd: iamDir,
    env: { ...process.env, STAND_IN_DIR: iamDir, STAND_IN_ISSUER: issuer },
  });
  start(php, ['-S', `127.0.0.1:${API}`, 'router.php'], { cwd: env.backend });
  const site = await serveSite(browserRoot);
  // --lang: the browser's language decides the one the site starts in, so it is said here, never left to the
  // computer this runs on.
  start(findBrowser(), [
    '--headless=new',
    '--lang=en-GB',
    `--remote-debugging-port=${BROWSER}`,
    `--user-data-dir=${join(work, 'browser')}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,900',
    'about:blank',
  ]);
  browserStarted = true;

  await waitForUrl(`${issuer}/.well-known/openid-configuration`, 'The stand-in IAM');
  // Visitors welcome (genshin's own switch is off), and the person the IAM signs in is the site's ADMIN.
  await setIam({ login_required: false, user: { id: 1, username: 'owner', roles: ['MEMBER', 'ADMIN'] } });
  await waitForUrl(`${origin}/api/site-status`, 'The site');
  await waitForUrl(`http://127.0.0.1:${BROWSER}/json/version`, 'The browser');

  mkdirSync(out, { recursive: true });
  page = await openPage(BROWSER);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');
  page.on('Runtime.exceptionThrown', (e) => heard.push('exception: ' + (e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text ?? '').split('\n')[0]));
  page.on('Runtime.consoleAPICalled', (e) => {
    if (e.type === 'error' || e.type === 'warning') {
      heard.push(
        `console.${e.type}: ` +
          e.args
            .map((a) => a.value ?? a.description ?? '')
            .join(' ')
            .split('\n')[0]
            .slice(0, 300),
      );
    }
  });
  page.on('Network.requestWillBeSent', (e) => inFlight.add(e.requestId));
  page.on('Network.loadingFinished', (e) => inFlight.delete(e.requestId));
  page.on('Network.loadingFailed', (e) => inFlight.delete(e.requestId));
  page.on('Page.javascriptDialogOpening', () => void page.send('Page.handleJavaScriptDialog', { accept: true }));
  // The API's answers while the site is not ready (STATUS): heard only while closeSite() has Fetch on.
  page.on('Fetch.requestPaused', (event) => void answerPaused(event));
  // Nothing leaves this computer: the family's visitor counter (index.html) would count every page drawn here.
  await page.send('Network.setBlockedURLs', { urls: ['https://*', 'http://umami.anotoki.eu/*'] });

  console.log(`Screenshots: ${out}\n`);
  await pass(MAIN);
  await pass(SIGN_IN_FAILED);
  await pass(LEGAL_SIGNED_OUT);
  await pass(STATUS);

  // The browser's errors reach the site's error log (@anotoki/lib/error-report, app.config.ts): one thrown on
  // a page outside Angular's own code - with an address in it, which the report must not carry - is read
  // back from the backend's log, the page's own (source client). Also run for the Errors page's shots, whose
  // row it is.
  if (!only || 'error-report'.includes(only) || 'admin-errors-row'.includes(only)) {
    await viewport(1280);
    await boot('light', false);
    await page.send('Page.navigate', { url: `${origin}/quizzes` });
    await settle();
    const thrown = `screenshots: a thrown error for the error log, from reader@example.test ${Date.now()}`;
    await page.evaluate(`setTimeout(() => { throw new Error(${JSON.stringify(thrown)}); }, 0); true`);
    const marker = thrown.split(' from ')[0];
    let line = null;
    for (let i = 0; i < 40 && line === null; i++) {
      await sleep(250);
      line = errorLogLines().find((entry) => entry.source === 'client' && String(entry.message).startsWith(marker)) ?? null;
    }
    const problems = line === null ? ['a thrown error did not reach the error log'] : [];
    if (line !== null && JSON.stringify(line).includes('reader@example.test')) {
      problems.push('the error log kept the address the error named');
    }
    if (line !== null && line.path !== '/quizzes') {
      problems.push(`the error log names another page: ${line.path}`);
    }
    report.push({ page: 'error-report', width: 1280, path: '/quizzes', title: null, problems });
    console.log(`${problems.length ? 'LOOK' : 'ok  '} error-report 1280${problems.length ? ' - ' + problems.join(' | ') : ` - ${line.type}: ${line.message}`}`);
  }

  // Signing in: the admin panel sends somebody signed out to the IAM, which signs the ADMIN in at once.
  await viewport(1280);
  await page.send('Page.navigate', { url: `${origin}/admin` });
  const signedIn = await waitFor(page, "location.pathname.startsWith('/admin') && !!document.querySelector('app-admin-root')", 30000);
  if (!signedIn) {
    throw new Error('The sign-in did not come back to the admin panel.');
  }
  await settle();
  await pass(ADMIN);
  await pass(ADMIN_FOOTER);
  await pass(ADMIN_STATUS);
  await pass(SIGNED_IN);

  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const looked = report.filter((entry) => entry.problems.length);
  console.log(`\n${report.length} pages, ${looked.length} to look at. ${out}`);
  site.close();
  code = 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  if (page) {
    await page.close().catch(() => undefined);
  }
  if (browserStarted) {
    await closeBrowser(BROWSER);
  }
  for (const child of children) {
    if (child.exitCode === null) {
      if (windows) {
        try {
          execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        } catch {
          // already gone
        }
      } else {
        child.kill('SIGTERM');
      }
    }
  }
  if (database) {
    try {
      execFileSync(php, ['tests/tools/browser-env.php', 'down', database], { cwd: backend, stdio: 'ignore' });
    } catch {
      console.error(`Could not drop ${database}: php tests/tools/browser-env.php down ${database} (in backend/)`);
    }
  }
  if (flag('--keep')) {
    console.log(`Kept: ${work}`);
  } else {
    await sleep(800);
    rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
}
process.exit(code);
