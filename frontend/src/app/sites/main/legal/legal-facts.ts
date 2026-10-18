import { inject } from '@angular/core';
import { AnotokiAuth } from '@anotoki/lib/auth';
import { ANOTOKI_LEGAL_CONFIG, AnotokiLegalConfig, LegalFacts, LegalProcessor } from '@anotoki/lib/legal';
import { TranslationService } from '@anotoki/lib/translations';
import { LOCAL_STORAGE_PREFIX } from '../../../shared/local-lib/services/local-storage.service';
import { SiteSettingsService } from '../../../shared/local-lib/services/site-settings.service';
import { VISITOR_STORAGE_KEY } from '../../../shared/local-lib/services/visitor-key.service';
import { THEME_STORAGE_KEY } from '../../../shared/local-lib/theme-toggle/theme-toggle.service';
import { SILENT_SIGN_IN_KEY } from '../../../shared/silent-sign-in';
import { LANGUAGE_STORAGE_KEYS } from '../../../shared/site-translations';
import { StorageKeys } from '../../../shared/state-manager.service';
import { ANNOUNCEMENT_DISMISSED_KEY } from '../common/announcement/announcement.component';

/**
 * The day genshin's facts last changed: the pages show the later of it and the
 * day the library's own words last did. Move it with any change to what the
 * site keeps or for how long - and the strings that say so (`legal.*`,
 * migration users/055 and whatever rewords them after it).
 */
export const SITE_LEGAL_UPDATED = '2026-10-18';

/**
 * The anotoki account's cookie for every anotoki site (the IAM's
 * hint_cookie_name, set under the IAM's parent domain): genshin reads it - a
 * visitor signed in at the IAM is signed in here with one silent hop
 * (shared/site-auth.ts, the library's hint).
 */
export const SIGN_IN_HINT_COOKIE = 'anotoki_signed_in';

/**
 * The hosting company, as the owner named it on 2026-10-18: WebSupport s.r.o.
 * (Slovakia) holds the servers, the databases and the mail. Its name and
 * address are the code's, never a string's (an administrator rewording the
 * Privacy page must not be able to change where its link goes); the
 * screenshot run checks the Privacy page names it (frontend/scripts/screenshots.mjs).
 */
export const GENSHIN_HOSTING: LegalProcessor = { preset: 'hosting', name: 'WebSupport s.r.o.', url: 'https://www.websupport.sk' };

