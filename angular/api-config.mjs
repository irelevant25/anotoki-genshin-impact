/**
 * The decisions behind the generated API client.
 *
 * api-spec.json says what the backend has: its routes, its tables, its models.
 * It says nothing about what any of that should be called on this side, which
 * service it belongs to, or what a route answers with where the PHP does not
 * declare it. Those are choices, and they live here so that everything reading
 * the spec makes the same ones - generate-api.mjs writing the TypeScript client,
 * and generate-openapi.mjs writing the document that describes the same API to
 * everything else.
 *
 * Nothing here emits anything. Add a route to the backend and the two things
 * worth checking are RESPONSES, if the response is not a plain table row, and
 * NAMES, if the mechanical name comes out awkward.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
//
// Everything below is a decision rather than a fact about the backend. Facts
// live in api-spec.json.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which service each route belongs to; first prefix that matches wins.
 *
 * A resource keeps its sub-resources: `/api/characters-ascensions` is the
 * character service's business, because a caller editing a character needs its
 * ascensions in the same breath. The name-keyed lookup tables - elements,
 * regions, weapon types, the rest - are collected into one lookup service:
 * they are all `{ name }`, they are all read to fill a dropdown, and eighteen
 * files holding four methods each would be worse than one holding seventy.
 */
export const GROUPS = [
  ['auth', ['/api/auth/']],
  ['user', ['/api/users']],
  ['language', ['/api/languages']],
  ['translation', ['/api/translations', '/api/translation-keys', '/api/admin/translations']],
  ['backup', ['/api/backups']],
  ['character', ['/api/characters', '/api/character/']],
  ['weapon', ['/api/weapons']],
  ['artifact', ['/api/artifacts']],
  ['material', ['/api/materials']],
  ['food', ['/api/foods']],
  ['enemy', ['/api/enemies']],
  ['banner', ['/api/banners']],
  ['quiz', ['/api/quizzes', '/api/quiz-', '/api/quiz/', '/api/user-quiz-history']],
  ['background', ['/api/backgrounds']],
  ['stat', ['/api/stats']],
  ['feedback', ['/api/feedback']],
  ['file', ['/api/files', '/api/upload']],
  ['audit-log', ['/api/audit-logs']],
  ['migration', ['/api/migrations']],
  ['dashboard', ['/api/dashboard']],
  ['lookup', ['/api/']],
];

/** One line under each service class, saying what it covers. */
export const GROUP_DOCS = {
  auth: 'Registering, signing in, and the settings that hang off the signed-in account.',
  user: 'The user list behind the admin site. Everything here needs a role.',
  language: 'Which languages the site offers, and which of them is the fallback.',
  translation: 'Translation keys and their strings, per language.',
  backup: 'Database dumps: listing them, making them, and restoring one.',
  character: 'Characters and everything hanging off one - talents, ascensions, constellations, builds.',
  weapon: 'Weapons, their refinements and their ascension costs.',
  artifact: 'Artifact sets and the pieces in them.',
  material: 'Materials, the groups they belong to, and where each one is spent.',
  food: 'Dishes and their recipes.',
  enemy: 'Enemies, their phases, their drops and their elemental behaviour.',
  banner: 'Wish banners and the characters and weapons on them.',
  quiz: 'The quizzes, a player\'s progress through them, and the history behind the stats.',
  background: 'Site backgrounds a visitor can pick between.',
  stat: 'The stat names the rest of the data refers to.',
  feedback: 'Messages sent from the site\'s contact form.',
  file: 'The asset tree on disk: browsing it, adding to it, and undoing a deletion.',
  'audit-log': 'Who changed which row, and to what.',
  migration: 'Which migrations have run against which database.',
  dashboard: 'The counts on the admin landing page.',
  lookup: 'The name-keyed lookup tables. Every one is a list of `{ name }`, read to fill a dropdown.',
};

/**
 * Endpoints whose response no table describes, and the hand-written type that
 * does describe it. `T` is the type name; it must be exported from api/types.
 */
