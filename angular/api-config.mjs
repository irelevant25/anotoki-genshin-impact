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
 * Nothing here emits anything, and nothing here describes a response any more:
 * every route says that for itself, in `->add(responds(...))` beside its own
 * handler. Add a route to the backend and the only thing worth checking here is
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
    ["auth", ["/api/auth/"]],
    ["user", ["/api/users"]],
    ["language", ["/api/languages"]],
    ["translation", ["/api/translations", "/api/translation-keys", "/api/admin/translations"]],
    ["backup", ["/api/backups"]],
    ["character", ["/api/characters", "/api/character/"]],
    ["weapon", ["/api/weapons"]],
    ["artifact", ["/api/artifacts"]],
    ["material", ["/api/materials"]],
    ["food", ["/api/foods"]],
    ["enemy", ["/api/enemies"]],
    ["banner", ["/api/banners"]],
    ["quiz", ["/api/quizzes", "/api/quiz-", "/api/quiz/", "/api/user-quiz-history"]],
    ["background", ["/api/backgrounds"]],
    ["stat", ["/api/stats"]],
    ["feedback", ["/api/feedback"]],
    ["fileCategory", ["/api/file-categories"]],
    ["file", ["/api/files", "/api/upload"]],
    ["audit-log", ["/api/audit-logs"]],
    ["migration", ["/api/migrations"]],
    ["session", ["/api/sessions"]],
    ["setting", ["/api/settings"]],
    ["route", ["/api/routes"]],
    ["dashboard", ["/api/dashboard"]],
    ["lookup", ["/api/"]],
];

/** One line under each service class, saying what it covers. */
export const GROUP_DOCS = {
    auth: "Registering, signing in, and the settings that hang off the signed-in account.",
    user: "The user list behind the admin site. Everything here needs a role.",
    language: "Which languages the site offers, and which of them is the fallback.",
    translation: "Translation keys and their strings, per language.",
    backup: "Database dumps: listing them, making them, and restoring one.",
    character: "Characters and everything hanging off one - talents, ascensions, constellations, builds.",
    weapon: "Weapons, their refinements and their ascension costs.",
    artifact: "Artifact sets and the pieces in them.",
    material: "Materials, the groups they belong to, and where each one is spent.",
    food: "Dishes and their recipes.",
    enemy: "Enemies, their phases, their drops and their elemental behaviour.",
    banner: "Wish banners and the characters and weapons on them.",
    quiz: "The quizzes, a player's progress through them, and the history behind the stats.",
    background: "Site backgrounds a visitor can pick between.",
    stat: "The stat names the rest of the data refers to.",
    feedback: "Messages sent from the site's contact form.",
    file: "The asset tree on disk: browsing it, adding to it, and undoing a deletion.",
    fileCategory: "The kinds of asset there are, and which folder each kind lives in.",
    "audit-log": "Who changed which row, and to what.",
    migration: "Which migrations have run against which database.",
    session: "Every session anybody has had here: who signed in, from where, and which are still live.",
    setting: "The switches an admin can throw without a deploy - maintenance, sign-in, the announcement bar.",
    route: "Which pages of the site exist, who they are drawn for, and which API paths go dark with them.",
    dashboard: "The counts on the admin landing page.",
    lookup: "The name-keyed lookup tables. Every one is a list of `{ name }`, read to fill a dropdown.",
};

/**
 * The one endpoint whose response has no shape to name.
 *
 * Everything else says what it answers with beside its own handler, in
 * `->add(responds(...))`. The translation export is a bare key-to-string map,
 * and a PHP constructor has no way to describe an index signature, so it stays
 * declared here. (The backup download is bytes rather than a shape; that is
 * BLOBS, further down.)
 */
export const RESPONSES = {
    "GET /api/translations/{code}/export": "TranslationBundle",
};

/**
 * Request bodies the PHP models do not describe, and the hand-written type
 * that does. A `FormData` entry means the endpoint takes multipart, not JSON.
 */
