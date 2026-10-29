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
// through the pages: the public site as a visitor - Terms, Privacy, Contact, About and Support in English and Slovak among them,
// the top bar's items opening and closing their sections, the quizzes at saved levels and at the built-in ones when
// asking for them fails, Minesweeper's board opened and played out (a tile's cursor, the contrast of the reaction's
// words and of the tiles' fills) -,
// a sign-in the IAM refuses (the anotoki library's screens of it), a legal page while the IAM requires signing in
// (drawn, never the sign-in card), an error thrown in a page (which must reach the site's error log, scrubbed),
// the status page while the site is not ready (STATUS: alone, with nothing of either site's frame round it, and
// the frame back once the site is), then the admin panel as its ADMIN (the Errors page with that error as its
// row, and the row opened; the Quiz levels page - what the rules say as levels are typed, the words they leave
// behind, a save and back; the admin forms filled and saved, what each sent kept - FORM_SAVES -; the family's footer
// under its pages and what it opens; the Files page's dialogs - Rename, the files not in the database, what Add
// strays to database did, the trash's question over it - on a folder the browser answers for), and last the account panel of
// an account whose preferences the IAM keeps. Then it stops all of it and
// drops the database - also when something fails. Nothing here touches your database, your settings, your
// browser or a real IAM.
//
// The screenshots go to --out (default: a folder under the system's temporary one, named at the end), one
// per page, width and theme: `main-home--1280-light.png`, `admin-characters-form--390-dark.png` - the whole
// page, as tall as it is - with `focus-*` ones of the keyboard's focus, and `report.json`, what each page
// said and measured, and `form-bodies.json`, what each form stage sent. A page taken in the two pairings (light
// in English, dark in Slovak) says its language too: `status-update-waiting--390-dark-sk.png`. --only keeps the
// pages whose name holds the text, or one of several, comma-separated (`--only admin-`, `--only admin-form-,admin-banners-edit`).
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
/** Whom the stand-in IAM signs in: the site's ADMIN, an account whose preferences the IAM keeps none of. */
const OWNER = { id: 1, username: 'owner', roles: ['MEMBER', 'ADMIN'] };

const work = mkdtempSync(join(tmpdir(), 'genshin-shots-'));
const out = resolve(option('--out', join(tmpdir(), `genshin-screenshots-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`)));
// --only: the pages whose name holds one of the comma-separated texts.
const only = option('--only')?.split(',').filter(Boolean) ?? null;
const wanted = (name) => only === null || only.some((text) => name.includes(text));
const widths = (option('--widths', '1280,390') ?? '').split(',').map(Number).filter(Boolean);
// --from: a production build made elsewhere (its folder, which holds browser/), taken as it is.
const build = option('--from') ? resolve(option('--from')) : join(frontend, 'dist', 'screenshots');
const php = process.env.PHP ?? 'php';

// ─────────────────────────────────────────────────────────────────────────────
// The pages. `then` runs once the page has settled - a dialog opened, a tab
// chosen - before its screenshots; `focus` is how many presses of Tab the
// focus shot takes; `data` is where the page shows dotted names that are not
// words to translate (measure()); `widths`, the only widths it is taken at; `answers`, what the browser answers
// API paths with ({'/api/...': {status, body}} - answerApi()) in place of the throwaway database.
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