export const RESPONSES = {
  'POST /api/auth/register': 'AuthSession',
  'POST /api/auth/login': 'AuthSession',
  'GET /api/auth/me': 'AuthUser',
  'PUT /api/auth/theme': 'ThemeChanged',
  'PUT /api/auth/language': 'LanguageChanged',
  'POST /api/auth/logout': 'ApiMessage',
  'PUT /api/auth/password': 'ApiMessage',

  'GET /api/users': 'AdminUser[]',
  'GET /api/users/{id}': 'AdminUser',
  'POST /api/users': 'AdminUser',
  'PUT /api/users/{id}': 'AdminUser',
  'GET /api/users/filters': 'UserFilters',
  'PUT /api/users/{id}/password': 'ApiMessage',
  'PUT /api/users/{id}/enabled': 'AdminUser',

  'GET /api/translations/{code}': 'TranslationBundleResponse',
  'GET /api/translations/{code}/export': 'TranslationBundle',
  'PUT /api/translations/{code}/import': 'TranslationImportResult',
  'GET /api/admin/translations': 'TranslationAdminView',
  'PUT /api/admin/translations': 'TranslationSaveResult',
  'DELETE /api/languages/{code}': 'LanguageDeleted',
  'DELETE /api/translation-keys/{name}': 'TranslationKeyDeleted',

  'GET /api/backups': 'BackupEntry[]',
  'GET /api/backups/status': 'BackupStatus',
  'GET /api/backups/{id}': 'BackupEntry',
  'POST /api/backups': 'BackupEntry',
  'DELETE /api/backups/{id}': 'ApiMessage',
  'GET /api/backups/{id}/preview/{alias}': 'BackupPreview',
  'POST /api/backups/{id}/restore/{alias}': 'RestoreResult',

  'GET /api/characters/{id}/full': 'CharacterFull',

  'GET /api/materials/{id}/usage': 'MaterialUsage',

  'GET /api/dashboard/stats': 'DashboardStats',

  'GET /api/feedback': 'FeedbackPage',
  'GET /api/feedback/filters': 'FeedbackFilters',
  'POST /api/feedback': 'ApiMessage',
  'PUT /api/feedback/{id}/status': 'FeedbackStatusChanged',

  'GET /api/files': 'AssetFilePage',
  'GET /api/files/folders': 'AssetFolder[]',
  'GET /api/files/trash': 'TrashedFile[]',
  'POST /api/files': 'AssetUploadResult',
  'POST /api/files/restore': 'AssetRestoreResult',
  'DELETE /api/files': 'AssetTrashResult',
  'POST /api/upload': 'UploadResult',
  'POST /api/uploads/{entity}/{field}': 'EntityUploadResult',
  'POST /api/uploads/{entity}/{id}/{field}': 'RecordUploadResult',

  'GET /api/migrations': 'MigrationEntry[]',
  'GET /api/migrations/file': 'MigrationFile',

  'GET /api/audit-logs': 'AuditLogPage',
  'GET /api/audit-logs/filters': 'AuditLogFilters',

  'GET /api/quiz/progress': 'QuizProgress[]',
  'PUT /api/quiz/progress/{quiz}': 'QuizProgressSaved',
  'DELETE /api/quiz/progress/{quiz}': 'QuizProgressDeleted',
  'POST /api/quiz/result': 'QuizResultAck',
  'GET /api/quiz/stats': 'QuizStats',
  'GET /api/quiz/voice-over/random': 'QuizVoiceOverRound',
};

/**
 * The `/full` endpoints.
 *
 * Only the two reads answer with the composite. A create or an update answers
 * with the parent row on its own - registerFullResource() re-reads just the
 * parent before replying - so those are typed from the table like any other
 * write, and the entry below is only for the shapes that are composite.
 */
for (const [entity, type] of [
  ['weapons', 'WeaponFull'],
  ['artifacts', 'ArtifactFull'],
  ['materials', 'MaterialFull'],
  ['foods', 'FoodFull'],
  ['enemies', 'EnemyFull'],
  ['banners', 'BannerFull'],
]) {
  RESPONSES[`GET /api/${entity}/full`] = `${type}[]`;
  RESPONSES[`GET /api/${entity}/{id}/full`] = type;
}

/** A create or update through `/full` answers with the parent row alone. */
for (const [entity, row] of [
  ['weapons', 'Weapon'],
  ['artifacts', 'Artifact'],
  ['materials', 'Material'],
  ['foods', 'Food'],
  ['enemies', 'Enemy'],
  ['banners', 'Banner'],
]) {
  RESPONSES[`POST /api/${entity}/full`] = row;
  RESPONSES[`PUT /api/${entity}/{id}/full`] = row;
}

/**
 * Request bodies the PHP models do not describe, and the hand-written type
 * that does. A `FormData` entry means the endpoint takes multipart, not JSON.
 */