/**
 * genshin's facts, in the page's language - read as a page is drawn, so a
 * change of language redraws them. Each must stay true of the code:
 *
 * - the record of a person (`legal.record.*`): users - the anotoki account's
 *   id (the IAM's sub), its name from the latest token (preferred_username,
 *   the library's PeopleRecorder: backend api/site_user.php, admin_tools.php's
 *   sitePeople()), created_at (first seen); no address (users/052), no
 *   last-seen for a person; never deleted (the People page's Delete keeps the
 *   row); its name deleted-{id} once the account is deleted (the library's
 *   scrub, users.anonymized_at). Old accounts may still hold the background
 *   and version columns of before the IAM, which nothing writes any more;
 * - a player's games (`legal.games.*`): quizzes_states (each quiz's saved
 *   game, the daily's too), user_quiz_history (every question finished: the
 *   quiz, the character, the difficulty, won or not, the tries, when),
 *   quiz_stats_history (wins, losses, tries by character and quiz) -
 *   VISITOR_PERSON_TABLES; nothing deletes them by age; the People page's
 *   Delete takes them (peopleDeleteGames()); the scrub leaves them, nameless;
 * - who changed what (`legal.staff.*`): created_by / updated_by on every
 *   content table, files.created_by, guide_contents, translations,
 *   site_settings and site_routes updated_by - the staff's ids, as long as the
 *   row; their name shown from the record;
 * - the limits' counts (`legal.limits.*`): visitor_starts (a keyed HMAC of the
 *   address bucket, deleted after an hour: api/visitors.php, users/054); the
 *   library's feedback limits (storage/cache, keyed hashes, a day) and the
 *   pages' error reports' (storage/error-log/client-errors.json, a sender's
 *   for the hour);
 * - the old copies (`legal.oldCopies.*`): feedback_before_library (without ip
 *   and submitter_hash: genshin_impact/029), audit_logs_before_library
 *   (changed_by ids: 028), translations_before_library and
 *   translation_keys_before_library (created_by / updated_by: users/050) -
 *   kept until a later migration drops them, unpruned; the scrub blanks
 *   feedback_before_library's name, address and browser
 *   (peopleScrubCopies());
 * - visitors (`legal.visitors.*`, users/045, while the IAM requires no
 *   sign-in): users with a negative id, visitor_key_hash (the key's SHA-256),
 *   created_at and last_seen_at, their games under that id; swept keep_days
 *   after the last visit (visitorSweep(), the server's number relayed in
 *   /api/settings/public: SiteSettingsService.visitorKeepDays); moved into an
 *   account at a sign-in (visitorMove()) - after a silent one only into an
 *   account with nothing here yet (personHasData());
 * - feedback (the library's, siteFeedback(): its keep - spam 30 days, resolved
 *   365, pruned daily - left as the library's): the kind, the section
 *   (FEEDBACK_SECTIONS), a subject, the message, the form's fields
 *   (shared/site-feedback.ts: steps, expected, browser and device for a bug;
 *   why it matters for an idea), the page, the language, the browser, the
 *   sender's id unless "without my name", the reply address the form sends
 *   (the account's written in, which can be cleared); the scrub and the
 *   People delete forget the reply address and the browser;
 * - the error log: the library's words and its 30 days (siteErrorLog() sets no
 *   `days`); a keyed hash of the address bucket, never the address. The old
 *   storage/logs/errors-*.jsonl of before 0.4.1 stay until the owner removes
 *   them (DEV.md);
 * - the audit log (`legal.auditLog.what`): the library's anotoki_audit_log -
 *   content.*, catalogue.*, the words', the tools' own, a person's games or a
 *   message deleted -, the actor's id and IAM session (actor_session), no
 *   address (api/audit_log.php); no set time limit (the library's words);
 * - backups: the library's, plain (sealed, not encrypted), kept by count - 14
 *   daily (made after the first answer of a UTC day: only on a day the site
 *   is used), 5 before an update, 5 before a restore, by hand until deleted
 *   (siteBackups() sets none of its own) -, downloadable by the ADMIN: the
 *   library's words, 0.6.2's. The old pg_dump folders stay until the owner
 *   removes them (DEV.md);
 * - this browser's storage: the sign-in's (the library's auth module, under
 *   `anotoki-auth:{client id}` and its `:hint` marker - genshin signs in by the
 *   hint -, and its session items while a sign-in is under way), the IAM's
 *   hint cookie (read here), the silent sign-in's note (SILENT_SIGN_IN_KEY),
 *   the theme (THEME_STORAGE_KEY under LocalStorageService's prefix), the
 *   language and its cached words (LANGUAGE_STORAGE_KEYS; a `?lang=` held for
 *   the tab under the language's key in sessionStorage), the visitor's key
 *   (VISITOR_STORAGE_KEY), the browser's own games and the difficulty
 *   (StorageKeys.STORAGE_KEY, app_data, no prefix), the version What's new
 *   showed, the wallpaper, the announcement closed, the admin Translations
 *   page's unsaved words (sessionStorage);
 * - counting visits: the family's Umami (src/index.html: umami.anotoki.eu, the
 *   query and the fragment left out) - the library's words;
 * - who else handles data: the hosting company, WebSupport s.r.o. (the owner
 *   named it on 2026-10-18: the servers, the databases and the mail;
 *   GENSHIN_HOSTING), and Cloudflare;
 * - the fan clause: Terms and Contact (`fanDisclaimer: 'hoyoverse'`), and the
 *   footer under every page (footer.fanDisclaimer).
 *
 * genshin takes feedback: the Contact page opens the family's form in the
 * kit's dialog (configured in shared/site-feedback.ts). Every address the
 * pages link to is the code's - the anotoki account's pages from the IAM the
 * site signs in with (its issuer, from /api/settings/public), the operator
 * and Cloudflare in the library -, never a string's: a rewording on the
 * Translations page can never change where a link goes (the 0.6.0 review). So
 * are the cookie's and the stored items' names.
 */