export const BODIES = {
    "POST /api/auth/register": "RegisterRequest",
    "POST /api/auth/confirm": "ConfirmEmailRequest",
    "POST /api/auth/confirm/resend": "EmailRequest",
    "POST /api/auth/password/forgot": "EmailRequest",
    "POST /api/auth/password/reset": "PasswordResetRequest",
    "POST /api/auth/google": "GoogleCredentialRequest",
    "POST /api/auth/google/link": "GoogleCredentialRequest",
    "POST /api/auth/login/code": "EmailRequest",
    "POST /api/auth/login/code/verify": "LoginCodeRequest",
    "POST /api/auth/password/set": "SetOwnPasswordRequest",
    "PUT /api/auth/password/enabled": "EnabledRequest",
    "POST /api/auth/2fa/enable": "TotpCodeRequest",
    "POST /api/auth/2fa/disable": "TotpCodeRequest",
    "POST /api/auth/2fa/recovery": "TotpCodeRequest",
    "POST /api/auth/login": "LoginRequest",
    "PUT /api/auth/theme": "ThemeRequest",
    "PUT /api/auth/language": "LanguageRequest",
    "PUT /api/auth/formats": "DateFormatsRequest",
    "PUT /api/auth/password": "ChangePasswordRequest",
    "POST /api/users": "UserCreateRequest",
    "PUT /api/users/{id}": "UserUpdateRequest",
    "PUT /api/users/{id}/password": "SetPasswordRequest",
    "PUT /api/users/{id}/enabled": "EnabledRequest",
    "PUT /api/settings": "SiteSettingsSaveRequest",
    "PUT /api/routes": "SiteRoutesSaveRequest",
    "POST /api/routes": "SiteRouteCreateRequest",
    "PUT /api/admin/translations": "TranslationSaveRequest",
    "PUT /api/translations/{code}/import": "TranslationImportRequest",
    "PUT /api/feedback/{id}/status": "FeedbackStatusRequest",
    "POST /api/feedback": "FeedbackRequest",
    "POST /api/backups": "BackupRequest",
    "POST /api/backups/{id}/restore/{alias}": "RestoreRequest",
    "PUT /api/quiz/progress/{quiz}": "QuizProgressRequest",
    "POST /api/quiz/result": "QuizResultRequest",
    "POST /api/files": "FormData",
    "POST /api/files/convert": "AssetConvertRequest",
    "POST /api/files/cleanup": "AssetCleanupRequest",
    "POST /api/file-categories": "FileCategoryCreateRequest",
    "PUT /api/file-categories/{id}": "FileCategorySaveRequest",
    "PUT /api/files/{id}/category": "FileCategoryMoveRequest",
    "POST /api/files/restore": "FormData",
    "POST /api/upload": "FormData",
    "POST /api/uploads/{entity}/{field}": "FormData",
    "POST /api/uploads/{entity}/{id}/{field}": "FormData",
    "POST /api/characters/full": "FormData",
    "PUT /api/characters/{id}/full": "FormData",
};

for (const entity of ["weapons", "artifacts", "materials", "foods", "enemies", "banners"]) {
    BODIES[`POST /api/${entity}/full`] = "FormData";
    BODIES[`PUT /api/${entity}/{id}/full`] = "FormData";
}

/**
 * Typed query strings, for the endpoints that read more than a stray flag.
 *
 * A `?` on the end means every field is optional, and so is the argument.
 */
export const QUERIES = {
    "GET /api/users": "UserQuery?",
    "GET /api/sessions": "SessionHistoryQuery?",
    "GET /api/languages": "LanguageQuery?",
    "GET /api/feedback": "FeedbackQuery?",
    "GET /api/audit-logs": "AuditLogQuery",
    "GET /api/files": "AssetFileQuery",
    "GET /api/files/stats": "AssetStatsQuery?",
    "GET /api/files/cleanup": "AssetCleanupQuery",
    "GET /api/migrations/file": "MigrationFileQuery",
    "DELETE /api/files": "AssetFileRef",
    "DELETE /api/files/missing": "MissingFileRef?",
    "DELETE /api/files/trash": "TrashedFileRef?",
};