export const BODIES = {
  'POST /api/auth/register': 'RegisterRequest',
  'POST /api/auth/login': 'LoginRequest',
  'PUT /api/auth/theme': 'ThemeRequest',
  'PUT /api/auth/language': 'LanguageRequest',
  'PUT /api/auth/password': 'ChangePasswordRequest',
  'POST /api/users': 'UserCreateRequest',
  'PUT /api/users/{id}': 'UserUpdateRequest',
  'PUT /api/users/{id}/password': 'SetPasswordRequest',
  'PUT /api/users/{id}/enabled': 'EnabledRequest',
  'PUT /api/admin/translations': 'TranslationSaveRequest',
  'PUT /api/translations/{code}/import': 'TranslationImportRequest',
  'PUT /api/feedback/{id}/status': 'FeedbackStatusRequest',
  'POST /api/feedback': 'FeedbackRequest',
  'POST /api/backups': 'BackupRequest',
  'POST /api/backups/{id}/restore/{alias}': 'RestoreRequest',
  'PUT /api/quiz/progress/{quiz}': 'QuizProgressRequest',
  'POST /api/quiz/result': 'QuizResultRequest',
  'POST /api/files': 'FormData',
  'POST /api/files/restore': 'FormData',
  'POST /api/upload': 'FormData',
  'POST /api/uploads/{entity}/{field}': 'FormData',
  'POST /api/uploads/{entity}/{id}/{field}': 'FormData',
  'POST /api/characters/full': 'FormData',
  'PUT /api/characters/{id}/full': 'FormData',
};

for (const entity of ['weapons', 'artifacts', 'materials', 'foods', 'enemies', 'banners']) {
  BODIES[`POST /api/${entity}/full`] = 'FormData';
  BODIES[`PUT /api/${entity}/{id}/full`] = 'FormData';
}

/**
 * Typed query strings, for the endpoints that read more than a stray flag.
 *
 * A `?` on the end means every field is optional, and so is the argument.
 */
export const QUERIES = {
  'GET /api/users': 'UserQuery?',
  'GET /api/languages': 'LanguageQuery?',
  'GET /api/feedback': 'FeedbackQuery?',
  'GET /api/audit-logs': 'AuditLogQuery',
  'GET /api/files': 'AssetFileQuery',
  'GET /api/migrations/file': 'MigrationFileQuery',
  'DELETE /api/files': 'AssetFileRef',
};

/** Method names the mechanical rules get wrong, or that would collide. */
export const NAMES = {
  'GET /api/character/random': 'getRandomCharacter',
  'GET /api/quiz/voice-over/random': 'getRandomVoiceOverRound',
  'GET /api/feedback': 'getFeedbackPage',
  'POST /api/feedback': 'sendFeedback',
  'GET /api/feedback/filters': 'getFeedbackFilters',
  'GET /api/feedback/{id}': 'getFeedbackEntry',
  'DELETE /api/feedback/{id}': 'deleteFeedbackEntry',
  'GET /api/files': 'getAssetFiles',
  'GET /api/files/folders': 'getAssetFolders',
  'GET /api/files/trash': 'getTrashedFiles',
  'POST /api/files': 'uploadAssetFile',
  'DELETE /api/files': 'deleteAssetFile',
  'POST /api/files/restore': 'restoreAssetFile',
  'POST /api/upload': 'uploadFile',
  'POST /api/uploads/{entity}/{field}': 'uploadEntityFile',
  'POST /api/uploads/{entity}/{id}/{field}': 'uploadRecordFile',
  'GET /api/migrations/file': 'getMigrationFile',
  'GET /api/dashboard/stats': 'getDashboardStats',
  'GET /api/admin/translations': 'getAdminTranslations',
  'PUT /api/admin/translations': 'saveAdminTranslations',
  'POST /api/auth/login': 'login',
  'POST /api/auth/logout': 'logout',
  'POST /api/auth/register': 'register',
  'GET /api/auth/me': 'getCurrentUser',
  'PUT /api/auth/theme': 'setTheme',
  'PUT /api/auth/language': 'setLanguage',
  'PUT /api/auth/password': 'changePassword',
  'PUT /api/users/{id}/password': 'setUserPassword',
  'PUT /api/users/{id}/enabled': 'setUserEnabled',
  'GET /api/users/filters': 'getUserFilters',
  'GET /api/users': 'getUsers',
  'GET /api/audit-logs': 'getAuditLogPage',
  'GET /api/audit-logs/filters': 'getAuditLogFilters',

  'GET /api/quizzes': 'getQuizzes',
  'GET /api/quiz/progress': 'getQuizProgress',
  'PUT /api/quiz/progress/{quiz}': 'updateQuizProgress',
  'DELETE /api/quiz/progress/{quiz}': 'deleteQuizProgress',
  'POST /api/quiz/result': 'submitQuizResult',
  'GET /api/quiz/stats': 'getQuizStats',

  'GET /api/translations/{code}': 'getTranslations',
  'GET /api/translations/{code}/export': 'exportTranslations',
  'PUT /api/translations/{code}/import': 'importTranslations',

  'GET /api/backups/status': 'getBackupStatus',
  'GET /api/backups/{id}/download/{alias}': 'downloadBackup',
  'GET /api/backups/{id}/preview/{alias}': 'previewBackup',
  'POST /api/backups/{id}/restore/{alias}': 'restoreBackup',
};

