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
  // A banner's kind on the Banners page, inferred from what it features (weapons -> weapon; users/062).
  'database.banners.kind.': ['character', 'weapon'],
  // A phase's state on the Banners page, counted in days: one, few, other - the forms Intl.PluralRules
  // names, which the page picks by the reader's language (pluralTail, database-helpers.ts; users/062).
  'database.banners.state.endsIn.': ['one', 'few', 'other'],
  'database.banners.state.startsIn.': ['one', 'few', 'other'],
  // How many banners a version holds, beside its heading on the Banners page - the same three forms.
  'database.banners.count.': ['one', 'few', 'other'],
  // How a database list is sectioned - the Group by control's choices (users/063; list-groups.ts' GroupKey).
  'database.filters.group.': ['region', 'version', 'rarity', 'none'],
  // How many characters, weapons or materials: a list's total and each section's count - the same three forms.
  'database.characters.count.': ['one', 'few', 'other'],
  'database.weapons.count.': ['one', 'few', 'other'],
  'database.materials.count.': ['one', 'few', 'other'],
  // Elemental Minesweeper's difficulties, and the hint under the chosen one.
  'game.minesweeper.difficulty.': ['easy', 'medium', 'hard'],
  'game.minesweeper.difficultyHint.': ['easy', 'medium', 'hard'],
  // The character tournament's formats.
  'game.tournament.format.': ['single', 'double', 'roundRobin'],
  // A quiz question's difficulty (the quizzes, the Profile's history).
  'quiz.difficulty.': ['easy', 'medium', 'hard'],
  // The Profile's tabs, the order of its Characters tab, and how many characters its filters left - the same three
  // forms (users/065).
  'profile.tabs.': ['overview', 'quizzes', 'characters', 'history'],
  'profile.sort.': ['played', 'best', 'toughest', 'name'],
  'profile.characters.count.': ['one', 'few', 'other'],
};
