/**
 * The translation keys that are put together at run time: prefix -> every
 * tail the code can add to it. A key is only ever built from one of these
 * closed sets - the site's own values (a role, a difficulty, a voice-over's
 * type), never from anything a reader typed or an address said.
 *
 * Nothing imports this: it is read, as text, by the key scan of
 * `php translations.php --status` (backend/translations.php, the anotoki
 * library's KeyScanner), which cannot see a key that is never written out
 * whole. Every key listed here must exist in the database; a database key
 * under one of these prefixes that is not listed is unused; and a key put
 * together from a prefix this table does not declare fails the scan.
 *
 * So an entry is a prefix ending in a dot, in quotes, and its tails written
 * out as a list of quoted strings - never a list made by code (a spread, a map
 * over a constant), which the scan cannot read. A new value of one of these
 * sets is a tail here and a key in a users/ migration.
 */
export const DYNAMIC_KEYS: Record<string, readonly string[]> = {
  // The account panel's role, from the token (site-account-modal).
  'account.roleName.': ['admin', 'editor', 'user'],
  // Who a page is drawn for, when it is not everybody (route-notice; site_routes' visibility).
  'route.audience.': ['PUBLIC', 'USER', 'EDITOR', 'ADMIN'],
  // A daily quiz's state on the Daily page (a new one has no badge).
  'daily.status.': ['won', 'lost', 'started'],
  // A voice-over's type, the filter of the character page's voice-over tab (characters_voice_overs.type).
  'database.detail.': ['story', 'combat'],
  // Elemental Minesweeper's difficulties, and the hint under the chosen one.
  'game.minesweeper.difficulty.': ['easy', 'medium', 'hard'],
  'game.minesweeper.difficultyHint.': ['easy', 'medium', 'hard'],
  // The character tournament's formats.
  'game.tournament.format.': ['single', 'double', 'roundRobin'],
  // A quiz question's difficulty (the quizzes, the Profile's history).
  'quiz.difficulty.': ['easy', 'medium', 'hard'],
};