/** Types over what a field holds, as a person replaces it: all of it selected, then the words given. */
const typeOver = (selector, words) => async (page) => {
  const selected = await page.evaluate(`(() => {
    const field = document.querySelector(${JSON.stringify(selector)});
    if (!field) return false;
    field.scrollIntoView({ block: 'center' });
    field.focus();
    field.select();
    return document.activeElement === field;
  })()`);
  if (!selected) return false;
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
  waitFor(page, `[...document.querySelectorAll('anotoki-privacy-page [data-recipient] a[href="https://www.websupport.sk"]')].some((a) => a.textContent.trim() === 'WebSupport s.r.o.')`, 15000);

/**
 * A stored text's markup never runs where it is drawn: Hu Tao's voice-over lines are seeded with an image whose
 * onerror marks the page (backend/tests/tools/browser-env.php) - what a database written before the server kept every
 * text through the allow-list (backend api/rich_text.php) may still hold. Drawn through the family's allow-list
 * (@anotoki/lib/ui/rich-html: the HTML editor as it loads the line, the character page's <anotoki-rich-html>) it never
 * runs; a page where it ran is one to look at. Given a moment, as an image's error comes after it is drawn.
 */
const storedMarkupInert = async (page) => {
  await sleep(1500);
  return page.evaluate("document.documentElement.dataset.storedScript !== 'ran'");
};

/**
 * The public site's own footer (sites/main/common/footer): the version as text (the changelog's newest), the site's
 * dialogs in their order - What's new, Feedback, the account - and About · Support · Terms · Privacy · Contact as links, and the fan clause;
 * under the closed sign and the sign-in card (`legalOnly`) the links and the clause alone. The two sides side by side
 * on a wide window and stacked on a narrow one - never over each other, nor past the window's edge - and where the bar
 * is fixed, the clause on two lines at most (footer.component.scss: where it is fixed is measured for that). Anything
 * missing, extra, out of order, overlapping or squeezed is said.
 */
const publicFooter =
  ({ legalOnly }) =>
  async (page) => {
    if (!(await waitFor(page, "!!document.querySelector('app-footer .site-footer-fan')", 15000))) {
      heard.push('the public site has no footer');
      return true;
    }
    const facts = await page.evaluate(`(() => {
      const footer = document.querySelector('app-footer footer');
      const items = footer.querySelector('.site-footer-items');
      const fan = footer.querySelector('.site-footer-fan');
      const a = items.getBoundingClientRect();
      const b = fan.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(fan);
      const lines = new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size;
      return {
        lang: document.documentElement.lang,
        version: items.querySelector('.site-footer-version')?.textContent.trim() ?? null,
        buttons: [...items.querySelectorAll(':scope > button')].map((button) => button.textContent.trim()),
        links: [...footer.querySelectorAll('nav a')].map((link) => link.getAttribute('href')),
        fan: fan.textContent.trim() !== '',
        overlap: a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1,
        outside: Math.min(a.left, b.left) < 0 || Math.max(a.right, b.right) > window.innerWidth + 1,
        squeezed: getComputedStyle(footer).position === 'fixed' && lines > 2,
      };
    })()`);
    const words = { en: ["What's new", 'Feedback', 'Account'], sk: ['Čo je nové', 'Spätná väzba', 'Účet'] }[facts.lang] ?? [];
    const expected = {
      lang: facts.lang,
      version: legalOnly ? null : `v${version}`,
      buttons: legalOnly ? [] : words,
      links: ['/about', '/support', '/terms', '/privacy', '/contact'],
      fan: true,
      overlap: false,
      outside: false,
      squeezed: false,
    };
    if (JSON.stringify(facts) !== JSON.stringify(expected)) {
      heard.push(`the public footer: ${JSON.stringify(facts)}, not ${JSON.stringify(expected)}`);
    }
    return true;
  };

/** The account panel open from the footer - its Background row's button, which opens the wallpapers' window, drawn. */
const accountOpen = steps(click('app-footer button', '^(Account|Účet)$'), (page) => waitFor(page, "!!document.querySelector('dialog[open] button[aria-haspopup=dialog]')", 15000));

/**
 * The account panel of somebody signed in whose anotoki account keeps the preferences (ACCOUNT_KEPT): the appearance,
 * the language and the wallpaper to choose, and the line saying the first two are the account's - no dates or clock,
 * which only the IAM's account page sets since the owner's decision of 2026-10-22 - and the member-since date written
 * in the account's own order all the same (@anotoki/lib/ui/dates): `ymd_dash` in English, `dmy_dot` in Slovak. Anything else is
 * said.
 */
const accountPanelKept = async (page) => {
  // Signed in, the footer's button says the person's name: found by its class rather than its words.
  const opened = steps(press('app-footer button.site-footer-account'), (open) => waitFor(open, "!!document.querySelector('dialog[open] button[aria-haspopup=dialog]')", 15000));
  if (!(await opened(page))) {
    return false;
  }
  const facts = await page.evaluate(`(() => {
    const dialog = document.querySelector('dialog[open]');
    return {
      lang: document.documentElement.lang,
      rows: [...dialog.querySelectorAll('.theme-row-label')].map((label) => label.textContent.trim()),
      notes: dialog.querySelectorAll('.account-note').length,
      since: dialog.querySelector('.fact .icon-calendar')?.closest('.fact').querySelector('.fact-value')?.textContent.trim() ?? null,
    };
  })()`);
  const rows = { en: ['Appearance', 'Language', 'Background'], sk: ['Vzhľad', 'Jazyk', 'Pozadie'] }[facts.lang] ?? [];
  const order = { en: /^\d{4}-\d{2}-\d{2}$/, sk: /^\d{1,2}\.\d{1,2}\.\d{4}$/ }[facts.lang] ?? /^$/;
  if (JSON.stringify(facts.rows) !== JSON.stringify(rows) || facts.notes !== 2 || !order.test(facts.since ?? '')) {
    heard.push(`the account panel signed in: ${JSON.stringify(facts)}, not the rows ${JSON.stringify(rows)}, the account's line and the sign-out's, and the account's date order`);
  }
  return true;
};

/** WCAG's contrast of two colours as getComputedStyle writes them (rgb() or rgba(), the alpha left out), to two places. */
function contrastOf(first, second) {
  const luminance = (colour) => {
    const [r, g, b] = (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map((part) => {
      const channel = Number(part) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/**
 * Minesweeper (sites/main/features/games/minesweeper) dealt - Math.random seeded first, so every run deals the same
 * board - and opened with a press in the board's middle; with `playedOut`, then played until the game is over (the
 * first tile a press acts on, again and again). What a picture cannot be trusted with is said, and what was measured
 * kept in report.json: a tile shows the pointer exactly when a press acts on it (`.clickable` - none once the game is
 * over); the reaction line's name and each element's word read 4.5:1 on what is behind them (WCAG 1.4.3); a covered
 * tile a press acts on 3:1 from the cleared patch (1.4.11), and where the dimmed tiles are opaque, 3:1 from them too,
 * and a dimmed tile 3:1 from the cleared patch by its fill or by the ring round it.
 */
const minesweeperBoard =
  ({ playedOut }) =>
  async (page) => {
    // mulberry32: the game asks Math.random for the reaction, the opening patch and every element.
    await page.evaluate(`(() => {
      let seed = 20261022;
      Math.random = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      return true;
    })()`);
    if (!(await click('app-games-minesweeper button', '^(Start|Začať)$')(page))) {
      return false;
    }
    await sleep(500);
    const opened = await page.evaluate("(() => { const cells = document.querySelectorAll('app-games-minesweeper .cell'); cells[Math.floor(cells.length / 2)]?.click(); return cells.length > 0; })()");
    if (!opened) {
      return false;
    }
    await sleep(500);
    if (playedOut) {
      await page.evaluate(`(async () => {
        for (let i = 0; i < 400 && !document.querySelector('app-games-minesweeper .result'); i++) {
          document.querySelector('app-games-minesweeper .cell.clickable')?.click();
          await new Promise((done) => setTimeout(done, 40));
        }
        return true;
      })()`);
      await sleep(500);
    }
    const facts = await page.evaluate(`(() => {
      const board = document.querySelector('app-games-minesweeper');
      const style = (element) => getComputedStyle(element);
      // What is drawn behind an element: its own fill, or the nearest one round it.
      const ground = (element) => {
        for (let at = element; at; at = at.parentElement) {
          const fill = style(at).backgroundColor;
          if (fill !== 'transparent' && fill !== 'rgba(0, 0, 0, 0)') return fill;
        }
        return 'rgb(255, 255, 255)';
      };
      const tile = (selector) => {
        const cell = board.querySelector(selector);
        return cell ? { fill: style(cell).backgroundColor, opacity: Number(style(cell).opacity), shadow: style(cell).boxShadow } : null;
      };
      const cells = [...board.querySelectorAll('.cell')];
      const name = board.querySelector('.reaction-name');
      return {
        over: !!board.querySelector('.result'),
        pressable: cells.filter((cell) => cell.classList.contains('clickable')).length,
        pointerWrong: cells.filter((cell) => (style(cell).cursor === 'pointer') !== cell.classList.contains('clickable')).length,
        name: name ? { text: style(name).color, ground: ground(name) } : null,
        words: [...board.querySelectorAll('.reaction-elements > span:not(.reaction-plus)')].map((word) => ({ word: word.textContent.trim(), text: style(word).color, ground: ground(word) })),
        covered: tile('.cell.clickable:not(.revealed)'),
        dimmed: tile('.cell:not(.clickable):not(.revealed)'),
        revealed: tile('.cell.element-empty'),
      };
    })()`);
    const wrong = [];
    if (facts.pointerWrong > 0) wrong.push(`${facts.pointerWrong} tiles with a cursor that says otherwise than whether a press acts on them`);
    if (playedOut && !facts.over) wrong.push('the game never ended');
    if (playedOut && facts.pressable > 0) wrong.push(`${facts.pressable} tiles still pressable once the game is over`);
    const name = facts.name === null ? 0 : contrastOf(facts.name.text, facts.name.ground);
    const words = facts.words.map((word) => ({ word: word.word, ratio: contrastOf(word.text, word.ground) }));
    if (name < 4.5) wrong.push(`the reaction's name ${name}:1`);
    if (words.length !== 2 || words.some((word) => word.ratio < 4.5)) wrong.push(`the reaction's words ${words.map((word) => `${word.word} ${word.ratio}:1`).join(', ')}`);
    // A dimmed tile is measured only where it is opaque: through one that is not, the wallpaper shows. Its ring is the
    // inset one of its box-shadow, where it has one.
    const opaque = facts.dimmed?.opacity === 1;
    const ring = (opaque && facts.dimmed.shadow.match(/(rgba?\([^)]*\))[^,]*\binset\b/)?.[1]) || null;
    const tiles = [
      ...(facts.covered && facts.revealed ? [{ pair: 'covered/revealed', ratio: contrastOf(facts.covered.fill, facts.revealed.fill) }] : []),
      ...(facts.covered && opaque ? [{ pair: 'covered/dimmed', ratio: contrastOf(facts.covered.fill, facts.dimmed.fill) }] : []),
      ...(opaque && facts.revealed ? [{ pair: 'dimmed/revealed', ratio: contrastOf(facts.dimmed.fill, facts.revealed.fill), apart: true }] : []),
      ...(ring && facts.revealed ? [{ pair: "dimmed's ring/revealed", ratio: contrastOf(ring, facts.revealed.fill), apart: true }] : []),
    ];
    const measuredTiles = tiles.map((tile) => `${tile.pair} ${tile.ratio}:1`).join(', ') || 'nothing covered to measure';
    // The dimmed tile and the cleared patch: apart by the fill or by the ring - either one 3:1 is enough.
    const dimmedApart = tiles.filter((tile) => tile.apart);
    if (tiles.some((tile) => !tile.apart && tile.ratio < 3) || (dimmedApart.length > 0 && Math.max(...dimmedApart.map((tile) => tile.ratio)) < 3)) {
      wrong.push(`the tiles: ${measuredTiles}`);
    }
    noted.push(`the reaction's name ${name}:1, its words ${words.map((word) => `${word.word} ${word.ratio}:1`).join(', ')}; the tiles: ${measuredTiles}`);
    if (wrong.length) {
      heard.push(`Minesweeper: ${wrong.join('; ')}`);
    }
    return true;
  };

/**
 * The character page's facts that name another thing or a day (sites/main/features/database/characters/detail): the
 * special dish as the dish itself - its picture, the food's own normal icon (`special_dish_icon`), never a file named
 * after the dish, and its name, never its id - and the birthday as a day and a month in the page's language, never the
 * stored date, whose year means nothing. Hu Tao's, as the throwaway site seeds them: Ghostly March and its icon
 * "GHOSTLY_MARCH - normal" (catalogued, the file not there: the picture hides itself and keeps its address), the 15th
 * of July. Anything else is said.
 */
const characterFacts = async (page) => {
  if (!(await waitFor(page, "!!document.querySelector('app-database-character-detail app-detail-facts .fact')", 15000))) {
    return false;
  }
  const facts = await page.evaluate(`(() => {
    const rows = [...document.querySelectorAll('app-database-character-detail app-detail-facts .fact')];
    const row = (label) => rows.find((div) => new RegExp(label).test(div.querySelector('.fact-label')?.textContent ?? ''));
    const dish = row('^(Special dish|Špeciálne jedlo)');
    return {
      lang: document.documentElement.lang,
      dish: dish?.querySelector('.fact-value')?.textContent.replace(/\\s+/g, ' ').trim() ?? null,
      picture: decodeURIComponent(dish?.querySelector('img.fact-icon')?.getAttribute('src') ?? ''),
      // The birthday is one of the hero's tiles since the detail pages' new look.
      birthday: [...document.querySelectorAll('app-database-character-detail app-detail-hero .stat')].find((div) => /^(Birthday|Narodeniny)$/.test(div.querySelector('.stat-label')?.textContent.trim() ?? ''))?.querySelector('.stat-value')?.textContent.trim() ?? null,
    };
  })()`);
  // English as the page's locale orders it: "15 July" where it is British, "July 15" where it is not. The picture's
  // address as the page writes it: the assets' folder, wherever the site's root puts it.
  const wanted = { dish: 'Ghostly March', picture: 'assets/foods/GHOSTLY_MARCH - normal.avif', birthday: { en: ['15 July', 'July 15'], sk: ['15. júla'] }[facts.lang] ?? [] };
  if (facts.dish !== wanted.dish || !facts.picture.endsWith(wanted.picture) || !wanted.birthday.includes(facts.birthday)) {
    heard.push(`the character page's facts: ${JSON.stringify(facts)}, not ${JSON.stringify(wanted)}`);
  }
  return true;
};

/**
 * The top bar's items open and close their sections (sites/main/common/header, the owner's decision of 2026-10-21): on a
 * section's own page its item leads home and is the page (aria-current="page"), on a page inside the section it leads to
 * the section's page and is the current one (aria-current="true"), anywhere else it opens the section - its address
 * saying where it goes, so hovering it says so - and the open section's item is marked. Enter on it, from the keyboard,
 * goes there. Anything else is said.
 */
const topBarItem =
  (section, { href, current, goes }) =>
  async (page) => {
    const link = `app-header a[data-section="${section}"]`;
    if (!(await waitFor(page, `!!document.querySelector(${JSON.stringify(link)})`, 15000))) {
      heard.push(`the top bar has no ${section} item`);
      return true;
    }
    const facts = await page.evaluate(`(() => {
      const link = document.querySelector(${JSON.stringify(link)});
      return { href: link.getAttribute('href'), current: link.getAttribute('aria-current'), marked: link.closest('li').classList.contains('active') };
    })()`);
    const expected = { href, current, marked: current !== null };
    if (JSON.stringify(facts) !== JSON.stringify(expected)) {
      heard.push(`the top bar's ${section} item: ${JSON.stringify(facts)}, not ${JSON.stringify(expected)}`);
    }
    await page.evaluate(`document.querySelector(${JSON.stringify(link)}).focus(); true`);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    if (!(await waitFor(page, `location.pathname === ${JSON.stringify(goes)}`, 10000))) {
      heard.push(`the top bar's ${section} item: Enter went to ${await page.evaluate('location.pathname')}, not ${goes}`);
    }
    return true;
  };

/** Five steps of a level, try 0 to 4, each with what it hides. */
const fiveTries = (...effects) => effects.map((effect, index) => ({ try: index, ...effect }));

/**
 * Levels as an ADMIN might save them on the Quiz levels page (the server's rules take them): Pixelate's Easy grid from
 * 9 blocks across, four characters on every level of Mismatch, Voice's Medium 0.5, 1.5 and 3 seconds of the recording
 * and its Hard one piece where its sentence names two (said in general words). The browser answers GET /api/quiz/levels
 * with them for an entry's `levels`, as the API does once they are saved.
 */
const SAVED_LEVELS = (() => {
  const picture = {
    1: { triesMax: 5, triesEffects: fiveTries({ class: 'shown-half' }, {}, {}, {}, {}) },
    2: { triesMax: 5, triesEffects: fiveTries({ class: 'shown-half shown-grey-blurred' }, { class: 'shown-grey-blurred' }, { class: 'shown-grey' }, {}, {}) },
    3: {
      triesMax: 5,
      triesEffects: fiveTries(
        { class: 'shown-quarter shown-grey-blurred-more' },
        { class: 'shown-half shown-grey-blurred-more' },
        { class: 'shown-half shown-grey-blurred' },
        { class: 'shown-grey-blurred' },
        { class: 'shown-grey' },
      ),
    },
  };
  const seconds = (...data) => ({ triesMax: 5, triesEffects: fiveTries(...data.map((value) => (value === null ? {} : { data: value }))) });
  return {
    banners: picture,
    pixelate: { 1: seconds(9, 12, 17, 22, 27), 2: seconds(6, 10, 14, 18, 22), 3: seconds(5, 8, 11, 14, 17) },
    // Four characters on every level, what they share the same on each: the check is about the count.
    mismatch: Object.fromEntries([1, 2, 3].map((level) => [level, { choicesAmount: 4, properties: ['element', 'weapon', 'region'], blend: 1 }])),
    music: { 1: seconds(5, 10, 15, 20, null), 2: seconds(3, 6, 9, 12, 15), 3: seconds(2, 4, 6, 8, 10) },
    dish: picture,
    voice: {
      1: { triesMax: 5, triesEffects: fiveTries({ class: 'half-text hidden-audio' }, { class: 'hidden-audio' }, { data: 0.5 }, {}, {}) },
      2: { triesMax: 5, triesEffects: fiveTries({ class: 'half-text hidden-audio' }, { class: 'hidden-audio' }, { data: 0.5 }, { data: 1.5 }, { data: 3 }) },
      3: { triesMax: 5, triesEffects: fiveTries({ class: 'quarter-text hidden-audio' }, { class: 'half-text hidden-audio' }, { class: 'hidden-audio' }, { data: 0.5 }, {}) },
    },
  };
})();

/**
 * Mismatch at the levels in force (QuizLevelsService): as many characters as the level its badge shows has in `byLevel`
 * - the saved levels' four, or the built-in 3, 4 and 5 when asking for them failed - and a question drawn either way.
 * A question an earlier page left keeps its own set, so it is answered first and the next one drawn.
 */
const mismatchChoices = (byLevel) => async (page) => {
  if (!(await waitFor(page, "document.querySelectorAll('app-quizzes-mismatch .character-choice').length > 0", 20000))) {
    heard.push('Mismatch drew no question');
    return true;
  }
  await page.evaluate("document.querySelector('app-quizzes-mismatch .character-choice:not(:disabled)')?.click(); true");
  await sleep(400);
  if (!(await click('app-quizzes-mismatch button', '^Next$')(page))) {
    heard.push('Mismatch offered no next question');
    return true;
  }
  await sleep(600);
  const facts = await page.evaluate(
    "({ level: document.querySelector('app-quiz-difficulty .quiz-difficulty')?.className ?? '', choices: document.querySelectorAll('app-quizzes-mismatch .character-choice').length })",
  );
  const level = /level-hard/.test(facts.level) ? 'hard' : /level-medium/.test(facts.level) ? 'medium' : 'easy';
  if (facts.choices !== byLevel[level]) {
    heard.push(`Mismatch at ${level}: ${facts.choices} characters, not ${byLevel[level]}`);
  }
  return true;
};

/** The difficulty dialog open, its levels' words holding each of `words` - the numbers of the levels in force. */
const dialogSays = (words) => async (page) => {
  if (!(await waitFor(page, "!!document.querySelector('dialog[open] anotoki-radio-group')", 15000))) {
    return false;
  }
  const text = await page.evaluate("document.querySelector('dialog[open] anotoki-radio-group').textContent.replace(/\\s+/g, ' ')");
  for (const word of words) {
    if (!text.includes(word)) {
      heard.push(`the difficulty dialog does not say "${word}": ${text.slice(0, 300)}`);
    }
  }
  return true;
};

/** The Quiz levels page's editor, typed into: its text with each [from, to] replaced (the first of each), as an input. */
const editLevels =
  (...replacements) =>
  async (page) => {
    if (!(await waitFor(page, "(document.querySelector('app-admin-quiz-levels textarea')?.value ?? '').includes('banners')", 15000))) {
      return false;
    }
    return page.evaluate(`(() => {
      const area = document.querySelector('app-admin-quiz-levels textarea');
      area.value = ${JSON.stringify(replacements)}.reduce((text, [from, to]) => text.replace(from, to), area.value);
      area.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
  };

/**
 * What the Quiz levels page says once the server's rules have answered: its verdict, the problems - each with its place,
 * the quiz, the level and the try -, the words the levels leave behind, the field's own error, whether Save may be
 * pressed. Each expectation given is held to; anything else is said.
 */
const levelsPageSays =
  ({ verdict, problems = [], warnings = [], field = null, saveDisabled }) =>
  async (page) => {
    const asked = "document.querySelector('app-admin-quiz-levels .levels-verdict')?.textContent ?? 'Asking'";
    if (!(await waitFor(page, `!/Asking/.test(${asked})`, 15000))) {
      heard.push('the Quiz levels page never said what the rules say');
      return true;
    }
    const facts = await page.evaluate(`(() => {
      const host = document.querySelector('app-admin-quiz-levels');
      const words = (element) => (element?.textContent ?? '').replace(/\\s+/g, ' ').trim();
      return {
        verdict: words(host.querySelector('.levels-verdict')),
        problems: [...host.querySelectorAll('.levels-report:not(.levels-report--warnings) .levels-list li')].map(words),
        warnings: [...host.querySelectorAll('.levels-report--warnings .levels-list li')].map(words),
        field: host.querySelector('.anotoki-field__error') ? words(host.querySelector('.anotoki-field__error')) : null,
        saveDisabled: host.querySelector('.levels-actions button')?.disabled ?? null,
      };
    })()`);
    const wrong = [];
    if (!verdict.test(facts.verdict)) wrong.push(`the verdict "${facts.verdict}"`);
    if (problems.length !== facts.problems.length || problems.some((said) => !facts.problems.some((line) => line.startsWith(said)))) wrong.push(`the problems ${JSON.stringify(facts.problems)}`);
    if (warnings.length !== facts.warnings.length || warnings.some((said) => !facts.warnings.some((line) => line.startsWith(said)))) wrong.push(`the warnings ${JSON.stringify(facts.warnings)}`);
    if (field === null ? facts.field !== null : !field.test(facts.field ?? '')) wrong.push(`the field's error ${JSON.stringify(facts.field)}`);
    if (facts.saveDisabled !== saveDisabled) wrong.push(`Save ${facts.saveDisabled ? 'disabled' : 'enabled'}`);
    if (wrong.length) {
      heard.push(`the Quiz levels page: ${wrong.join(', ')}`);
    }
    return true;
  };

/**
 * A save on the Quiz levels page, and back: Save once the rules say nothing - the levels in force, the pages reading them
 * (GET /api/quiz/levels) -, then "Back to the defaults", confirmed - the built-in levels in force again, nothing for the
 * pages to read. Both are audited by the server (backend tests/quiz-levels.test.php holds that).
 */
const savedAndBack = async (page) => {
  const state = "document.querySelector('app-admin-quiz-levels .levels-state')?.textContent ?? ''";
  if (!(await waitFor(page, "document.querySelector('app-admin-quiz-levels .levels-actions button')?.disabled === false", 15000))) {
    heard.push('Save never became pressable');
    return true;
  }
  await page.evaluate("document.querySelector('app-admin-quiz-levels .levels-actions button').click(); true");
  if (!(await waitFor(page, `/In force: the levels saved/.test(${state})`, 15000))) {
    heard.push('a save did not put the levels in force');
  }
  const read = await page.evaluate("fetch('/api/quiz/levels').then((answer) => answer.json()).then((body) => body.levels?.mismatch?.['1']?.choicesAmount ?? null)");
  if (read !== 4) {
    heard.push(`after the save the pages read Mismatch's Easy as ${read}, not 4`);
  }
  await click('app-admin-quiz-levels .levels-actions button', '^Back to the defaults$')(page);
  await sleep(500);
  await click('dialog[open] button', '^Back to the defaults$')(page);
  if (!(await waitFor(page, `/In force: the built-in levels/.test(${state})`, 15000))) {
    heard.push('Back to the defaults did not put the built-in levels in force');
  }
  if ((await page.evaluate("fetch('/api/quiz/levels').then((answer) => answer.json()).then((body) => body.levels)")) !== null) {
    heard.push('after Back to the defaults the pages still read saved levels');
  }
  return true;
};

/** What the administrators announce, in both of the site's languages. */
const ANNOUNCEMENT_MESSAGE = { en: 'New banners arrive on Wednesday - the Daily keeps your streak meanwhile.', sk: 'Nové bannery prídu v stredu - Denný kvíz ti dovtedy drží sériu.' };

/**
 * robots.txt and sitemap.xml, as the throwaway site's PHP answers them (backend/api/robots.php - the copy names the
 * throwaway site's address in config/app.local.php, as a host served at another address would): robots.txt keeping
 * crawlers out of /staff and naming the sitemap at the site's own address; the sitemap listing the public pages and
 * the database's entries with their own pages, each at that address. Both kept beside the screenshots; anything else
 * is said.
 */
const robotsAndSitemap = async (page) => {
  const read = await page.evaluate(
    `Promise.all(['/robots.txt', '/sitemap.xml'].map((path) => fetch(path).then(async (answer) => ({ path, status: answer.status, type: answer.headers.get('Content-Type'), text: await answer.text() }))))`,
  );
  for (const answer of read) {
    writeFileSync(join(out, answer.path.slice(1)), answer.text);
    noted.push(`${answer.path}: ${answer.status} ${answer.type}, ${answer.text.length} characters`);
  }
  const [robots, sitemap] = read;
  const locs = [...sitemap.text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
  noted.push(`the sitemap's addresses: ${locs.length}, ${locs.filter((loc) => loc.includes('/database/')).length} under /database/`);
  if (robots.status !== 200 || !/Disallow: \/staff/.test(robots.text) || !robots.text.includes(`Sitemap: ${origin}/sitemap.xml`)) {
    heard.push(`robots.txt: ${robots.status} ${JSON.stringify(robots.text.slice(0, 300))}`);
  }
  if (sitemap.status !== 200 || !locs.includes(`${origin}/`) || !locs.some((loc) => /\/database\/characters\/\d+$/.test(loc)) || locs.some((loc) => !loc.startsWith(origin))) {
    heard.push(`sitemap.xml: ${sitemap.status}, ${locs.length} addresses: ${locs.slice(0, 6).join(' ')}`);
  }
  return true;
};

const MAIN = [
  { name: 'main-home', path: '/', focus: 4 },
  // The administrators' announcement (the site settings' second part): the bar over the site's header, in the
  // reader's language - the browser answering GET /api/site-settings as the API does once one is shown.
  {
    name: 'main-announcement',
    path: '/',
    pairings: true,
    answers: { '/api/site-settings': { status: 200, body: { maintenance: false, announcement: { level: 'info', message: ANNOUNCEMENT_MESSAGE }, pages: [] } } },
    then: (page) =>
      waitFor(
        page,
        `!!document.querySelector('anotoki-announcement') && [${JSON.stringify(ANNOUNCEMENT_MESSAGE.en)}, ${JSON.stringify(ANNOUNCEMENT_MESSAGE.sk)}].some((words) => document.querySelector('anotoki-announcement').textContent.includes(words))`,
        15000,
      ),
  },
  { name: 'main-robots-sitemap', path: '/', widths: [1280], then: robotsAndSitemap },
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
  // The badge above a quiz's question opens the quiz's difficulty dialog (loaded with the press): every level, what
  // each one shows - light in English, dark in Slovak.
  {
    name: 'main-quiz-difficulty',
    path: '/quizzes/banners',
    pairings: true,
    then: steps(press('app-quiz-difficulty button'), (page) => waitFor(page, "!!document.querySelector('dialog[open] anotoki-radio-group')", 15000)),
  },
  { name: 'main-daily-banners', path: '/daily/banners' },
  // The quizzes play the levels in force (QuizLevelsService): saved ones as the API answers them - Mismatch's count, the
  // difficulty dialog's numbers, in a Voice sentence too - and the built-in ones when asking for them fails.
  {
    name: 'main-quiz-levels-saved',
    path: '/quizzes/mismatch',
    widths: [1280],
    answers: { '/api/quiz/levels': { status: 200, body: { levels: SAVED_LEVELS } } },
    then: mismatchChoices({ easy: 4, medium: 4, hard: 4 }),
  },
  {
    name: 'main-quiz-levels-dialog',
    path: '/quizzes/pixelate',
    widths: [1280],
    answers: { '/api/quiz/levels': { status: 200, body: { levels: SAVED_LEVELS } } },
    then: steps(press('app-quiz-difficulty button'), dialogSays(['A 9 × 9 grid to start', 'up to 27 × 27'])),
  },
  {
    name: 'main-quiz-levels-voice',
    path: '/quizzes/voice',
    widths: [1280],
    answers: { '/api/quiz/levels': { status: 200, body: { levels: SAVED_LEVELS } } },
    then: steps(
      press('app-quiz-difficulty button'),
      dialogSays(['then 0.5 s of the recording, then 1.5 s, then 3 s.', 'Part of the line or of its recording to start, and more with each wrong guess.']),
    ),
  },
  {
    name: 'main-quiz-levels-failed',
    path: '/quizzes/mismatch',
    widths: [1280],
    answers: { '/api/quiz/levels': { status: 500, body: { error: 'Internal Server Error' } } },
    then: mismatchChoices({ easy: 3, medium: 4, hard: 5 }),
  },
  // The top bar: an item closes its section from the section's own page, goes to it from inside it, opens it from
  // anywhere else - the daily's too (topBarItem).
  { name: 'main-top-bar-section', path: '/quizzes', widths: [1280], then: topBarItem('quizzes', { href: '/', current: 'page', goes: '/' }) },
  { name: 'main-top-bar-inside', path: '/quizzes/pixelate', widths: [1280], then: topBarItem('quizzes', { href: '/quizzes', current: 'true', goes: '/quizzes' }) },
  { name: 'main-top-bar-elsewhere', path: '/games', widths: [1280], then: topBarItem('quizzes', { href: '/quizzes', current: null, goes: '/quizzes' }) },
  { name: 'main-top-bar-daily', path: '/daily', widths: [1280], then: topBarItem('daily', { href: '/', current: 'page', goes: '/' }) },
  { name: 'main-top-bar-daily-quiz', path: '/daily/banners', widths: [1280], then: topBarItem('daily', { href: '/daily', current: 'true', goes: '/daily' }) },
  { name: 'main-games', path: '/games' },
  { name: 'main-game-tournament', path: '/games/tournament' },
  // Minesweeper, light in English and dark in Slovak: the setup, a board opened - the reaction line over it, covered
  // tiles (those a press acts on, and the dimmed rest), the cleared patch and its ring of elements - and a game played
  // to its end (minesweeperBoard).
  { name: 'main-game-minesweeper', path: '/games/minesweeper', pairings: true },
  { name: 'main-game-minesweeper-board', path: '/games/minesweeper', pairings: true, then: minesweeperBoard({ playedOut: false }) },
  { name: 'main-game-minesweeper-end', path: '/games/minesweeper', pairings: true, then: minesweeperBoard({ playedOut: true }) },
  { name: 'main-database', path: '/database' },
  { name: 'main-database-characters', path: '/database/characters', focus: 6 },
  // The lists' filter card with a choice made and the sections regrouped (the owner's choice "E" of 2026-10-21).
  { name: 'main-database-characters-filtered', path: '/database/characters?element=Pyro&group=version' },
  { name: 'main-database-character', path: '/database/characters/1' },
  // Its special dish and birthday as a reader reads them (characterFacts) - light in English, dark in Slovak.
  { name: 'main-database-character-facts', path: '/database/characters/1', pairings: true, then: characterFacts },
  { name: 'main-database-character-constellations', path: '/database/characters/1', then: click('[role=tab], .tab, app-tab, button', '^(Constellations?|Konštelácie)$') },
  { name: 'main-database-character-voice-overs', path: '/database/characters/1', then: steps(click('[role=tab]', '^Voice'), storedMarkupInert) },
  { name: 'main-database-weapons', path: '/database/weapons' },
  { name: 'main-database-weapons-filtered', path: '/database/weapons?type=Sword&rarity=5' },
  { name: 'main-database-weapon', path: '/database/weapons/1' },
  { name: 'main-database-materials', path: '/database/materials' },
  { name: 'main-database-materials-filtered', path: '/database/materials?category=Local%20Specialty&group=version' },
  { name: 'main-database-material', path: '/database/materials/1' },
  { name: 'main-database-banners', path: '/database/banners' },
  { name: 'main-profile', path: '/profile' },
  { name: 'main-staff', path: '/staff' },
  { name: 'main-not-found', path: '/no-such-page' },
  // The footer, light in English and dark in Slovak, and what it opens: the version, What's new (by itself on a first
  // visit, and from the footer), Feedback, the account - and from the account panel, the wallpapers.
  { name: 'main-footer', path: '/', pairings: true, then: publicFooter({ legalOnly: false }) },
  { name: 'main-footer-account', path: '/', pairings: true, widths: [1280], then: accountOpen },
  { name: 'main-dialog-account', path: '/', then: click('app-footer button', '^Account$') },
  // The footer's version is text since 2026-10-19 (anotoki-lib 0.8.0): every version opens from What's new.
  { name: 'main-dialog-versions', path: '/', then: steps(click('app-footer button', "^What's new$"), click('dialog[open] button', '^See all changes$')) },
  { name: 'main-dialog-backgrounds', path: '/', then: steps(accountOpen, press('dialog[open] button[aria-haspopup=dialog]')) },
  { name: 'main-dialog-feedback', path: '/', then: click('app-footer button', '^Feedback$') },
  { name: 'main-dialog-whats-new', path: '/', fresh: true },
  { name: 'main-dialog-whats-new-footer', path: '/', then: click('app-footer button', "^What's new$") },
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
  // The family's About and Support pages (anotoki-lib 0.8.0), in the same frame, in English and in Slovak.
  { name: 'main-about', path: '/about' },
  { name: 'main-support', path: '/support' },
  { name: 'main-about-sk', path: '/about', lang: 'sk' },
  { name: 'main-support-sk', path: '/support', lang: 'sk' },
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
      waitFor(
        page,
        "location.pathname === '/privacy' && !!document.querySelector('anotoki-privacy-page h1') && !document.querySelector('app-sign-in-required') && !localStorage.getItem('anotoki-auth:genshin')",
        15000,
      ),
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

/**
 * The admin panel in the family's frame (anotoki-lib 0.10.0, `<anotoki-admin-frame>` - the owner's request of
 * 2026-10-24): on a computer its column, on a phone the Menu's drawer, holding the panel's name ("Genshin Admin", to
 * /admin), who is signed in (the owner's name and address), Back to the site (/), Sign out, the theme's three choices
 * (light, dark, as the device is set - genshin's one theme, through shell-theme.ts) and the pages under their headings,
 * the ADMIN's tools among them. On a computer the switch is pressed too - dark, as the device is set, light, then the
 * round's own again: each drawn at once and kept as genshin's theme service keeps it, `auto` under its key. Anything
 * missing or else is said; how many pages, kept in report.json.
 */
const adminFrame =
  ({ drawer }) =>
  async (page) => {
    if (!(await waitFor(page, "!!document.querySelector('app-admin-root anotoki-admin-frame anotoki-side-nav')", 15000))) {
      heard.push('the admin panel is not in the family frame');
      return true;
    }
    if (drawer) {
      const opened =
        (await click('app-admin-root anotoki-admin-frame button', '^Menu$')(page)) && (await waitFor(page, "!!document.querySelector('dialog[open] .anotoki-admin-frame__account')", 10000));
      if (!opened) {
        heard.push("the frame's Menu did not open the drawer with the column's top in it");
        return true;
      }
    }
    const facts = await page.evaluate(`(() => {
      const scope = ${drawer ? "document.querySelector('dialog[open]')" : "document.querySelector('app-admin-root .anotoki-admin-frame__column')"};
      const words = (element) => (element?.textContent ?? '').replace(/\\s+/g, ' ').trim();
      const brand = document.querySelector('app-admin-root .anotoki-admin-frame__brand');
      const back = scope.querySelector('.anotoki-admin-frame__back');
      return {
        brand: [words(brand), brand?.getAttribute('href') ?? null],
        person: words(scope.querySelector('.anotoki-admin-frame__who')),
        back: [words(back), back?.getAttribute('href') ?? null],
        signOut: words(scope.querySelector('.anotoki-admin-frame__sign-out')),
        theme: [scope.querySelectorAll('anotoki-theme-toggle [role=radio]').length, scope.querySelectorAll('anotoki-theme-toggle [role=radio][aria-checked=true]').length],
        headings: [...scope.querySelectorAll('.anotoki-side-nav__heading')].map(words),
        links: [...scope.querySelectorAll('a.anotoki-side-nav__link')].map(words),
      };
    })()`);
    const wanted = {
      brand: ['Genshin Admin', '/admin'],
      person: 'owner owner@example.test',
      back: ['Back to the site', '/'],
      signOut: 'Sign out',
      theme: [3, 1],
      headings: ['Database', 'Lookup Tables', 'Localization', 'System'],
    };
    // The one shape of every anotoki admin menu (the owner's request of 2026-10-25): Localization's three, then System -
    // the site's own (Accounts & access, Quiz levels, Files Explorer) before the family's, in the family's order and
    // words. Feedback may carry the count of the new beside it.
    const tail = [
      'Translations',
      'Languages',
      'Guides',
      'Accounts & access',
      'Quiz levels',
      'Files Explorer',
      'Site settings',
      'People',
      'Feedback',
      'Error log',
      'Audit log',
      'Backups',
      'Migrations',
    ];
    const { links, ...said } = facts;
    const end = links.slice(-tail.length);
    if (JSON.stringify(said) !== JSON.stringify(wanted) || links[0] !== 'Dashboard' || end.length !== tail.length || tail.some((name, index) => !end[index].startsWith(name))) {
      heard.push(`the admin frame: ${JSON.stringify(facts)}, not ${JSON.stringify(wanted)} with the Dashboard first and ${JSON.stringify(tail)} last`);
    }
    noted.push(`the frame: ${links.length} pages under ${facts.headings.length} headings`);
    if (!drawer) {
      // The switch's choices, in its order: light, dark, as the device is set.
      const pressed = await page.evaluate(`(async () => {
        const choices = [...document.querySelectorAll('app-admin-root .anotoki-admin-frame__column anotoki-theme-toggle [role=radio]')];
        const before = choices.findIndex((choice) => choice.getAttribute('aria-checked') === 'true');
        const seen = [];
        for (const index of [1, 2, 0, before]) {
          choices[index]?.click();
          await new Promise((done) => setTimeout(done, 200));
          seen.push([document.documentElement.getAttribute('data-theme'), localStorage.getItem('anotoki-genshin-impact-theme')]);
        }
        return { before, seen, device: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' };
      })()`);
      const own = ['light', 'dark'][pressed.before] ?? null;
      const expected = [
        ['dark', 'dark'],
        [pressed.device, 'auto'],
        ['light', 'light'],
        [own, own],
      ];
      if (own === null || JSON.stringify(pressed.seen) !== JSON.stringify(expected)) {
        heard.push(`the frame's theme switch: ${JSON.stringify(pressed)}, not ${JSON.stringify(expected)} (the theme drawn, and kept)`);
      }
    }
    return true;
  };

const ADMIN = [
  // The family's admin frame - its column at 1280, the Menu's drawer at 390 (adminFrame) - on the Quiz levels page.
  { name: 'admin-frame', path: '/admin/quiz-levels', widths: [1280], then: adminFrame({ drawer: false }) },
  { name: 'admin-frame-drawer', path: '/admin/quiz-levels', widths: [390], then: adminFrame({ drawer: true }) },
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
  { name: 'admin-characters-filter', path: '/admin/characters', then: press('.anotoki-multiselect__trigger') },
  { name: 'admin-characters-delete', path: '/admin/characters', then: press('button[aria-label="Delete"]') },
  { name: 'admin-menu', path: '/admin/dashboard', data: '.feed-title', widths: [390], then: click('button', '^Menu$') },
  { name: 'admin-image-upload', path: '/admin/characters/1/edit', then: click('button', '^(Upload|Replace)$') },
  // The kit's date field: a birthday's calendar, a day and a month without a year.
  { name: 'admin-characters-edit-birthday', path: '/admin/characters/1/edit', then: press('anotoki-date-field .anotoki-date-field__toggle') },
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
  // The Quiz levels page (sites/admin/quiz-levels): the levels in force as JSON, what the server's rules say of them as
  // they are typed - where (the quiz, the level, the try) and what -, the site's words they would leave behind, Save only
  // once nothing is wrong; a save, and back to the built-in levels.
  { name: 'admin-quiz-levels', path: '/admin/quiz-levels', then: levelsPageSays({ verdict: /^Nothing: these levels are what the editor started from/, saveDisabled: true }) },
  {
    name: 'admin-quiz-levels-refused',
    path: '/admin/quiz-levels',
    then: steps(
      editLevels(['"triesMax": 5', '"triesMax": 4']),
      levelsPageSays({ verdict: /^One problem/, problems: ['Banners · Easy: triesMax is 5 on every level of every quiz'], saveDisabled: true }),
    ),
  },
  {
    name: 'admin-quiz-levels-not-json',
    path: '/admin/quiz-levels',
    widths: [1280],
    then: steps(editLevels(['"banners": {', '"banners": ']), levelsPageSays({ verdict: /once the text is JSON/, field: /^Not JSON yet/, saveDisabled: true })),
  },
  {
    name: 'admin-quiz-levels-warnings',
    path: '/admin/quiz-levels',
    then: steps(
      editLevels(['"choicesAmount": 3', '"choicesAmount": 4'], ['{ "try": 0, "class": "shown-half" }', '{ "try": 0, "class": "shown-quarter" }']),
      levelsPageSays({ verdict: /^Nothing: these levels may be saved/, warnings: ['Banners · Easy', 'Mismatch'], saveDisabled: false }),
    ),
  },
  { name: 'admin-quiz-levels-saved', path: '/admin/quiz-levels', widths: [1280], then: steps(editLevels(['"choicesAmount": 3', '"choicesAmount": 4']), savedAndBack) },
  // The site settings: the library's page (@anotoki/lib/admin/site-settings), a card a part, each opening its dialog.
  { name: 'admin-site-settings', path: '/admin/site-settings' },
  { name: 'admin-site-settings-getting-in', path: '/admin/site-settings', then: press('[data-card="getting_in"]') },
  { name: 'admin-site-settings-announcement', path: '/admin/site-settings', then: press('[data-card="announcement"]') },
  { name: 'admin-site-settings-pages', path: '/admin/site-settings', then: press('[data-card="page_access"]') },
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

// ─────────────────────────────────────────────────────────────────────────────
// The admin forms filled and saved (the owner's request of 2026-10-25, as their
// fields moved from local-lib's adapters onto the kit's own: the forms' saving
// is what matters most). Each stage edits a form as a person would - types into
// the kit's fields, found by the words of their labels (the required mark among
// them), chooses, ticks, adds a row, opens a tab - and presses Save; and each
// form that keeps lists is saved once untouched (admin-form-keep-*), every list
// going back exactly as it came. What came of
// it goes to form-bodies.json: the body the form sent (its FormData's `data`,
// read in the page as it went), the toasts, the words under the fields, the tab
// open, and what a step noted on the way. The save is never sent on - the
// browser answers it as the API would - and the form's own read can be given
// what the throwaway site lacks (`read`: a picture in each slot a save needs), so
// nothing a stage does stays in the database. A run before a change to the forms
// and one after must keep the same file but for the rows' times (`created_at`,
// `updated_at`: each run seeds its database anew).
// ─────────────────────────────────────────────────────────────────────────────

/** What the form stages kept, one entry a round: written to form-bodies.json at the end. */
const formBodies = [];

/** The form stage under way - its entry's `form`, which formPaused() answers for - or null. */
let formTraffic = null;

/** A stored picture as the API answers one: its path (the file is not there, as no picture is in this run). */
const picture = (folder, name) => `../assets/${folder}/${name}.avif`;

/**
 * The page's half of a form stage, run in it once the form has loaded: the saves as they go (each FormData body
 * with its `data`), and the steps. A field is the kit's, found by its label's words - whether genshin's own adapter
 * drew it or the page draws it itself -, the nth of that label in the page's order; a field with no label of its
 * own is found by ''. A step answers true, a note (words), or false when it found nothing to act on.
 */
function formStepsInPage() {
  const words = (element) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const pause = (ms) => new Promise((done) => setTimeout(done, ms));
  const FIELDS = 'anotoki-text-field, anotoki-number-field, anotoki-textarea, anotoki-select, anotoki-date-field, anotoki-chip-group';
  const labelOf = (host) => words(host.querySelector('.anotoki-field__label'));
  const field = (label, nth) => [...document.querySelectorAll(FIELDS)].filter((host) => labelOf(host) === label)[nth ?? 0] ?? null;
  const press = (element) => {
    element.scrollIntoView({ block: 'center' });
    element.click();
  };
  const saves = [];
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.formSave = { method: String(method).toUpperCase(), path: new URL(String(url), location.href).pathname };
    return open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (this.formSave && this.formSave.method !== 'GET' && body instanceof FormData && body.has('data')) {
      saves.push({ ...this.formSave, parts: [...body.keys()], data: JSON.parse(String(body.get('data'))) });
    }
    return send.call(this, body);
  };
  window.__formSteps = {
    /** Types `text` into the field (its input or textarea), as typed - then leaves it. */
    async type(label, text, nth) {
      const control = field(label, nth)?.querySelector('input, textarea');
      if (!control) {
        return false;
      }
      control.scrollIntoView({ block: 'center' });
      control.focus();
      control.value = text;
      control.dispatchEvent(new Event('input', { bubbles: true }));
      await pause(150);
      control.blur();
      await pause(150);
      return true;
    },
    /** Chooses the select's option at `index` - its empty one first, where it has one - then leaves it. */
    async choose(label, index, nth) {
      const select = field(label, nth)?.querySelector('select');
      if (!select || index >= select.options.length) {
        return false;
      }
      select.scrollIntoView({ block: 'center' });
      select.focus();
      select.selectedIndex = index;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(150);
      select.blur();
      await pause(150);
      return true;
    },
    /** Ticks (or unticks) the checkbox whose words are `text`. */
    async check(text, nth) {
      const box = [...document.querySelectorAll('anotoki-checkbox')].filter((element) => words(element) === text)[nth ?? 0]?.querySelector('input');
      if (!box) {
        return false;
      }
      press(box);
      await pause(150);
      return true;
    },
    /** Ticks the checkbox whose words are `text`, where it is not ticked yet. */
    async tick(text, nth) {
      const box = [...document.querySelectorAll('anotoki-checkbox')].filter((element) => words(element) === text)[nth ?? 0]?.querySelector('input');
      if (!box) {
        return false;
      }
      if (!box.checked) {
        press(box);
        await pause(150);
      }
      return true;
    },
    /** Presses the chip at `index` of the chip group. */
    async chip(label, index, nth) {
      const chip = field(label, nth)?.querySelectorAll('button')[index];
      if (!chip) {
        return false;
      }
      press(chip);
      await pause(150);
      return true;
    },
    /** Presses the button whose words are `text`. */
    async button(text, nth) {
      const button = [...document.querySelectorAll('button')].filter((element) => words(element) === text)[nth ?? 0];
      if (!button) {
        return false;
      }
      press(button);
      await pause(300);
      return true;
    },
    /** Opens the form's tab whose words are `text`. */
    async tab(text) {
      const tab = [...document.querySelectorAll('[role=tab]')].find((element) => words(element) === text);
      if (!tab) {
        return false;
      }
      press(tab);
      await pause(300);
      return true;
    },
    /** Opens (or closes) the nth of the kit's disclosures. */
    async disclosure(nth) {
      const button = document.querySelectorAll('anotoki-disclosure .anotoki-disclosure__button')[nth ?? 0];
      if (!button) {
        return false;
      }
      press(button);
      await pause(300);
      return true;
    },
    /** What the field says under itself now, noted. */
    said(label, nth) {
      const host = field(label, nth);
      return host ? `${label}: ${words(host.querySelector('.anotoki-field__error')) || '-'}` : false;
    },
    /** The form's own button: the last in its footer. */
    save() {
      const buttons = document.querySelectorAll('.form-footer button');
      press(buttons[buttons.length - 1]);
      return true;
    },
    /** A body sent, or a toast said why not. */
    answered() {
      return saves.length > 0 || document.querySelectorAll('.anotoki-toast-host__toast').length > 0;
    },
    outcome() {
      return {
        saves,
        toasts: [...document.querySelectorAll('.anotoki-toast-host__toast')].map((toast) => `${toast.dataset.tone}: ${words(toast.querySelector('.anotoki-toast-host__message'))}`),
        errors: [...document.querySelectorAll('.anotoki-field__error, .entity-image .error-message')].map((error) => {
          const host = error.closest(FIELDS);
          return `${host ? labelOf(host) : words(error.closest('.entity-image')?.querySelector('.entity-image-label'))}: ${words(error)}`;
        }),
        tab: words(document.querySelector('[role=tab][aria-selected=true]')),
      };
    },
  };
}

/**
 * A form stage's `then`: each step done in the page in turn - [action, ...its arguments], formStepsInPage()'s -, a
 * moment between for the form to answer, then Save; what came of it kept (formBodies). A step that finds nothing to
 * act on is said, and ends the stage.
 */
const formSaved = (actions) => async (page) => {
  if (!(await waitFor(page, "!!document.querySelector('.form-footer button') && !document.querySelector('anotoki-spinner.page-spinner')", 20000))) {
    return false;
  }
  await page.evaluate(`(${formStepsInPage.toString()})(); true`);
  const notes = [];
  for (const [action, ...args] of actions) {
    const done = await page.evaluate(`window.__formSteps.${action}(...${JSON.stringify(args)})`);
    if (done === false) {
      heard.push(`the form stage found nothing to ${action}: ${JSON.stringify(args)}`);
      return true;
    }
    if (typeof done === 'string') {
      notes.push(done);
    }
    await sleep(200);
  }
  await page.evaluate('window.__formSteps.save()');
  await waitFor(page, 'window.__formSteps.answered()', 15000);
  await sleep(800);
  formBodies.push({ stage: formTraffic.stage, notes, ...(await page.evaluate('window.__formSteps.outcome()')) });
  return true;
};

const FORM_SAVES = [
  // Hu Tao - her four required pictures in their slots, and an element the list has not, which the select makes its
  // first - edited in every kind of field the form has: text emptied, choices (a typed key, "none"), a birthday kept in
  // year 4 and a release date, a number refused as typed and then taken, a checkbox, lines of a textarea, a chip, and a
  // relationship added (its type the select's first).
  {
    name: 'admin-form-save-character',
    path: '/admin/characters/1/edit',
    widths: [1280],
    form: {
      id: 1,
      read: (row) =>
        Object.assign(row.character, {
          icon: picture('character/icon', 'HU_TAO'),
          card_icon: picture('character/card_icon', 'HU_TAO'),
          wish_icon: picture('character/wish_icon', 'HU_TAO'),
          ingame_icon: picture('character/ingame_icon', 'HU_TAO'),
          element: 'Nowhere',
        }),
    },
    then: formSaved([
      ['type', 'Name *', 'Hu Tao II'],
      ['type', 'Title', ''],
      ['choose', 'Rarity *', 1],
      ['choose', 'Region', 0],
      ['choose', 'Special Dish', 3],
      ['type', 'Birthday', '29/02'],
      ['type', 'Release Date', '15/06/2024'],
      ['type', 'Game ID', 'x'],
      ['said', 'Game ID'],
      ['type', 'Game ID', '10000046'],
      ['check', 'Is Traveler'],
      ['type', 'How To Obtain', 'Wish\nStarglitter Exchange'],
      ['type', 'English *', 'Sample EN'],
      ['chip', 'Roles', 0],
      ['button', 'Add'],
      ['type', 'Name *', 'Zhongli', 1],
      ['choose', 'State', 1],
      ['check', 'Biological'],
    ]),
  },
  // Hu Tao as the throwaway site keeps her - no pictures, so her required slots are empty -, her name taken away and a
  // new ascension's phase emptied, then typed out of its range: the save is refused, the toast counts the wrong fields,
  // each says why, and the form opens the tab holding the first of them.
  {
    name: 'admin-form-check-character',
    path: '/admin/characters/1/edit',
    widths: [1280],
    form: { id: 1 },
    then: formSaved([
      ['type', 'Name *', ''],
      ['tab', 'Ascensions'],
      ['button', 'Add', 2],
      ['type', 'Phase *', ''],
      ['said', 'Phase *'],
      ['type', 'Phase *', '9'],
      ['said', 'Phase *'],
      ['tab', 'Talents'],
    ]),
  },
  // Staff of Homa - its icon in its slot and a type the list has not - with a refinement and two ascension phases added:
  // whole and decimal numbers, a decimal comma, numbers refused as typed (said, and the last one taken kept), a cost.
  {
    name: 'admin-form-save-weapon',
    path: '/admin/weapons/1/edit',
    widths: [1280],
    form: { id: 1, read: (row) => Object.assign(row.weapon, { icon: picture('weapons', 'STAFF_OF_HOMA'), type: 'Nowhere' }) },
    then: formSaved([
      ['choose', 'Rarity *', 1],
      ['choose', 'Primary Stat', 2],
      ['type', 'Release Date', '01/03/2024'],
      ['type', 'Game ID', '13501'],
      ['type', 'Description', 'A polearm of crimson.'],
      ['type', 'Effects', 'ATK\nCRIT Rate'],
      ['tab', 'Refinements'],
      ['button', 'Add'],
      ['choose', 'Material *', 1],
      ['type', 'Quantity', '5,5'],
      ['said', 'Quantity'],
      ['type', 'Quantity', '5'],
      ['type', 'Description *', 'Increases ATK by 20%.'],
      ['tab', 'Ascensions'],
      ['button', 'Add', 1],
      ['type', 'Primary Stat Value', ',5'],
      ['type', 'Secondary Stat Value', '12.345'],
      ['said', 'Secondary Stat Value'],
      ['type', 'Start Level From', '1'],
      ['button', 'Add', 1],
      ['button', 'Add', 1],
      ['choose', '', 1],
      ['type', 'Qty', '3'],
    ]),
  },
  // Moment of Bloom: its run's dates (a day typed, an end emptied), a featured character changed and a weapon added.
  {
    name: 'admin-form-save-banner',
    path: '/admin/banners/1/edit',
    widths: [1280],
    form: { id: 1 },
    then: formSaved([
      ['type', 'Name *', 'Moment of Bloom II'],
      ['type', 'From *', '02/01/2024'],
      ['type', 'To', ''],
      ['choose', '', 2, 1],
      ['button', 'Add weapon'],
      ['choose', '', 1, 2],
    ]),
  },
  // A new banner with a day that is none and a featured character not picked: refused, every wrong field saying why.
  {
    name: 'admin-form-check-banner',
    path: '/admin/banners/create',
    widths: [1280],
    form: { id: 2 },
    then: formSaved([
      ['type', 'Version *', '1.3'],
      ['button', 'Add character'],
      ['type', 'From *', '31/02/2024'],
      ['said', 'From *'],
    ]),
  },
  // Sweet Madame: "none" chosen, a typed key, a number, lines, a quality's words and an ingredient added.
  {
    name: 'admin-form-save-food',
    path: '/admin/foods/1/edit',
    widths: [1280],
    form: { id: 1 },
    then: formSaved([
      ['choose', 'Rarity', 0],
      ['choose', 'Type', 2],
      ['type', 'Proficiency', '15'],
      ['choose', 'Base Dish', 2],
      ['type', 'Effect Tags', 'Healing'],
      ['tab', 'Qualities'],
      ['type', 'Description', 'Very tasty.', 1],
      ['type', 'Effect', '', 2],
      ['tab', 'Recipe'],
      ['button', 'Add'],
      ['choose', '', 1],
      ['type', 'Qty', '2'],
    ]),
  },
  // A Hilichurl - its icon, and a phase with its icon - with the phase's choices, checkbox and chips, and its drops'
  // numbers to four decimals.
  {
    name: 'admin-form-save-enemy',
    path: '/admin/enemies/1/edit',
    widths: [1280],
    form: {
      id: 1,
      read: (row) => {
        row.enemy.icon = picture('enemies', 'HILICHURL');
        row.phases = [{ title: 'Hilichurl', icon: picture('enemies', 'HILICHURL - phase1'), has_weakpoint: false, damage_type_elements: [{ damage_type_element: 'Pyro', order: 1 }] }];
      },
    },
    then: formSaved([
      ['type', 'Version', '1.1'],
      ['tab', 'Phases'],
      ['type', 'Secondary Title', 'Hilichurl tribe'],
      ['choose', 'Type', 1],
      ['check', 'Has Weakpoint'],
      ['chip', 'Damage type elements', 0],
      ['tab', 'Drops'],
      ['disclosure', 0],
      ['type', 'Level from', '2'],
      ['type', 'Drop rate', '0.1234'],
      ['type', 'Average', '1.5'],
      ['choose', 'Domain level', 1],
    ]),
  },
  // Mora: its choices, version and words.
  {
    name: 'admin-form-save-material',
    path: '/admin/materials/1/edit',
    widths: [1280],
    form: { id: 1 },
    then: formSaved([
      ['choose', 'Type', 1],
      ['choose', 'Rarity', 2],
      ['type', 'Version', '1.2'],
      ['type', 'Description', 'Common currency.'],
      ['type', 'How To Obtain', 'Chests\nQuests'],
    ]),
  },
  // Gladiator's Finale - its icon, and a piece with its icon and a type the list has not, which the select makes its
  // first - with a rarity ticked and its sources, the effects, and the piece renamed.
  {
    name: 'admin-form-save-artifact',
    path: '/admin/artifacts/1/edit',
    widths: [1280],
    form: {
      id: 1,
      read: (row) => {
        row.artifact.icon = picture('artifacts', 'GLADIATORS_FINALE');
        row.pieces = [{ type: 'Nowhere', name: "Gladiator's Nostalgia", icon: picture('artifacts', 'GLADIATORS_NOSTALGIA') }];
      },
    },
    then: formSaved([
      ['type', 'Game ID', '15001'],
      ['tick', '5★'],
      ['type', 'How to obtain', 'Domain of Blessing'],
      ['type', 'Effects', 'Normal Attack'],
      ['tab', 'Pieces'],
      ['type', 'Name *', "Gladiator's Nostalgia II", 1],
    ]),
  },
  // Each form that keeps lists, saved with nothing touched - only the pictures a save needs given: every list goes
  // back exactly as it came, the seed's (backend/tests/tools/browser-env.php) and null for one the database holds as
  // NULL, never wrapped in another layer of JSON (the character form's until 2026-10-25: genshin_impact/032).
  {
    name: 'admin-form-keep-character',
    path: '/admin/characters/1/edit',
    widths: [1280],
    form: {
      id: 1,
      read: (row) =>
        Object.assign(row.character, {
          icon: picture('character/icon', 'HU_TAO'),
          card_icon: picture('character/card_icon', 'HU_TAO'),
          wish_icon: picture('character/wish_icon', 'HU_TAO'),
          ingame_icon: picture('character/ingame_icon', 'HU_TAO'),
        }),
    },
    then: formSaved([]),
  },
  {
    name: 'admin-form-keep-weapon',
    path: '/admin/weapons/1/edit',
    widths: [1280],
    form: { id: 1, read: (row) => Object.assign(row.weapon, { icon: picture('weapons', 'STAFF_OF_HOMA') }) },
    then: formSaved([]),
  },
  { name: 'admin-form-keep-food', path: '/admin/foods/1/edit', widths: [1280], form: { id: 1 }, then: formSaved([]) },
  { name: 'admin-form-keep-material', path: '/admin/materials/1/edit', widths: [1280], form: { id: 1 }, then: formSaved([]) },
  {
    name: 'admin-form-keep-artifact',
    path: '/admin/artifacts/1/edit',
    widths: [1280],
    form: { id: 1, read: (row) => Object.assign(row.artifact, { icon: picture('artifacts', 'GLADIATORS_FINALE') }) },
    then: formSaved([]),
  },
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
  // The sign-in card keeps the footer's fan clause and About · Support · Terms · Privacy · Contact alone.
  { name: 'main-sign-in-required-failed', path: '/', iam: { deny: true, login_required: true }, then: steps(failureShown, publicFooter({ legalOnly: true })) },
];

// ─────────────────────────────────────────────────────────────────────────────
// The site while it is not ready: the family's status page alone (anotoki-lib
// 0.6.3, the owner's rule of 2026-10-18). An update waiting, the database out
// of reach, not set up: the gate draws its page in a <main> of its own, and
// both sites' frames - the public site's header, footer and notes, the admin
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
  'anotoki-announcement',
  'anotoki-page-notice',
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

/** The public site back once it is ready: its header and its footer, and no status page. */
const publicFrameBack = (page) => waitFor(page, "!!document.querySelector('app-header') && !!document.querySelector('app-footer') && !document.querySelector('anotoki-site-status')", 45000);

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
 * changelog's newest, What's new and - while the site can take a message - Feedback; About · Support · Terms ·
 * Privacy · Contact, the public site's pages; the fan clause. Anything missing or extra is said.
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
    const expected = { version: `v${version}Version ${version}`, whatsNew: true, feedback, links: ['/about', '/support', '/terms', '/privacy', '/contact'], fan: true, inMain: false };
    if (JSON.stringify(parts) !== JSON.stringify(expected)) {
      heard.push(`the admin footer: ${JSON.stringify(parts)}, not ${JSON.stringify(expected)}`);
    }
    return true;
  };

/** The closed sign: the status page alone, saying what the administrators wrote - in the page's language. */
const maintenanceSaid = (page) =>
  steps(statusAlone, (open) =>
    waitFor(
      open,
      `[MAINTENANCE_EN, MAINTENANCE_SK].some((words) => document.body.textContent.includes(words))`
        .replace('MAINTENANCE_EN', JSON.stringify(MAINTENANCE_MESSAGE.en))
        .replace('MAINTENANCE_SK', JSON.stringify(MAINTENANCE_MESSAGE.sk)),
      15000,
    ),
  )(page);

/** A dialog the footer opened, drawn. */
const dialogOpen = (page) => waitFor(page, "!!document.querySelector('dialog[open]')", 15000);

/** Signed out: the public site's pages, and a legal page, while the site is not ready. */
const STATUS = [
  { name: 'status-update-waiting', path: '/', closed: 'update_pending', pairings: true, then: statusAlone, reopened: publicFrameBack },
  { name: 'status-update-waiting-privacy', path: '/privacy', closed: 'update_pending', pairings: true, then: statusAlone },
  { name: 'status-unavailable', path: '/', closed: 'unavailable', pairings: true, then: statusAlone, reopened: triesAgain(publicFrameBack) },
  { name: 'status-not-set-up', path: '/', closed: 'not_set_up', pairings: true, then: statusAlone, reopened: triesAgain(publicFrameBack) },
  // Closed for maintenance by its administrators: the library's closed sign, alone, with what they wrote.
  { name: 'status-maintenance', path: '/', closed: 'maintenance', pairings: true, then: maintenanceSaid },
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
  { name: 'admin-footer', path: '/admin/site-settings', then: adminFooter({ feedback: true }) },
  { name: 'admin-footer-whats-new', path: '/admin/site-settings', then: steps(adminFooter({ feedback: true }), press('app-admin-root anotoki-site-footer [data-whats-new]'), dialogOpen) },
  { name: 'admin-footer-feedback', path: '/admin/site-settings', then: steps(adminFooter({ feedback: true }), press('app-admin-root anotoki-site-footer [data-open-feedback]'), dialogOpen) },
];

/**
 * The Files page's dialogs (2026-10-28), on a folder the browser answers for (filesAnswers()): a file's Rename with a
 * dotted name typed for its dashed one - which the dialog calls its name already -, the files no row in the database
 * names, what Add strays to database did file by file, and emptying the trash asked in a dialog over it.
 */
const ADMIN_FILES = [
  {
    name: 'admin-files-rename',
    path: '/admin/files',
    answers: filesAnswers(),
    then: steps(click('.file-name', '^7-1 - Void Star'), dialogOpen, typeOver('app-rename-modal input', "7.1 - Void Star's Advent 2026-10-13")),
  },
  { name: 'admin-files-uncatalogued', path: '/admin/files', answers: filesAnswers(), then: steps(click('.catalogue-figure-button', 'not in the database'), dialogOpen) },
  { name: 'admin-files-reconcile', path: '/admin/files', answers: filesAnswers(), then: steps(click('button', '^Add strays to database$'), dialogOpen) },
  {
    name: 'admin-files-trash-empty',
    path: '/admin/files',
    answers: filesAnswers(),
    then: steps(click('button', '^Trash$'), dialogOpen, click('button', '^Empty the trash$'), (page) => waitFor(page, "document.querySelectorAll('dialog[open]').length === 2", 15000)),
  },
];

/**
 * The Files page's reads, answered by the browser (the throwaway site has no asset tree): a folder of banner art - one
 * file with its version dashed, one from before the rule with its dot, one the database has no row for -, the tree's
 * figures to match, that list, what Add strays to database answers, and a trash with a file in it. Its pictures are
 * not there, as on every page of this run.
 */
function filesAnswers() {
  const file = (name, size, fileId) => ({
    name,
    extension: 'avif',
    size,
    modified: '2026-10-28 12:59:31',
    url: `/api/files/raw?folder=banners&name=${encodeURIComponent(name)}`,
    file_id: fileId,
    category: fileId === null ? null : 'banners',
  });
  const files = [file("7-1 - Void Star's Advent 2026-10-13.avif", 90435, 201300), file('7.1 - Surging Ballad 2026-09-23.avif', 100714, 201295), file('7-4 - Arrived Over FTP.avif', 81920, null)];
  const counts = (sources, convertedOnly) => ({ sources, missing: 0, converted_only: convertedOnly, can_convert: true, reclaimable: 0 });
  const stats = {
    generated_at: '2026-10-28 13:05:00',
    age: 0,
    total_files: 4,
    total_bytes: 278189,
    formats: [
      { extension: 'avif', files: 3, bytes: 273069 },
      { extension: 'png', files: 1, bytes: 5120 },
    ],
    images: counts(1, 3),
    audio: counts(0, 0),
    catalogue: { on_disk: 4, catalogued: 2, uncatalogued: 2, unfiled: 1, missing: 1 },
  };
  const uncatalogued = [
    { path: 'banners/7-4 - Arrived Over FTP.avif', category: 'banners', size: 81920, modified_at: '2026-10-28 12:49:58' },
    { path: 'stray-folder/Loose.png', category: null, size: 5120, modified_at: '2026-10-27 09:12:00' },
  ];
  const swept = {
    adopted: 2,
    moved_to_unfiled: 1,
    resized: 1,
    missing: 1,
    on_disk: 4,
    relinked: 1,
    files: [
      { path: "banners/7-1 - Void Star's Advent 2026-10-13.avif", outcome: 'resized', from: null, category: 'banners', size: 90435 },
      { path: 'banners/7-4 - Arrived Over FTP.avif', outcome: 'added', from: null, category: 'banners', size: 81920 },
      { path: 'unfiled/Loose.png', outcome: 'unfiled', from: 'stray-folder/Loose.png', category: 'unfiled', size: 5120 },
    ],
    files_total: 3,
    linked: [{ field: 'banners.icon', rows: 1 }],
  };
  const trashed = [
    { folder: 'banners', trashed: "20261028-120438__7-1 - Void Star's Advent 2026-10-13.webp", name: "7-1 - Void Star's Advent 2026-10-13.webp", deleted_at: '20261028-120438', size: 301402 },
  ];

  return {
    '/api/files/folders': { status: 200, body: [{ folder: 'banners', files: files.length }] },
    '/api/files': { status: 200, body: { folder: 'banners', total: files.length, page: 1, pageSize: 60, files } },
    '/api/files/stats': { status: 200, body: stats },
    '/api/files/uncatalogued': { status: 200, body: uncatalogued },
    '/api/files/reconcile': { status: 200, body: swept },
    '/api/files/trash': { status: 200, body: trashed },
  };
}

/**
 * A season of games for the profile, answered by the browser in place of the four reads of /api/quiz/* (the throwaway
 * database holds no games): every quiz and every difficulty, the six characters browser-env.php seeds (ids 1 to 6, in
 * its order), a year of days and the last twenty - so the page is seen with its tabs full (the owner's choice "D" of
 * 2026-10-22). Its pictures are not there, as on every page of this run; the game's list the page joins is the real one.
 */
function profileAnswers() {
  const characters = [
    [1, 'Hu Tao'],
    [2, 'Xiangling'],
    [3, 'Furina'],
    [4, 'Bennett'],
    [5, 'Nahida'],
    [6, 'Kaeya'],
  ];
  const quizzes = ['banners', 'pixelate', 'mismatch', 'music', 'dish', 'voice'];
  const stats = [];
  characters.forEach(([id, name], c) =>
    quizzes.forEach((quiz, q) => {
      const wins = 2 + ((c * 5 + q * 3) % 9);
      const losses = 1 + ((c * 3 + q * 7) % 8);
      stats.push({ quiz, character_id: id, character_name: name, icon_name: null, wins, losses, attempts: wins + losses * 2 + ((c + q) % 4) });
    }),
  );
  const difficulty = quizzes.flatMap((quiz, q) => [1, 2, 3].map((level) => ({ quiz, difficulty: level, wins: 12 - level * 2 + q, losses: 4 + level * 2 + (q % 3), attempts: 30 + level * 6 + q })));
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  const daysAgo = (back) => {
    const day = new Date(noon);
    day.setDate(day.getDate() - back);
    return day;
  };
  const activity = [];
  for (let back = 0; back < 200; back++) {
    if ((back * 7) % 10 < 6) {
      const played = 1 + ((back * 13) % 9);
      activity.push({ day: daysAgo(back).toISOString().slice(0, 10), played, wins: Math.floor(played / 2) });
    }
  }
  const recent = Array.from({ length: 20 }, (_, i) => {
    const [id, name] = characters[i % 6];
    const when = daysAgo(Math.floor(i / 4));
    when.setHours(21, 55 - i * 2, 0, 0);
    return {
      id: 1000 - i,
      quiz: quizzes[i % 6],
      character_id: id,
      character_name: name,
      icon_name: null,
      win: i % 3 !== 1,
      attempts: 1 + (i % 5),
      difficulty: 1 + (i % 3),
      created_at: when.toISOString(),
    };
  });
  return {
    '/api/quiz/stats': { status: 200, body: stats },
    '/api/quiz/stats/difficulty': { status: 200, body: difficulty },
    '/api/quiz/activity': { status: 200, body: activity },
    '/api/quiz/results': { status: 200, body: recent },
  };
}

/** After the admin panel: the public site for somebody signed in. */
const SIGNED_IN = [
  { name: 'main-home-signed-in', path: '/' },
  { name: 'main-profile-signed-in', path: '/profile' },
  // The profile with games in it, tab by tab, and its Characters tab filtered and reordered from the address.
  { name: 'main-profile-filled', path: '/profile', answers: profileAnswers() },
  { name: 'main-profile-quizzes', path: '/profile?tab=quizzes', answers: profileAnswers() },
  { name: 'main-profile-characters', path: '/profile?tab=characters', answers: profileAnswers() },
  { name: 'main-profile-characters-filtered', path: '/profile?tab=characters&element=Pyro&sort=best', widths: [1280], answers: profileAnswers() },
  { name: 'main-profile-history', path: '/profile?tab=history', answers: profileAnswers() },
  { name: 'main-privacy-signed-in', path: '/privacy' },
];

/**
 * Last, the account panel of an account whose preferences the IAM keeps (its 015, as every IAM now): signed in afresh
 * for each pairing (`account`, the stand-in's user for the pairing's language) - its language the pairing's, its theme
 * 'auto' (the browser's, which the pairing sets), its dates in an order of its own and a 24-hour clock - and the owner
 * signed in again after it (accountPanelKept).
 */
const ACCOUNT_KEPT = [
  {
    name: 'main-dialog-account-signed-in',
    path: '/',
    pairings: true,
    account: (lang) => ({ ...OWNER, locale: lang, preferences: { theme: 'auto', date_format: lang === 'sk' ? 'dmy_dot' : 'ymd_dash', time_format: '24' } }),
    then: accountPanelKept,
  },
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
    if (/^\/(api|\.well-known|uploads)(\/|$)/.test(path) || path === '/robots.txt' || path === '/sitemap.xml') {
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
/** What a page's checks measured, beside what they heard: kept in report.json as the page's `measured`. */
let noted = [];
let inFlight = new Set();

async function setIam(changes) {
  const answer = await fetch(`${issuer}/_test/state`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
  if (!answer.ok) {
    throw new Error(`the stand-in IAM refused its state: ${answer.status}`);
  }
}

/**
 * The browser signed in afresh as `user` (the stand-in IAM's {id, username, roles, locale?, preferences?}): the site's
 * tokens forgotten, then /admin, which sends somebody signed out to the IAM - and the IAM signs `user` in at once.
 */
async function signInAs(user) {
  await setIam({ user });
  await page.evaluate(
    "(() => { for (const store of [localStorage, sessionStorage]) for (const key of Object.keys(store)) if (key.startsWith('anotoki-auth') || key === 'genshin-silent-sign-in') store.removeItem(key); return true; })()",
  );
  await page.send('Page.navigate', { url: `${origin}/admin` });
  return waitFor(page, "location.pathname.startsWith('/admin') && !!document.querySelector('app-admin-root')", 30000);
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
/** What the administrators wrote for the maintenance page, in both of the site's languages. */
const MAINTENANCE_MESSAGE = { en: 'We are moving the database to a new server. Back by six.', sk: 'Sťahujeme databázu na nový server. Späť do šiestej.' };

const ANSWERS = {
  // The gate lets every request through to a database that does not answer: a 500 of the error handler's.
  unavailable: { state: { state: 'unavailable', installed: true }, status: 500, body: { error: 'Internal Server Error' } },
  not_set_up: {
    state: { state: 'not_set_up', installed: false },
    status: 503,
    body: { code: 'not_set_up', installed: false, message: 'This site is not set up yet. Its setup page connects it to its database.', setup: '/setup.php' },
  },
  // Closed by its administrators (the site settings' Getting in): the status says so with what they wrote, and the
  // gate answers everybody else 503 maintenance (the library's SiteGate).
  maintenance: {
    state: { state: 'maintenance', installed: true, maintenance_message: MAINTENANCE_MESSAGE },
    status: 503,
    body: { code: 'maintenance', message: 'The site is closed for maintenance. Try again later.', maintenance_message: MAINTENANCE_MESSAGE },
  },
};

/**
 * What the browser answers API paths with while an entry's `answers` ({'/api/...': {status, body}}) says - the quizzes'
 * levels saved, or a failure; a profile full of games - so that a page is seen with what the throwaway database does
 * not hold. Null: the API answers everything.
 */
let apiAnswers = null;

async function answerApi(answers) {
  apiAnswers = answers;
  if (answers !== null) {
    await page.send('Fetch.enable', { patterns: Object.keys(answers).map((path) => ({ urlPattern: `${origin}${path}*`, requestStage: 'Request' })) });
  } else if (siteAnswers === null) {
    await page.send('Fetch.disable').catch(() => undefined);
  }
}

/**
 * A form stage's traffic (FORM_SAVES), on while its page is shown: the form's read of its row (`/api/.../full`) given
 * what the stage's `read` adds, and its save answered as the API answers one - `{id}` - without being sent on.
 */
async function formTrafficOn(entry) {
  formTraffic = { ...entry.form, stage: entry.name };
  // The steps focus and leave fields: as a person's browser, whose window has the focus.
  await page.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await page.send('Fetch.enable', {
    patterns: [
      { urlPattern: `${origin}/api/*/full`, requestStage: 'Request' },
      { urlPattern: `${origin}/api/*/full`, requestStage: 'Response' },
    ],
  });
}

async function formTrafficOff() {
  formTraffic = null;
  await page.send('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => undefined);
  await page.send('Fetch.disable').catch(() => undefined);
}

/** A form stage's request, paused: the read passed on and its answer amended, a save answered here. */
async function formPaused(event) {
  const headers = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Cache-Control', value: 'no-store' },
  ];
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64');
  if (event.responseStatusCode === undefined) {
    if (event.request.method === 'GET') {
      await page.send('Fetch.continueRequest', { requestId: event.requestId }).catch(() => undefined);
    } else {
      await page.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: 200, responseHeaders: headers, body: encoded({ id: formTraffic.id }) }).catch(() => undefined);
    }
    return;
  }
  try {
    const { body, base64Encoded } = await page.send('Fetch.getResponseBody', { requestId: event.requestId });
    const row = JSON.parse(base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body);
    formTraffic.read?.(row);
    await page.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: event.responseStatusCode, responseHeaders: headers, body: encoded(row) });
  } catch {
    await page.send('Fetch.continueRequest', { requestId: event.requestId }).catch(() => undefined);
  }
}

/** A paused API request (Fetch.requestPaused): answered as the entry or the site's state says, or passed on to the API. */
async function answerPaused(event) {
  if (formTraffic !== null && /\/full$/.test(new URL(event.request.url).pathname)) {
    await formPaused(event);
    return;
  }
  const stubbed = apiAnswers === null ? null : apiAnswers[new URL(event.request.url).pathname];
  if (stubbed) {
    await page
      .send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: stubbed.status,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Cache-Control', value: 'no-store' },
        ],
        body: Buffer.from(JSON.stringify(stubbed.body)).toString('base64'),
      })
      .catch(() => undefined);
    return;
  }
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
    if (entry.account && !(await signInAs(OWNER))) {
      throw new Error(`The owner was not signed in again after ${entry.name}.`);
    }
  }
}

async function visitAs(entry, width) {
  let facts = null;
  const keys = [];
  const problems = [];
  const measured = [];
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
    noted = [];
    await boot(themeName, entry.fresh, lang);
    if (entry.account && !(await signInAs(entry.account(lang ?? 'en')))) {
      heard.push('the sign-in as the account did not come back');
    }
    if (entry.closed) {
      await closeSite(entry.closed);
    }
    if (entry.answers) {
      await answerApi(entry.answers);
    }
    if (entry.form) {
      await formTrafficOn(entry);
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
      if (entry.answers) {
        await answerApi(null);
      }
      if (entry.form) {
        await formTrafficOff();
      }
    }
    problems.push(...heard.filter((line) => !problems.includes(line)));
    measured.push(...noted.map((line) => `${themeName}${lang ? ` ${lang}` : ''}: ${line}`));
  }
  if (facts.scrollWidth > facts.width + 1) {
    problems.push(`wider than the window: ${facts.scrollWidth} of ${facts.width} (${facts.wide.join(', ')})`);
  }
  if (keys.length) {
    problems.push(`keys where words should be: ${keys.join(', ')}`);
  }
  report.push({ page: entry.name, width, path: facts.path, title: facts.title, problems, ...(measured.length ? { measured } : {}) });
  console.log(`${problems.length ? 'LOOK' : 'ok  '} ${entry.name} ${width}${problems.length ? ' - ' + problems.join(' | ') : ''}`);
}

async function pass(entries) {
  for (const width of widths) {
    await viewport(width);
    for (const entry of entries) {
      if (!wanted(entry.name) || (entry.widths && !entry.widths.includes(width))) {
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

  const env = JSON.parse(execFileSync(php, ['tests/tools/browser-env.php', 'up', work, issuer, origin], { cwd: backend, encoding: 'utf8' }).trim().split('\n').pop());
  database = env.database;
  backendCopy = env.backend;
  const iamDir = join(work, 'stand-in-iam');
  execFileSync(
    php,
    ['-r', 'require $argv[1] . "/vendor/autoload.php"; \\Anotoki\\Lib\\Auth\\Testing\\TestIam::create($argv[2], $argv[3], "genshin", "screenshots");', '--', env.backend, iamDir, issuer],
    { stdio: 'inherit' },
  );

  start(php, ['-S', `127.0.0.1:${IAM}`, join(env.backend, 'vendor/anotoki/lib/backend/testing/stand-in-iam.php')], {
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
  await setIam({ login_required: false, user: OWNER });
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
  if (only === null || only.some((text) => 'error-report'.includes(text) || 'admin-errors-row'.includes(text))) {
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
  await pass(FORM_SAVES);
  await pass(ADMIN_FOOTER);
  await pass(ADMIN_FILES);
  await pass(ADMIN_STATUS);
  await pass(SIGNED_IN);
  await pass(ACCOUNT_KEPT);

  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  if (formBodies.length) {
    writeFileSync(join(out, 'form-bodies.json'), JSON.stringify(formBodies, null, 2));
  }
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