export function siteLegalFacts(i18n: TranslationService, auth: AnotokiAuth, settings: SiteSettingsService): LegalFacts {
  const iam = (auth.issuer() || settings.auth()?.issuer || '').replace(/\/+$/, '');
  const client = auth.clientId() || settings.auth()?.client_id || 'genshin';
  const days = settings.visitorKeepDays();
  const local = (key: string): string => `${LOCAL_STORAGE_PREFIX}${key}`;
  // Each key written whole: the key scan (backend translations.php, the library's KeyScanner) reads the keys a page asks for as they are written.
  return {
    site: i18n.t('legal.site'),
    about: i18n.t('legal.about'),
    updated: SITE_LEGAL_UPDATED,
    account: { deleteUrl: auth.accountUrl() || settings.auth()?.account_url || (iam ? `${iam}/account` : ''), privacyUrl: iam ? `${iam}/privacy` : null },
    data: [
      { name: i18n.t('legal.record.name'), what: i18n.t('legal.record.what'), why: i18n.t('legal.record.why'), kept: i18n.t('legal.record.kept') },
      { name: i18n.t('legal.games.name'), what: i18n.t('legal.games.what'), why: i18n.t('legal.games.why'), kept: i18n.t('legal.games.kept') },
      { name: i18n.t('legal.staff.name'), what: i18n.t('legal.staff.what'), why: i18n.t('legal.staff.why'), kept: i18n.t('legal.staff.kept') },
      { name: i18n.t('legal.limits.name'), what: i18n.t('legal.limits.what'), why: i18n.t('legal.limits.why'), kept: i18n.t('legal.limits.kept') },
      { name: i18n.t('legal.oldCopies.name'), what: i18n.t('legal.oldCopies.what'), why: i18n.t('legal.oldCopies.why'), kept: i18n.t('legal.oldCopies.kept') },
    ],
    visitors: { what: i18n.t('legal.visitors.what'), kept: i18n.t('legal.visitors.kept', { days }) },
    feedback: { what: i18n.t('legal.feedback.what') },
    auditLog: { what: i18n.t('legal.auditLog.what') },
    storage: [
      { preset: 'signIn', name: `anotoki-auth:${client}, anotoki-auth:${client}:hint` },
      {
        name: `anotoki-auth:${client}:login:…, anotoki-auth:discovery:…`,
        kind: 'session',
        purpose: i18n.t('legal.storage.signInUnderWay.purpose'),
        kept: i18n.t('legal.storage.signInUnderWay.kept'),
      },
      { preset: 'signInHint', name: SIGN_IN_HINT_COOKIE },
      { name: SILENT_SIGN_IN_KEY, kind: 'local', purpose: i18n.t('legal.storage.silent.purpose'), kept: i18n.t('legal.storage.silent.kept') },
      { preset: 'theme', name: local(THEME_STORAGE_KEY) },
      { preset: 'language', name: `${LANGUAGE_STORAGE_KEYS.language}, ${LANGUAGE_STORAGE_KEYS.cache}` },
      { name: LANGUAGE_STORAGE_KEYS.language, kind: 'session', purpose: i18n.t('legal.storage.tabLanguage.purpose'), kept: i18n.t('legal.storage.untilTabClosed') },
      { preset: 'visitorKey', name: VISITOR_STORAGE_KEY, kept: i18n.t('legal.storage.visitorKey.kept', { days }) },
      { name: StorageKeys.STORAGE_KEY, kind: 'local', purpose: i18n.t('legal.storage.browserGames.purpose'), kept: i18n.t('legal.storage.browserGames.kept') },
      { name: local(StorageKeys.VERSION), kind: 'local', purpose: i18n.t('legal.storage.version.purpose'), kept: i18n.t('legal.storage.untilCleared') },
      { name: local(StorageKeys.BACKGROUND), kind: 'local', purpose: i18n.t('legal.storage.background.purpose'), kept: i18n.t('legal.storage.untilChosenAgain') },
      { name: local(ANNOUNCEMENT_DISMISSED_KEY), kind: 'local', purpose: i18n.t('legal.storage.announcement.purpose'), kept: i18n.t('legal.storage.announcement.kept') },
      { name: LANGUAGE_STORAGE_KEYS.drafts, kind: 'session', purpose: i18n.t('legal.storage.drafts.purpose'), kept: i18n.t('legal.storage.drafts.kept') },
    ],
    processors: [GENSHIN_HOSTING, { preset: 'cloudflare' }],
    fanDisclaimer: 'hoyoverse',
  };
}

/**
 * The legal pages' configuration: the site's (shared/site-legal.ts - the
 * page's language, the database's words) with the facts the pages read. Their
 * frame provides it (legal-frame.component.ts), so the facts - this code and
 * its strings' keys - load with the pages, never with the first page.
 */
export function siteLegalPagesConfig(): AnotokiLegalConfig {
  const root = inject(ANOTOKI_LEGAL_CONFIG, { skipSelf: true });
  const i18n = inject(TranslationService);
  const auth = inject(AnotokiAuth);
  const settings = inject(SiteSettingsService);
  return { ...root, facts: () => siteLegalFacts(i18n, auth, settings) };
}