/**
 * Endpoints left out of the client.
 *
 * `affiliations` and `characters-affiliations` are registered but cannot work:
 * neither table exists - affiliations is a JSONB column on `characters` - and
 * neither `Affiliation` nor `CharacterAffiliation` is a declared class, so
 * validateRequest() raises a ReflectionException and every one of the nine
 * routes answers 500. Generating a client for them would only spread the fault.
 */
export const SKIP_PREFIXES = ['/api/affiliations', '/api/characters-affiliations'];

/**
 * Endpoints that answer with a file rather than JSON.
 * These are typed as a Blob and asked for with responseType: 'blob'.
 */
export const BLOBS = new Set(['GET /api/backups/{id}/download/{alias}']);

/** Plurals the rules below would get wrong. */
export const IRREGULAR_SINGULAR = { quizzes: 'quiz', statuses: 'status' };
export const IRREGULAR_PLURAL = { Quiz: 'Quizzes' };
export const UNCOUNTABLE = new Set(['feedback', 'progress', 'stats', 'status', 'data']);

// ─────────────────────────────────────────────────────────────────────────────
// Words
// ─────────────────────────────────────────────────────────────────────────────

export const singular = (word) => {
  const lower = word.toLowerCase();
  if (IRREGULAR_SINGULAR[lower]) return IRREGULAR_SINGULAR[lower];
  if (UNCOUNTABLE.has(lower) || !word.endsWith('s') || word.endsWith('ss')) return word;
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (/(ch|sh|x|z|s)es$/.test(word)) return word.slice(0, -2);
  return word.slice(0, -1);
};

export const plural = (word) => {
  if (IRREGULAR_PLURAL[word]) return IRREGULAR_PLURAL[word];
  if (UNCOUNTABLE.has(word.toLowerCase())) return word;
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
  if (/(ch|sh|x|z|s)$/.test(word)) return word + 'es';
  return word + 's';
};

export const pascal = (text) =>
  text
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

