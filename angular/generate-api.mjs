#!/usr/bin/env node
/**
 * generate-api.mjs — turns api-spec.json into src/app/api.
 *
 *   php ../php/generate-api-spec.php     # read the backend
 *   node generate-api.mjs                # write the client
 *
 * The output is shaped the way openapi-generator shapes a client: interfaces
 * for what crosses the wire, and one injectable service per resource with one
 * method per endpoint. Components ask a service; nothing outside src/app/api
 * touches HttpClient.
 *
 * Two interfaces come out of each table, because the API has two shapes for
 * every resource and conflating them is how `id` ends up optional everywhere:
 *
 *   Character         a row as it is read - id, created_at, created_by, and
 *                     every column the schema declares
 *   CharacterPayload  a body as it is written - exactly the fields the PHP
 *                     model's constructor takes, which is exactly what
 *                     validateBody() will accept
 *
 * What the generator cannot know is written by hand in src/app/api/types and
 * imported here by name: the composite `/full` bodies, the paged listings, and
 * the handful of endpoints that answer with something no table describes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(HERE, 'api-spec.json');
const OUT = path.join(HERE, 'src/app/api');

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
const GROUPS = [
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
const GROUP_DOCS = {
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
const RESPONSES = {
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
const BODIES = {
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
const QUERIES = {
  'GET /api/users': 'UserQuery?',
  'GET /api/languages': 'LanguageQuery?',
  'GET /api/feedback': 'FeedbackQuery?',
  'GET /api/audit-logs': 'AuditLogQuery',
  'GET /api/files': 'AssetFileQuery',
  'GET /api/migrations/file': 'MigrationFileQuery',
  'DELETE /api/files': 'AssetFileRef',
};

/** Method names the mechanical rules get wrong, or that would collide. */
const NAMES = {
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
const SKIP_PREFIXES = ['/api/affiliations', '/api/characters-affiliations'];

/**
 * Endpoints that answer with a file rather than JSON.
 * These are typed as a Blob and asked for with responseType: 'blob'.
 */
const BLOBS = new Set(['GET /api/backups/{id}/download/{alias}']);

/** Plurals the rules below would get wrong. */
const IRREGULAR_SINGULAR = { quizzes: 'quiz', statuses: 'status' };
const IRREGULAR_PLURAL = { Quiz: 'Quizzes' };
const UNCOUNTABLE = new Set(['feedback', 'progress', 'stats', 'status', 'data']);

// ─────────────────────────────────────────────────────────────────────────────
// Words
// ─────────────────────────────────────────────────────────────────────────────

const singular = (word) => {
  const lower = word.toLowerCase();
  if (IRREGULAR_SINGULAR[lower]) return IRREGULAR_SINGULAR[lower];
  if (UNCOUNTABLE.has(lower) || !word.endsWith('s') || word.endsWith('ss')) return word;
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (/(ch|sh|x|z|s)es$/.test(word)) return word.slice(0, -2);
  return word.slice(0, -1);
};

const plural = (word) => {
  if (IRREGULAR_PLURAL[word]) return IRREGULAR_PLURAL[word];
  if (UNCOUNTABLE.has(word.toLowerCase())) return word;
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
  if (/(ch|sh|x|z|s)$/.test(word)) return word + 'es';
  return word + 's';
};

const pascal = (text) =>
  text
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

const camel = (text) => {
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
function sqlToTs(column) {
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
function phpToTs(field, isJsonField) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Read the spec
// ─────────────────────────────────────────────────────────────────────────────

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));

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

/** The table a route answers from, when the schema knows it. */
const tableOf = (route) => (route.tables.length ? tableByName.get(route.tables[0]) : undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Name every operation
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Emit
// ─────────────────────────────────────────────────────────────────────────────

const HEADER = (source) =>
  [
    '// Generated by angular/generate-api.mjs - do not edit.',
    `// Source: ${source}`,
    '// Regenerate: php ../php/generate-api-spec.php && node generate-api.mjs',
    '',
  ].join('\n');

/** Interfaces belong to the service that uses them most. */
const groupOfTable = new Map();
for (const route of routes) {
  const table = tableOf(route);
  if (table && !groupOfTable.has(table.table)) groupOfTable.set(table.table, groupOf(route));
}

/**
 * A payload model follows whichever table's routes validate against it.
 *
 * The name in the source is whatever that file imported it as - `Role::class`
 * under `use GenshinImpact\Role`, but `User\Language::class` written out - so
 * it is resolved back to the declared class before being grouped.
 */
const resolveModel = (name) => modelByName.get(name) ?? modelByShortName.get(name.split('\\').pop());

const groupOfModel = new Map();
for (const route of routes) {
  const model = route.payload && resolveModel(route.payload);
  if (model && !groupOfModel.has(model.name)) groupOfModel.set(model.name, groupOf(route));
}

const payloadName = (className) => `${pascal(className.split('\\').pop())}Payload`;

function emitRowInterface(table) {
  const lines = [];
  lines.push('/**');
  lines.push(` * A row of \`${table.table}\` as the API reads it back.`);
  lines.push(' */');
  lines.push(`export interface ${table.interface} {`);

  for (const column of table.columns) {
    const type = sqlToTs(column);
    if (/^(JSON|JSONB)/i.test(column.sqlType)) {
      lines.push(`  /** Raw JSON - PDO hands \`${column.sqlType}\` back as a string, undecoded. */`);
    }
    lines.push(`  ${column.name}: ${column.nullable ? `${type} | null` : type};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function emitPayloadInterface(model) {
  const jsonFields = new Set(model.jsonFields);
  const lines = [];
  lines.push('/**');
  lines.push(` * A body \`${model.name}\` accepts, as validateBody() checks it.`);
  lines.push(' *');
  lines.push(' * Optional here means what validateBody() means by it: a field is required');
  lines.push(' * only when the model neither allows null nor supplies a default. Every');
  lines.push(' * field is optional on an update, which is sent partial.');
  lines.push(' */');
  lines.push(`export interface ${payloadName(model.name)} {`);

  for (const field of model.fields) {
    if (jsonFields.has(field.name)) {
      lines.push(`  /** JSON: send the value; it reads back as a JSON string. See parseJsonColumn. */`);
    }
    // validateBody() calls a field required only when it neither allows null
    // nor has a default, so a nullable column may simply be left out.
    const optional = field.optional || field.nullable;
    lines.push(`  ${field.name}${optional ? '?' : ''}: ${phpToTs(field, jsonFields.has(field.name))};`);
  }

  lines.push('}');
  return lines.join('\n');
}

// ── models/<group>.model.ts ───────────────────────────────────────────────────

const modelFiles = new Map();
const exportedTypes = new Map();

const addTo = (group, text) => {
  if (!modelFiles.has(group)) modelFiles.set(group, []);
  modelFiles.get(group).push(text);
};

for (const table of spec.tables) {
  const group = groupOfTable.get(table.table);
  if (!group || !table.interface) continue;
  addTo(group, emitRowInterface(table));
  exportedTypes.set(table.interface, group);
}

for (const model of spec.models) {
  const group = groupOfModel.get(model.name);
  if (!group) continue;
  const name = payloadName(model.name);
  if (exportedTypes.has(name)) continue;
  addTo(group, emitPayloadInterface(model));
  exportedTypes.set(name, group);
}

fs.mkdirSync(path.join(OUT, 'models'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'services'), { recursive: true });

for (const [group, blocks] of modelFiles) {
  const body = [HEADER('php/generate-api-spec.php'), blocks.join('\n\n'), ''].join('\n');
  fs.writeFileSync(path.join(OUT, 'models', `${group}.model.ts`), body.replace(/\n/g, '\r\n'));
}

const modelIndex = [
  HEADER('php/generate-api-spec.php'),
  [...modelFiles.keys()]
    .sort()
    .map((group) => `export * from './${group}.model';`)
    .join('\n'),
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'models', 'index.ts'), modelIndex.replace(/\n/g, '\r\n'));

// ── services/<group>.service.ts ───────────────────────────────────────────────

/** One import, broken over several lines once it would run long. */
function importLine(names, from) {
  const single = `import { ${names.join(', ')} } from '${from}';`;
  if (single.length <= 120) return single;
  const wrapped = names.map((name) => `  ${name},`).join('\n');
  return `import {\n${wrapped}\n} from '${from}';`;
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
const argType = (arg) => {
  if (arg.constraint) {
    return /^\[0-9\]\+$/.test(arg.constraint) ? 'number' : 'string';
  }
  return /(^|_)id$/.test(arg.name) ? 'number' : 'string';
};

/**
 * The URL as a template literal, with `${id}` where the pattern had `{id}`.
 *
 * Anything but a numeric id is encoded on the way in. Several of these are
 * keyed by a name rather than a number, and the names are real text: a
 * character role is `Healer / Support`, and dropping that into a path unencoded
 * makes it two segments and a 404.
 */
const urlLiteral = (route) => {
  const byName = new Map(route.args.map((arg) => [arg.name, arg]));
  const url = route.path.replace(/\{(\w+)\}/g, (_, name) => {
    const value = camel(name);
    return '${' + (argType(byName.get(name)) === 'number' ? value : `encodeURIComponent(${value})`) + '}';
  });
  return url.includes('${') ? `\`${url}\`` : `'${route.path}'`;
};

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

const serviceFiles = new Map();
for (const route of routes) {
  const group = groupOf(route);
  if (!serviceFiles.has(group)) serviceFiles.set(group, []);
  serviceFiles.get(group).push(route);
}

const usedNames = new Map();
for (const [group, groupRoutes] of serviceFiles) {
  for (const route of groupRoutes) {
    const name = operationName(route);
    const key = `${group}.${name}`;
    if (!usedNames.has(key)) usedNames.set(key, []);
    usedNames.get(key).push(`${route.method} ${route.path}`);
  }
}

const collisions = [...usedNames].filter(([, paths]) => paths.length > 1);

function emitMethod(route) {
  const key = `${route.method} ${route.path}`;
  const name = operationName(route);
  const response = responseType(route);
  const body = bodyType(route);
  const query = QUERIES[key];

  const optionalQuery = query?.endsWith('?');
  const queryType = optionalQuery ? query.slice(0, -1) : query;

  const params = route.args.map((arg) => `${camel(arg.name)}: ${argType(arg)}`);
  if (body) params.push(`body: ${body}`);
  if (queryType) params.push(`params${optionalQuery ? '?' : ''}: ${queryType}`);
  else if (route.method === 'GET' && !route.args.length && !RESPONSES[key]) {
    // nothing: a plain collection read
  }

  const lines = [];
  lines.push('  /**');
  lines.push(`   * \`${route.method} ${route.path}\``);
  if (route.roles.length) {
    lines.push(`   *`);
    lines.push(`   * Requires the ${route.roles.map((role) => `\`${role}\``).join(' or ')} role.`);
  } else if (route.auth) {
    lines.push(`   *`);
    lines.push(`   * Requires a signed-in user.`);
  }
  lines.push('   */');

  const options = [];
  if (query) options.push('params: toHttpParams(params)');
  if (BLOBS.has(key)) options.push("responseType: 'blob' as 'json'");
  const optionsArg = options.length ? `, { ${options.join(', ')} }` : '';

  const url = urlLiteral(route);
  const verb = route.method.toLowerCase();
  const call =
    route.method === 'GET' || route.method === 'DELETE'
      ? `this._http.${verb}<${response}>(${url}${optionsArg})`
      : `this._http.${verb}<${response}>(${url}, body${optionsArg})`;

  lines.push(`  ${name}(${params.join(', ')}): Observable<${response}> {`);
  lines.push(`    return ${call};`);
  lines.push('  }');

  return lines.join('\n');
}

for (const [group, groupRoutes] of serviceFiles) {
  const sorted = [...groupRoutes].sort((a, b) => operationName(a).localeCompare(operationName(b)));

  const needed = new Set();
  for (const route of sorted) {
    for (const type of [responseType(route), bodyType(route), QUERIES[`${route.method} ${route.path}`]?.replace(/\?$/, '')]) {
      if (!type) continue;
      for (const word of type.match(/[A-Z][A-Za-z0-9]*/g) ?? []) needed.add(word);
    }
  }
  needed.delete('FormData');
  needed.delete('Partial');
  needed.delete('Record');
  needed.delete('Blob');

  const fromModels = [...needed].filter((type) => exportedTypes.has(type)).sort();
  const fromTypes = [...needed].filter((type) => !exportedTypes.has(type)).sort();

  const imports = [
    "import { Injectable, inject } from '@angular/core';",
    "import { HttpClient } from '@angular/common/http';",
    "import { Observable } from 'rxjs';",
  ];
  if (fromModels.length) imports.push(importLine(fromModels, '../models'));
  if (fromTypes.length) imports.push(importLine(fromTypes, '../types'));
  if (sorted.some((route) => QUERIES[`${route.method} ${route.path}`])) {
    imports.push("import { toHttpParams } from '../http-params';");
  }

  const className = `${pascal(group)}ApiService`;
  const body = [
    HEADER('php/generate-api-spec.php'),
    imports.join('\n'),
    '',
    '/**',
    ` * ${GROUP_DOCS[group] ?? `The \`${group}\` endpoints.`}`,
    ' */',
    "@Injectable({ providedIn: 'root' })",
    `export class ${className} {`,
    '  private readonly _http = inject(HttpClient);',
    '',
    sorted.map(emitMethod).join('\n\n'),
    '}',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT, 'services', `${group}.service.ts`), body.replace(/\n/g, '\r\n'));
}

const serviceIndex = [
  HEADER('php/generate-api-spec.php'),
  [...serviceFiles.keys()]
    .sort()
    .map((group) => `export * from './${group}.service';`)
    .join('\n'),
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'services', 'index.ts'), serviceIndex.replace(/\n/g, '\r\n'));

// ── index.ts ──────────────────────────────────────────────────────────────────

const barrel = [
  HEADER('php/generate-api-spec.php'),
  "export * from './models';",
  "export * from './services';",
  "export * from './types';",
  "export * from './http-params';",
  "export * from './json-columns';",
  "export * from './form-data';",
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'index.ts'), barrel.replace(/\n/g, '\r\n'));

// ── Report ────────────────────────────────────────────────────────────────────

const methodCount = routes.length;
console.log(`src/app/api`);
console.log(`  ${modelFiles.size} model files, ${exportedTypes.size} interfaces`);
console.log(`  ${serviceFiles.size} services, ${methodCount} methods`);
if (skipped) console.log(`  ${skipped} routes skipped (see SKIP_PREFIXES)`);

if (collisions.length) {
  console.log('\nname collisions - add an entry to NAMES:');
  for (const [key, paths] of collisions) console.log(`  ${key}\n    ${paths.join('\n    ')}`);
  process.exitCode = 1;
}

const untyped = routes.filter((route) => responseType(route) === 'unknown');
if (untyped.length) {
  console.log(`\n${untyped.length} endpoints answer with an unknown shape - add an entry to RESPONSES:`);
  for (const route of untyped) console.log(`  ${route.method} ${route.path}`);
}