/** Method names the mechanical rules get wrong, or that would collide. */
export const NAMES = {
    "GET /api/character/random": "getRandomCharacter",
    "GET /api/quiz/voice-over/random": "getRandomVoiceOverRound",
    "GET /api/feedback": "getFeedbackPage",
    "POST /api/feedback": "sendFeedback",
    "GET /api/feedback/filters": "getFeedbackFilters",
    "GET /api/feedback/{id}": "getFeedbackEntry",
    "DELETE /api/feedback/{id}": "deleteFeedbackEntry",
    "GET /api/files": "getAssetFiles",
    "GET /api/files/folders": "getAssetFolders",
    "GET /api/files/trash": "getTrashedFiles",
    "GET /api/files/stats": "getAssetStats",
    "POST /api/files/convert": "convertAssets",
    "GET /api/files/convert": "getConversionProgress",
    "GET /api/files/cleanup": "getCleanupCandidates",
    "POST /api/files/cleanup": "cleanUpOriginals",
    "POST /api/files/reconcile": "reconcileCatalogue",
    "GET /api/file-categories": "getFileCategories",
    "POST /api/file-categories": "addFileCategory",
    "PUT /api/file-categories/{id}": "saveFileCategory",
    "DELETE /api/file-categories/{id}": "retireFileCategory",
    "PUT /api/files/{id}/category": "moveFileToCategory",
    "GET /api/files/cleanup/progress": "getCleanupProgress",
    "POST /api/files": "uploadAssetFile",
    "DELETE /api/files": "deleteAssetFile",
    "POST /api/files/restore": "restoreAssetFile",
    "POST /api/upload": "uploadFile",
    "POST /api/uploads/{entity}/{field}": "uploadEntityFile",
    "POST /api/uploads/{entity}/{id}/{field}": "uploadRecordFile",
    "GET /api/migrations/file": "getMigrationFile",
    "GET /api/dashboard/stats": "getDashboardStats",
    "GET /api/admin/translations": "getAdminTranslations",
    "PUT /api/admin/translations": "saveAdminTranslations",
    "POST /api/auth/login": "login",
    "POST /api/auth/logout": "logout",
    "POST /api/auth/register": "register",
    "GET /api/auth/me": "getCurrentUser",
    "POST /api/auth/confirm": "confirmEmail",
    "POST /api/auth/confirm/resend": "resendConfirmation",
    "POST /api/auth/password/forgot": "requestPasswordReset",
    "POST /api/auth/password/reset": "resetPassword",
    "GET /api/auth/providers": "getAuthProviders",
    "POST /api/auth/google": "signInWithGoogle",
    "POST /api/auth/google/link": "connectGoogle",
    "DELETE /api/auth/google/link": "disconnectGoogle",
    "POST /api/auth/login/code": "requestLoginCode",
    "POST /api/auth/login/code/verify": "signInWithCode",
    "POST /api/auth/password/set": "setOwnPassword",
    "PUT /api/auth/password/enabled": "setPasswordLoginEnabled",
    "POST /api/auth/2fa/setup": "startTwoFactorSetup",
    "POST /api/auth/2fa/enable": "enableTwoFactor",
    "POST /api/auth/2fa/disable": "disableTwoFactor",
    "POST /api/auth/2fa/recovery": "regenerateRecoveryCodes",
    "GET /api/auth/sessions": "getSessions",
    "DELETE /api/auth/sessions": "endOtherSessions",
    "DELETE /api/auth/sessions/{id}": "endSession",
    "PUT /api/auth/theme": "setTheme",
    "PUT /api/auth/language": "setLanguage",
    "PUT /api/auth/formats": "setDateFormats",
    "DELETE /api/auth/devices": "forgetTrustedDevices",
    "PUT /api/auth/password": "changePassword",
    "PUT /api/users/{id}/password": "setUserPassword",
    "PUT /api/users/{id}/enabled": "setUserEnabled",
    "GET /api/users/filters": "getUserFilters",
    "GET /api/users": "getUsers",
    "GET /api/users/{id}/detail": "getUserDetail",
    // `endSession` is the account's own; this one is any session, anybody's.
    "GET /api/sessions": "getSessionHistory",
    "DELETE /api/sessions/{id}": "endUserSession",
    "GET /api/settings/public": "getPublicSettings",
    "GET /api/settings": "getSettings",
    "PUT /api/settings": "saveSettings",
    "GET /api/routes": "getRoutes",
    "PUT /api/routes": "saveRoutes",
    "POST /api/routes": "addRoute",
    "DELETE /api/routes/{id}": "deleteRoute",
    "GET /api/audit-logs": "getAuditLogPage",
    "GET /api/audit-logs/filters": "getAuditLogFilters",

    "GET /api/quizzes": "getQuizzes",
    "GET /api/quiz/progress": "getQuizProgress",
    "PUT /api/quiz/progress/{quiz}": "updateQuizProgress",
    "DELETE /api/quiz/progress/{quiz}": "deleteQuizProgress",
    "POST /api/quiz/result": "submitQuizResult",
    "GET /api/quiz/stats": "getQuizStats",
    "GET /api/quiz/stats/difficulty": "getQuizStatsByDifficulty",
    "GET /api/quiz/activity": "getQuizActivity",
    "GET /api/quiz/results": "getRecentQuizResults",

    "GET /api/translations/{code}": "getTranslations",
    "GET /api/translations/{code}/export": "exportTranslations",
    "PUT /api/translations/{code}/import": "importTranslations",

    "GET /api/backups/status": "getBackupStatus",
    "GET /api/backups/{id}/download/{alias}": "downloadBackup",
    "GET /api/backups/{id}/preview/{alias}": "previewBackup",
    "POST /api/backups/{id}/restore/{alias}": "restoreBackup",
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
export const SKIP_PREFIXES = ["/api/affiliations", "/api/characters-affiliations"];

/**
 * Endpoints that answer with a file rather than JSON.
 * These are typed as a Blob and asked for with responseType: 'blob'.
 */
export const BLOBS = new Set(["GET /api/backups/{id}/download/{alias}"]);

/** Plurals the rules below would get wrong. */
export const IRREGULAR_SINGULAR = { quizzes: "quiz", statuses: "status" };
export const IRREGULAR_PLURAL = { Quiz: "Quizzes" };
export const UNCOUNTABLE = new Set(["feedback", "progress", "stats", "status", "data"]);

// ─────────────────────────────────────────────────────────────────────────────
// Words
// ─────────────────────────────────────────────────────────────────────────────

export const singular = (word) => {
    const lower = word.toLowerCase();
    if (IRREGULAR_SINGULAR[lower]) return IRREGULAR_SINGULAR[lower];
    if (UNCOUNTABLE.has(lower) || !word.endsWith("s") || word.endsWith("ss")) return word;
    if (word.endsWith("ies")) return word.slice(0, -3) + "y";
    if (/(ch|sh|x|z|s)es$/.test(word)) return word.slice(0, -2);
    return word.slice(0, -1);
};

export const plural = (word) => {
    if (IRREGULAR_PLURAL[word]) return IRREGULAR_PLURAL[word];
    if (UNCOUNTABLE.has(word.toLowerCase())) return word;
    if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + "ies";
    if (/(ch|sh|x|z|s)$/.test(word)) return word + "es";
    return word + "s";
};

export const pascal = (text) =>
    text
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("");

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
        return column.enum.map((value) => `'${value.replace(/'/g, "\\'")}'`).join(" | ");
    }

    const type = column.sqlType.toUpperCase();
    if (/^(SERIAL|BIGSERIAL|SMALLSERIAL|INT|INTEGER|SMALLINT|BIGINT|NUMERIC|DECIMAL|REAL|DOUBLE)/.test(type)) {
        return "number";
    }
    if (/^BOOL/.test(type)) return "boolean";
    if (/^(JSON|JSONB)/.test(type)) return "string";
    return "string";
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
        if (type === "int" || type === "float") parts.add("number");
        else if (type === "bool") parts.add("boolean");
        else if (type === "string") parts.add("string");
        else if (type === "array") parts.add("string[]");
        else parts.add("unknown");
    }

    // A JSON column travels as the value on the way in and as a raw JSON string
    // on the way out - PDO does not decode JSONB - so both are in the type, and
    // anything reading one runs it through parseJsonColumn first.
    if (isJsonField) {
        parts.add("string");
    }

    const list = [...parts];
    return field.nullable ? [...list, "null"].join(" | ") : list.join(" | ");
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
        return /^\[0-9\]\+$/.test(arg.constraint) ? "number" : "string";
    }
    return /(^|_)id$/.test(arg.name) ? "number" : "string";
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
    const modelByShortName = new Map(spec.models.map((model) => [model.name.split("\\").pop(), model]));

    const routes = spec.routes.filter((route) => !SKIP_PREFIXES.some((prefix) => route.path.startsWith(prefix)));
    const skipped = spec.routes.length - routes.length;

    /** The service a route belongs to. */
    function groupOf(route) {
        for (const [name, prefixes] of GROUPS) {
            if (prefixes.some((prefix) => route.path.startsWith(prefix))) return name;
        }
        return "lookup";
    }

    /**
     * The model a route's `validateRequest` names, whatever that file imported
     * it as - `Role::class` under `use GenshinImpact\\Role`, but
     * `User\\Language::class` written out.
     */
    const resolveModel = (name) => modelByName.get(name) ?? modelByShortName.get(name.split("\\").pop());

    const payloadName = (className) => `${pascal(className.split("\\").pop())}Payload`;

    const shapeByName = new Map(spec.shapes.map((shape) => [shape.name, shape]));

    const SCALARS = { string: "string", int: "number", float: "number", bool: "boolean", mixed: "unknown" };

    /**
     * One name out of a `@var` or `@merges` docblock, as TypeScript.
     *
     * Resolved the way response.php says: a response shape, then a model, then a
     * table. A model becomes the payload rather than the row, because the place a
     * model appears in a response is inside a `/full` body - and there it is the
     * thing being edited, with the id and the parent link filled in on save.
     */
    function namedType(name) {
        if (SCALARS[name]) return SCALARS[name];
        if (shapeByName.has(name)) return name;

        const model = resolveModel(name);
        if (model) return `Saved<${payloadName(model.name)}>`;

        const table = tableByName.get(name);
        if (table?.interface) return table.interface;

        return "unknown";
    }

    /** A whole `@var` expression: `Foo[]`, `array<string, int>`, `Foo[]|null`. */
    function docType(of) {
        const map = of.match(/^array<\s*([\w\\]+)\s*,\s*([\w\\]+)\s*>$/);
        if (map) return `Record<${namedType(map[1])}, ${namedType(map[2])}>`;

        // `|null` is already carried by the PHP type being nullable.
        const base = of.replace(/\|null$/, "");
        return base.endsWith("[]") ? `${namedType(base.slice(0, -2))}[]` : namedType(base);
    }

    /** The table a route answers from, when the schema knows it. */
    const tableOf = (route) => (route.tables.length ? tableByName.get(route.tables[0]) : undefined);

    const VERBS = { GET: "get", POST: "create", PUT: "update", DELETE: "delete" };

    function operationName(route) {
        const key = `${route.method} ${route.path}`;
        if (NAMES[key]) return NAMES[key];

        const segments = route.path.replace(/^\/api\//, "").split("/");
        const statics = segments.filter((segment) => !segment.startsWith("{"));
        const hasArgs = route.args.length > 0;
        const table = tableOf(route);

        // The noun comes from the row interface where there is one, so a method and
        // the type it returns are spelled the same way: getCharacterBuildTeamCharacters
        // alongside CharacterBuildTeamCharacter, rather than the URL's flattened
        // charactersBuildsTeamsCharacters.
        const base = table?.interface ?? pascal(singular(statics[0]));
        const noun = hasArgs || route.method === "POST" ? base : plural(base);
        const trailing = statics.slice(1).map(pascal).join("");

        return camel(`${VERBS[route.method]}-${noun}${trailing}`);
    }

    /**
     * The row a table answers with, with any expanded foreign keys applied.
     *
     * includeExternal() swaps a key for the row it points at, so `created_by` is
     * the user rather than their id wherever the handler asked for that.
     */
    function rowType(table, expanded) {
        if (!expanded.length) return table.interface;
        return `Expanded<${table.interface}, ${expanded.map((column) => `'${column}'`).join(" | ")}>`;
    }

    /**
     * What a route answers with.
     *
     * The route says so itself now - `->add(responds('characters', list: true))`
     * beside the handler - so this reads the declaration rather than guessing
     * from the DbQuery call inside the body. RESPONSES is what is left for the
     * two that have no shape to name: a file download, and the translation export,
     * which is a bare key-to-string map with no constructor that can describe it.
     */
    function responseType(route) {
        const key = `${route.method} ${route.path}`;
        if (BLOBS.has(key)) return "Blob";
        if (RESPONSES[key]) return RESPONSES[key];
        if (!route.responds) return "unknown";

        const table = tableByName.get(route.responds.shape);
        const one = table ? rowType(table, route.expanded) : route.responds.shape;

        return route.responds.list ? `${one}[]` : one;
    }

    function bodyType(route) {
        const key = `${route.method} ${route.path}`;
        if (BODIES[key]) return BODIES[key];
        if (!["POST", "PUT", "PATCH"].includes(route.method)) return null;
        if (!route.payload) return "Record<string, unknown>";

        const model = resolveModel(route.payload);
        if (!model) return "Record<string, unknown>";

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
        shapeByName,
        namedType,
        docType,
        rowType,
    };
}