export const camel = (text) => {
  const word = pascal(text);
  return word[0].toLowerCase() + word.slice(1);
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A SQL column type as TypeScript.
 *
 * The mapping is what PDO actually hands back, checked against the running
 * database rather than assumed: integers and booleans arrive native, and JSONB
 * arrives as a raw JSON *string* - nothing decodes it on the way out. Typing a
 * JSONB column as its parsed shape would be a lie the compiler then enforces.
 */
export function sqlToTs(column) {
  if (column.enum) {
    return column.enum.map((value) => `'${value.replace(/'/g, "\\'")}'`).join(' | ');
  }

  const type = column.sqlType.toUpperCase();
  if (/^(SERIAL|BIGSERIAL|SMALLSERIAL|INT|INTEGER|SMALLINT|BIGINT|NUMERIC|DECIMAL|REAL|DOUBLE)/.test(type)) {
    return 'number';
  }
  if (/^BOOL/.test(type)) return 'boolean';
  if (/^(JSON|JSONB)/.test(type)) return 'string';
  return 'string';
}

/**
 * A PHP constructor parameter type as TypeScript.
 *
 * `array` becomes `string[]`. PHP says only "array", but every array field here
 * is a JSON column and every one of them holds a list of strings - a
 * character's affiliations, a weapon's effects, how a material is obtained.
 * `unknown[]` would be the letter of what PHP declares and useless to work
 * with; if one of these ever holds something else, this is the line to widen.
 */
export function phpToTs(field, isJsonField) {
  const parts = new Set();

  for (const type of field.types) {
    if (type === 'int' || type === 'float') parts.add('number');
    else if (type === 'bool') parts.add('boolean');
    else if (type === 'string') parts.add('string');
    else if (type === 'array') parts.add('string[]');
    else parts.add('unknown');
  }

  // A JSON column travels as the value on the way in and as a raw JSON string
  // on the way out - PDO does not decode JSONB - so both are in the type, and
  // anything reading one runs it through parseJsonColumn first.
  if (isJsonField) {
    parts.add('string');
  }

  const list = [...parts];
  return field.nullable ? [...list, 'null'].join(' | ') : list.join(' | ');
}


/**
 * Path arguments become method parameters, typed from the route's own regex.
 *
 * `{id:[0-9]+}` is a number and `{code}` is a string, but two cases need more
 * than the regex: a backup's id is `{id:[0-9]{8}-...}`, which starts with a
 * digit class and is not a number at all, and several numeric ids are written
 * with no constraint. So a constraint decides when there is one, and the name
 * decides when there is not.
 */
export const argType = (arg) => {
  if (arg.constraint) {
    return /^\[0-9\]\+$/.test(arg.constraint) ? 'number' : 'string';
  }
  return /(^|_)id$/.test(arg.name) ? 'number' : 'string';
};

/**
 * Everything both generators need to know about one spec.
 *
 * Routes come back filtered: SKIP_PREFIXES is applied here, once, so neither
 * emitter has to remember that some registered routes cannot work.
 */
export function analyse(spec) {
  const tableByName = new Map(spec.tables.map((table) => [table.table, table]));
  const modelByName = new Map(spec.models.map((model) => [model.name, model]));
  const modelByShortName = new Map(spec.models.map((model) => [model.name.split('\\').pop(), model]));

  const routes = spec.routes.filter((route) => !SKIP_PREFIXES.some((prefix) => route.path.startsWith(prefix)));
  const skipped = spec.routes.length - routes.length;

  /** The service a route belongs to. */
  function groupOf(route) {
    for (const [name, prefixes] of GROUPS) {
      if (prefixes.some((prefix) => route.path.startsWith(prefix))) return name;
    }
    return 'lookup';
  }

  /**
   * The model a route's `validateRequest` names, whatever that file imported
   * it as - `Role::class` under `use GenshinImpact\\Role`, but
   * `User\\Language::class` written out.
   */
  const resolveModel = (name) => modelByName.get(name) ?? modelByShortName.get(name.split('\\').pop());

  const payloadName = (className) => `${pascal(className.split('\\').pop())}Payload`;

  /** The table a route answers from, when the schema knows it. */
  const tableOf = (route) => (route.tables.length ? tableByName.get(route.tables[0]) : undefined);

  const VERBS = { GET: 'get', POST: 'create', PUT: 'update', DELETE: 'delete' };

  function operationName(route) {
    const key = `${route.method} ${route.path}`;
    if (NAMES[key]) return NAMES[key];

    const segments = route.path.replace(/^\/api\//, '').split('/');
    const statics = segments.filter((segment) => !segment.startsWith('{'));
    const hasArgs = route.args.length > 0;
    const table = tableOf(route);

    // The noun comes from the row interface where there is one, so a method and
    // the type it returns are spelled the same way: getCharacterBuildTeamCharacters
    // alongside CharacterBuildTeamCharacter, rather than the URL's flattened
    // charactersBuildsTeamsCharacters.
    const base = table?.interface ?? pascal(singular(statics[0]));
    const noun = hasArgs || route.method === 'POST' ? base : plural(base);
    const trailing = statics.slice(1).map(pascal).join('');

    return camel(`${VERBS[route.method]}-${noun}${trailing}`);
  }



  function responseType(route) {
    const key = `${route.method} ${route.path}`;
    if (BLOBS.has(key)) return 'Blob';
    if (RESPONSES[key]) return RESPONSES[key];

    const table = tableOf(route);
    if (!table?.interface) return 'unknown';

    if (route.method === 'DELETE') return 'ApiMessage';

    const one = route.args.length > 0 || route.method === 'POST';
    const row = route.expanded.length
      ? `Expanded<${table.interface}, ${route.expanded.map((c) => `'${c}'`).join(' | ')}>`
      : table.interface;

    return one ? row : `${row}[]`;
  }

  function bodyType(route) {
    const key = `${route.method} ${route.path}`;
    if (BODIES[key]) return BODIES[key];
    if (!['POST', 'PUT', 'PATCH'].includes(route.method)) return null;
    if (!route.payload) return 'Record<string, unknown>';

    const model = resolveModel(route.payload);
    if (!model) return 'Record<string, unknown>';

    const name = payloadName(model.name);
    return route.partial ? `Partial<${name}>` : name;
  }

  return {
    spec,
    routes,
    skipped,
    tableByName,
    modelByName,
    resolveModel,
    groupOf,
    tableOf,
    operationName,
    responseType,
    bodyType,
    payloadName,
  };
}
