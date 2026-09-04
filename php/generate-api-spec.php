<?php

/**
 * Writes angular/api-spec.json: everything the frontend needs to talk to this
 * API, read out of the API itself rather than kept in step by hand.
 *
 *   php generate-api-spec.php [--out <path>]
 *
 * Three things go into the file.
 *
 * Routes come from Slim. index.php is loaded with ANOTOKI_ROUTES_ONLY defined,
 * which stops it serving a request, and the route collector is then asked what
 * it holds - so a route that exists is in the spec, and one that was never
 * registered is not. (That distinction is not academic here: the four quiz
 * endpoint files existed for months without being required, and nothing a quiz
 * sent could be saved.)
 *
 * Payload shapes come from the DbModel subclasses by reflection. A model's
 * constructor already states, per field, the PHP type, whether null is allowed
 * and whether a default exists - which is exactly what a request body may
 * contain, since validateBody() checks incoming bodies against those same
 * parameters.
 *
 * Row shapes come from the schema files. A model describes what may be written,
 * not what comes back: `Character` has no `id`, no `created_at`, no
 * `created_by`, because none of those are ever sent. The CREATE TABLE block has
 * all of them, along with the CHECK constraints that make a column an enum.
 *
 * Nothing here talks to a database; the schema files are read as text, so this
 * runs on a checkout with no local Postgres.
 */

$outIndex = array_search('--out', $argv, true);
$outPath = $outIndex !== false && isset($argv[$outIndex + 1])
    ? $argv[$outIndex + 1]
    : __DIR__ . '/../angular/api-spec.json';

define('ANOTOKI_ROUTES_ONLY', true);

$modelsBefore = get_declared_classes();
require __DIR__ . '/api/index.php';

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * Which endpoint file registered a route.
 *
 * The handler is a closure, and a closure remembers the file it was written in,
 * so the route points back at its own source. Routes put up by
 * registerFullResource() all share one closure in full_resource.php, so those
 * are attributed by their path instead - `/api/weapons/{id}/full` is weapons'
 * whichever file holds the generic machinery.
 */
function routeSourceFile(callable|string $callable, string $pattern): string
{
    $file = null;
    if ($callable instanceof Closure) {
        $file = (new ReflectionFunction($callable))->getFileName();
    }

    if ($file === null || basename($file) === 'full_resource.php') {
        // /api/weapons/{id}/full -> weapons_full.php
        if (preg_match('#^/api/([a-z0-9\-]+)#', $pattern, $m)) {
            return str_replace('-', '_', $m[1]) . '_full.php';
        }
        return 'full_resource.php';
    }

    return basename($file);
}

/**
 * Every status a handler's respondJson() calls name, 200 where one names none.
 *
 * The status is the call's last argument, and the one before it can be an array
 * spanning several lines with commas of its own, so the arguments are walked
 * with the brackets counted rather than matched with a pattern.
 */
function respondJsonStatuses(string $body): array
{
    $statuses = [];
    $offset = 0;

    while (($at = strpos($body, 'respondJson(', $offset)) !== false) {
        $depth = 0;
        $last = '';
        $i = $at + strlen('respondJson(') - 1;

        for ($length = strlen($body); $i < $length; $i++) {
            $char = $body[$i];
            if ($char === '(' || $char === '[') {
                $depth++;
            } elseif ($char === ')' || $char === ']') {
                if (--$depth === 0) {
                    break;
                }
            } elseif ($depth === 1 && $char === ',') {
                $last = '';
                continue;
            }
            if ($depth === 1) {
                $last .= $char;
            }
        }

        $statuses[] = ctype_digit(trim($last)) ? (int) trim($last) : 200;
        $offset = $at + 1;
    }

    return $statuses;
}

/** `/api/characters/{id:[0-9]+}/full` -> `/api/characters/{id}/full` plus the arg names. */
function splitPattern(string $pattern): array
{
    $args = [];
    $clean = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)(:[^{}]*(?:\{[^{}]*\}[^{}]*)*)?\}/', function ($m) use (&$args) {
        $args[] = ['name' => $m[1], 'constraint' => isset($m[2]) ? ltrim($m[2], ':') : null];
        return '{' . $m[1] . '}';
    }, $pattern);

    return [$clean, $args];
}

/**
 * What a handler says about itself, read out of its own source.
 *
 * A closure knows the lines it occupies, so the handler body and the `->add()`
 * chain that follows it can both be read back. Three things are worth having:
 *
 *   table    - `DbQuery::from($pdo, 'characters')` names the table the route
 *              answers from, and the schema turns a table into a row type.
 *   payload  - `->add(validateRequest(Character::class))` names the model an
 *              incoming body is checked against, which is the body's type.
 *   auth     - `->add(requireAuth())`, `->add(requireRole(...))`.
 */
function readHandler(callable|string $callable): array
{
    $blank = [
        'tables' => [],
        'success' => 200,
        'statuses' => [],
        'responds' => null,
        'source' => null,
        'expanded' => [],
        'payload' => null,
        'partial' => false,
        'auth' => false,
        'roles' => [],
    ];

    if (!($callable instanceof Closure)) {
        return $blank;
    }

    $reflection = new ReflectionFunction($callable);
    $file = $reflection->getFileName();
    if ($file === null || !is_readable($file)) {
        return $blank;
    }

    $lines = file($file);
    $body = implode('', array_slice($lines, $reflection->getStartLine() - 1, $reflection->getEndLine() - $reflection->getStartLine() + 1));

    // The middleware chain runs from the closing brace to the statement's `;`.
    // Where that ends is worth keeping: it is where a declaration goes.
    $chain = '';
    $chainEnd = null;
    for ($i = $reflection->getEndLine() - 1, $end = min(count($lines), $i + 12); $i < $end; $i++) {
        $chain .= $lines[$i];
        if (str_contains($lines[$i], ';')) {
            $chainEnd = $i + 1;
            break;
        }
    }

    $tables = [];
    if (preg_match_all("/DbQuery::(?:from|insert|update|delete)\(\s*[^,]+,\s*'(\w+)'/", $body, $m)) {
        $tables = array_values(array_unique($m[1]));
    }
    if (!$tables && preg_match_all('/\bFROM\s+(\w+)/i', $body, $m)) {
        $tables = array_values(array_unique($m[1]));
    }

    // Every status the handler can answer with. A handler answers several ways
    // - 404 where a row is missing, 422 where a body will not do - so the
    // success is the lowest 2xx among them, and the rest are the failures it
    // can actually produce, which is better than guessing at them later.
    $statuses = respondJsonStatuses($body);
    sort($statuses);
    $statuses = array_values(array_unique($statuses));

    $success = null;
    foreach ($statuses as $status) {
        if ($status < 300 && ($success === null || $status < $success)) {
            $success = $status;
        }
    }

    // includeExternal() swaps a foreign key for the row it points at, so a
    // response's `created_by` is `{id, username}` where the column is an int.
    $expanded = [];
    if (preg_match_all("/includeExternal\(\s*'(\w+)'/", $body, $m)) {
        $expanded = array_values(array_unique($m[1]));
    }

    // `->add(responds('characters', list: true))` - what the route answers with,
    // said by the route rather than inferred from the query inside it.
    $responds = null;
    if (preg_match('/responds\(\s*(?:\\\\?([\w\\\\]+)::class|\'([^\']*)\')\s*(?:,\s*list:\s*(true|false)\s*)?\)/', $chain, $m)) {
        $responds = [
            'shape' => ($m[1] ?? '') !== '' ? $m[1] : $m[2],
            'list' => ($m[3] ?? 'false') === 'true',
        ];
    }

    $payload = null;
    $partial = false;
    if (preg_match('/validateRequest\(\s*\\\\?([\w\\\\]+)::class\s*(?:,\s*(true|false))?/', $chain, $m)) {
        $payload = $m[1];
        $partial = ($m[2] ?? 'false') === 'true';
    }

    $roles = [];
    if (preg_match('/requireRole\(([^)]*)\)/', $chain, $m)) {
        preg_match_all("/'([A-Z_]+)'|\.\.\.(ROLES_[A-Z_]+)/", $m[1], $found, PREG_SET_ORDER);
        foreach ($found as $hit) {
            $named = $hit[2] ?? '';
            if ($named !== '' && defined($named)) {
                $roles = [...$roles, ...constant($named)];
            } elseif (($hit[1] ?? '') !== '') {
                $roles[] = $hit[1];
            }
        }
        $roles = array_values(array_unique($roles));
    }

    return [
        'tables' => $tables,
        'success' => $success ?? 200,
        'statuses' => $statuses,
        'responds' => $responds,
        'source' => $chainEnd === null ? null : ['file' => $file, 'line' => $chainEnd],
        'expanded' => $expanded,
        'payload' => $payload,
        'partial' => $partial,
        'auth' => str_contains($chain, 'requireAuth()') || $roles !== [],
        'roles' => $roles,
    ];
}

/**
 * What a route registered by registerFullResource() answers with.
 *
 * Those four share one closure between six resources, so there is no literal in
 * the source that means one of them. The registrar declares all four per
 * resource instead, and this turns that declaration into the same shape a
 * `->add(responds(...))` would have produced.
 */
function fullResourceResponds(string $method, string $pattern): ?array
{
    if (!preg_match('#^/api/([a-z0-9\-]+)/(?:\{id\}/)?full$#', $pattern, $m)) {
        return null;
    }

    $declared = fullResourceShapes()[$m[1]] ?? null;
    if ($declared === null) {
        return null;
    }

    $one = str_contains($pattern, '{id}');

    // A create or an update re-reads the parent alone before replying, as
    // whatever registerFullResource() was told that comes back as - the table
    // by default, or a resource's own Row shape where a plain table
    // introspection would miss a column this file resolves on the way out.
    if ($method === 'POST' || $method === 'PUT') {
        return ['shape' => $declared['table'], 'list' => false];
    }

    return $one
        ? ['shape' => $declared['full'], 'list' => false]
        : ['shape' => $declared['row'], 'list' => true];
}

$routes = [];
foreach ($app->getRouteCollector()->getRoutes() as $route) {
    [$pattern, $args] = splitPattern($route->getPattern());
    $handler = readHandler($route->getCallable());

    foreach ($route->getMethods() as $method) {
        if ($method === 'OPTIONS') {
            continue;
        }
        $routes[] = [
            'method' => $method,
            'path' => $pattern,
            'args' => $args,
            'file' => routeSourceFile($route->getCallable(), $pattern),
            ...$handler,
            'responds' => $handler['responds'] ?? fullResourceResponds($method, $pattern),
        ];
    }
}

usort($routes, fn($a, $b) => [$a['path'], $a['method']] <=> [$b['path'], $b['method']]);

// ── Payload shapes, from the model constructors ───────────────────────────────

/** A PHP parameter type as the JSON that crosses the wire. */
function phpTypeToJson(?ReflectionType $type): array
{
    if ($type === null) {
        return ['types' => ['mixed'], 'nullable' => true];
    }

    $names = [];
    $nullable = $type->allowsNull();

    foreach ($type instanceof ReflectionUnionType ? $type->getTypes() : [$type] as $part) {
        $name = $part instanceof ReflectionNamedType ? $part->getName() : 'mixed';
        if ($name !== 'null') {
            $names[] = $name;
        }
    }

    return ['types' => $names ?: ['mixed'], 'nullable' => $nullable];
}

$models = [];
foreach (array_diff(get_declared_classes(), $modelsBefore) as $class) {
    if (!is_subclass_of($class, DbModel::class)) {
        continue;
    }

    $reflection = new ReflectionClass($class);
    $constructor = $reflection->getConstructor();
    if ($constructor === null) {
        continue;
    }

    $fields = [];
    foreach ($constructor->getParameters() as $param) {
        $shape = phpTypeToJson($param->getType());
        $fields[] = [
            'name' => $param->getName(),
            'types' => $shape['types'],
            'nullable' => $shape['nullable'],
            // A default makes the field optional in a create body; every field
            // is optional in an update body, which is sent partial.
            'optional' => $param->isDefaultValueAvailable(),
        ];

        // `icon_file_id` is the column, but a reader is sent `icon` and
        // `icon_name` beside it and a form sends the whole row back, so the
        // model's shape carries all three. Only the id is ever written -
        // validateBody() lets the other two through and fromBody() drops them.
        foreach (assetAliasesFor($param->getName()) as $alias) {
            $fields[] = ['name' => $alias, 'types' => ['string'], 'nullable' => true, 'optional' => true];
        }
    }

    // jsonFields() is protected - it says which columns are JSON-encoded on the
    // way in, which is what makes `how_to_obtain` an array rather than a string.
    $jsonFields = $reflection->getMethod('jsonFields');
    $jsonFields->setAccessible(true);

    $models[$class] = [
        'name' => $class,
        'file' => basename($reflection->getFileName()),
        'fields' => $fields,
        'jsonFields' => $jsonFields->invoke(null),
    ];
}

ksort($models);

// ── Response shapes, from the ResponseShape subclasses ────────────────────────

/**
 * A docblock split into the `@var` type it names and the prose around it.
 *
 * PHP has no type for "array of what", so `@var Foo[]` is where that is said.
 * `@merges` is read the same way, off the class rather than a property.
 */
function parseDoc(string|false $doc): array
{
    if ($doc === false) {
        return ['var' => null, 'merges' => null, 'text' => null];
    }

    $body = preg_replace('#^\s*/\*\*|\*/\s*$#', '', $doc);

    $var = null;
    $extends = null;
    $text = [];

    foreach (explode("\n", $body) as $line) {
        $line = trim(ltrim(trim($line), '*'));

        // `@var Foo[] some prose` - the type, then anything after it. The type
        // can hold spaces of its own inside `array<string, int>`, so it is
        // matched rather than split on the first space.
        if (preg_match('/^@var\s+([\w\\\\]+(?:<[^>]*>)?(?:\[\])?(?:\|null)?)\s*(.*)$/', $line, $m)) {
            $var = $m[1];
            if (trim($m[2]) !== '') {
                $text[] = trim($m[2]);
            }
            continue;
        }
        if (preg_match('/^@merges\s+([\w\\\\]+)/', $line, $m)) {
            $extends = $m[1];
            continue;
        }
        if (str_starts_with($line, '@')) {
            continue;
        }
        $text[] = $line;
    }

    $text = trim(implode("\n", $text));

    return ['var' => $var, 'merges' => $extends, 'text' => $text === '' ? null : $text];
}

$shapes = [];
foreach (array_diff(get_declared_classes(), $modelsBefore) as $class) {
    if (!is_subclass_of($class, ResponseShape::class)) {
        continue;
    }

    $reflection = new ReflectionClass($class);
    $constructor = $reflection->getConstructor();
    if ($constructor === null) {
        continue;
    }

    // A promoted parameter keeps its docblock on the property it becomes, which
    // is the only place reflection will hand it back.
    $docs = [];
    foreach ($reflection->getProperties() as $property) {
        $docs[$property->getName()] = parseDoc($property->getDocComment());
    }

    $fields = [];
    foreach ($constructor->getParameters() as $param) {
        $type = phpTypeToJson($param->getType());
        $doc = $docs[$param->getName()] ?? ['var' => null, 'text' => null];

        $fields[] = [
            'name' => $param->getName(),
            'types' => $type['types'],
            'nullable' => $type['nullable'],
            'optional' => $param->isDefaultValueAvailable(),
            'of' => $doc['var'],
            'description' => $doc['text'],
        ];
    }

    $classDoc = parseDoc($reflection->getDocComment());

    $shapes[$class] = [
        'name' => $class,
        'file' => basename($reflection->getFileName()),
        'merges' => $classDoc['merges'],
        'description' => $classDoc['text'],
        'fields' => $fields,
    ];
}

ksort($shapes);

// ── Row shapes, from the schema files ─────────────────────────────────────────

/**
 * Pulls every CREATE TABLE out of a schema file.
 *
 * The interface name comes from the `-- name: Foo` line in the banner comment
 * above the table, which the schema already carries. A table with no such line
 * is still read; it just has no name of its own to be generated under.
 */
/**
 * Every table a database has, worked out by replaying its migrations.
 *
 * This used to read a schema file - one big CREATE TABLE listing per database,
 * kept beside the migrations folder that described the same thing as a series
 * of changes. Two descriptions of one database, and they drifted: the language
 * table had four columns in one and one column in the other, and a column on
 * both cost tables existed only in the schema file.
 *
 * So the migrations are the description now, and this replays them the way the
 * database does - in order, each one applied to what the ones before it left.
 * A CREATE TABLE starts a table, an ALTER changes it, and what is left at the
 * end is what a database built from this folder actually looks like.
 *
 * It handles the statements the migrations use, and no more: adding, dropping,
 * renaming and retyping a column, and the CHECK constraints that make a column
 * an enum in everything but name. Anything else is a change to a database that
 * this file does not describe, which is why parseMigrations() is checked
 * against a live database rather than trusted.
 */
function parseMigrations(string $directory, string $database): array
{
    $files = glob($directory . '/*.sql') ?: [];
    natsort($files);

    $tables = [];

    foreach ($files as $file) {
        $sql = (string) file_get_contents($file);

        foreach (parseSchema($sql, $database) as $name => $table) {
            // IF NOT EXISTS, so a re-creation is not a redefinition.
            $tables[$name] ??= $table;
        }

        applyAlters($sql, $tables);
    }

    addResolvedAssetColumns($tables);

    return $tables;
}

/**
 * Puts the asset columns back that the database no longer has.
 *
 * `characters.icon` and `characters.icon_name` are one `icon_file_id` in the
 * schema now, but a reader is still sent all three: resolveAssetRows() fills
 * the path and the name in from the catalogue on the way out, and the site
 * still resolves most of its art from that name. Replaying the migrations
 * cannot see any of that, so it is added here - against the same manifest the
 * runtime resolves against, so a column can never appear in one and not the
 * other.
 *
 * Read-only, and only on the way out: a write carries the id, which is the one
 * of the three that is a real column.
 */
function addResolvedAssetColumns(array &$tables): void
{
    foreach (assetColumnMap() as $table => $columns) {
        if (!isset($tables[$table])) {
            continue;
        }

        foreach ($columns as $field => $spec) {
            $resolved = [['name' => $field, 'sqlType' => 'TEXT', 'nullable' => true, 'enum' => null]];
            if ($spec['name']) {
                $resolved[] = ['name' => $field . '_name', 'sqlType' => 'TEXT', 'nullable' => true, 'enum' => null];
            }

            $at = columnIndex($tables[$table]['columns'], $field . '_file_id');
            if ($at === null) {
                continue;
            }

            array_splice($tables[$table]['columns'], $at + 1, 0, $resolved);
        }
    }
}

/**
 * Folds every ALTER TABLE in one migration into the tables built so far.
 *
 * Whitespace is flattened first: several of these are written across two or
 * three lines, and a pattern that has to allow for that everywhere is a
 * pattern nobody can read.
 */
function applyAlters(string $sql, array &$tables): void
{
    // Comments can contain the word ALTER, and several of them do.
    $sql = preg_replace('/--[^\n]*/', '', $sql);

    if (!preg_match_all('/ALTER\s+TABLE\s+"?(\w+)"?\s+(.*?);/is', $sql, $matches, PREG_SET_ORDER)) {
        return;
    }

    foreach ($matches as [, $table, $action]) {
        if (!isset($tables[$table])) {
            continue;
        }

        $action = trim(preg_replace('/\s+/', ' ', $action));

        // One ALTER TABLE can carry several clauses - most of the image-name
        // migration is a single statement adding six columns at once - and
        // splitting on top-level commas is what tells them apart without also
        // splitting the inside of a CHECK.
        foreach (splitTopLevel($action) as $clause) {
            applyAlterClause(trim($clause), $tables[$table]['columns']);
        }
    }
}

/** One clause of one ALTER TABLE, applied to the columns it is about. */
function applyAlterClause(string $clause, array &$columns): void
{
    if (preg_match('/^ADD COLUMN (?:IF NOT EXISTS )?"?(\w+)"? (.+)$/i', $clause, $m)) {
        $rest = $m[2];

        $column = [
            'name' => $m[1],
            'sqlType' => trim(preg_split('/\s+(?=NOT NULL|NULL|DEFAULT|PRIMARY|UNIQUE|REFERENCES|CHECK|GENERATED)/i', $rest)[0]),
            'nullable' => !preg_match('/\bNOT NULL\b/i', $rest),
            'enum' => parseCheckEnum($m[1], $rest),
        ];

        $existing = columnIndex($columns, $m[1]);

        if ($existing === null) {
            $columns[] = $column;
        } else {
            $columns[$existing] = $column;
        }

        return;
    }

    if (preg_match('/^DROP COLUMN (?:IF EXISTS )?"?(\w+)"?/i', $clause, $m)) {
        $columns = array_values(array_filter($columns, fn($c) => $c['name'] !== $m[1]));
        return;
    }

    if (preg_match('/^RENAME COLUMN "?(\w+)"? TO "?(\w+)"?/i', $clause, $m)) {
        $index = columnIndex($columns, $m[1]);
        if ($index !== null) {
            $columns[$index]['name'] = $m[2];
        }
        return;
    }

    if (preg_match('/^ALTER COLUMN "?(\w+)"? (.+)$/i', $clause, $m)) {
        $index = columnIndex($columns, $m[1]);
        if ($index === null) {
            return;
        }

        $change = $m[2];

        if (preg_match('/^TYPE (.+)$/i', $change, $type)) {
            $columns[$index]['sqlType'] = trim($type[1]);
        } elseif (preg_match('/^SET NOT NULL/i', $change)) {
            $columns[$index]['nullable'] = false;
        } elseif (preg_match('/^DROP NOT NULL/i', $change)) {
            $columns[$index]['nullable'] = true;
        }

        // SET DEFAULT and DROP DEFAULT change nothing a caller can see.
        return;
    }

    // A CHECK added afterwards is the same enum as one written inline, and is
    // read more loosely: an inline one is `CHECK (col IN (...))` and nothing
    // else, while one added by ALTER is a whole condition - the format columns
    // are `CHECK (col IS NULL OR col IN (...))`, since NULL is a real answer
    // there. Being inside a CHECK is already established by getting here, so
    // the `col IN (...)` is looked for wherever in the condition it sits.
    if (preg_match('/^ADD CONSTRAINT \w+ CHECK /i', $clause)) {
        foreach ($columns as $index => $column) {
            if ($values = parseInEnum($column['name'], $clause)) {
                $columns[$index]['enum'] = $values;
            }
        }
    }
}

/** Where a column sits in a table's list, or null when it is not in it. */
function columnIndex(array $columns, string $name): ?int
{
    foreach ($columns as $index => $column) {
        if ($column['name'] === $name) {
            return $index;
        }
    }

    return null;
}

/** The CREATE TABLE statements in one piece of SQL. */
function parseSchema(string $sql, string $database): array
{
    $tables = [];

    if (!preg_match_all('/^CREATE TABLE(?: IF NOT EXISTS)? (\w+)\s*\((.*?)^\);/ms', $sql, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
        return $tables;
    }

    foreach ($matches as $match) {
        $table = $match[1][0];
        $interface = interfaceName($sql, $match[0][1]);
        $match = [$match[0][0], $match[1][0], $match[2][0]];
        $body = preg_replace('/--[^\n]*/', '', $match[2]);

        $columns = [];
        foreach (splitTopLevel($body) as $line) {
            $line = trim($line);
            if ($line === '' || preg_match('/^(CONSTRAINT|PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|INDEX)\b/i', $line)) {
                continue;
            }

            if (!preg_match('/^"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s+(.+)$/s', $line, $col)) {
                continue;
            }

            $rest = $col[2];
            $columns[] = [
                'name' => $col[1],
                'sqlType' => trim(preg_split('/\s+(?=NOT NULL|NULL|DEFAULT|PRIMARY|UNIQUE|REFERENCES|CHECK|GENERATED)/i', $rest)[0]),
                'nullable' => !preg_match('/\bNOT NULL\b/i', $rest) && !preg_match('/\bPRIMARY KEY\b/i', $rest),
                // A CHECK (col IN ('a','b')) is an enum in everything but name.
                'enum' => parseCheckEnum($col[1], $match[2]),
            ];
        }

        $tables[$table] = [
            'table' => $table,
            'database' => $database,
            'interface' => $interface,
            'columns' => $columns,
        ];
    }

    return $tables;
}

/**
 * The `-- name: Foo` line in the banner comment above a table.
 *
 * Taken as the nearest marker before the table with no other CREATE TABLE in
 * between - commented-out ones included. The schema keeps a disabled
 * `-- CREATE TABLE languages` block complete with its own `-- name: Language`,
 * and without that guard the marker drifts down onto whichever table comes next.
 */
function interfaceName(string $sql, int $offset): ?string
{
    $before = substr($sql, 0, $offset);

    if (!preg_match_all('/--\s*name:\s*(\w+)/i', $before, $found, PREG_OFFSET_CAPTURE)) {
        return null;
    }

    [$name, $at] = end($found[1]);
    $between = substr($before, $at);

    return preg_match('/CREATE TABLE/i', $between) ? null : $name;
}

/** Splits a CREATE TABLE body on commas that are not inside brackets. */
function splitTopLevel(string $body): array
{
    $parts = [];
    $depth = 0;
    $current = '';

    for ($i = 0, $len = strlen($body); $i < $len; $i++) {
        $char = $body[$i];
        if ($char === '(') {
            $depth++;
        } elseif ($char === ')') {
            $depth--;
        }

        if ($char === ',' && $depth === 0) {
            $parts[] = $current;
            $current = '';
            continue;
        }
        $current .= $char;
    }
    $parts[] = $current;

    return $parts;
}

/** The allowed values of `CHECK (col IN ('a', 'b'))`, if the column has one. */
function parseCheckEnum(string $column, string $body): ?array
{
    $pattern = '/CHECK\s*\(\s*"?' . preg_quote($column, '/') . '"?\s+IN\s*\(([^)]*)\)/i';
    if (!preg_match($pattern, $body, $m)) {
        return null;
    }

    return enumValues($m[1]);
}

/**
 * The same, for a condition already known to be inside a CHECK.
 *
 * `col IN (...)` wherever it appears rather than immediately after the opening
 * bracket, because a constraint added by ALTER is a whole condition and the
 * ones here read `col IS NULL OR col IN (...)` - NULL being a real answer for
 * a setting that means "however this device does it".
 */
function parseInEnum(string $column, string $condition): ?array
{
    $pattern = '/"?' . preg_quote($column, '/') . '"?\s+IN\s*\(([^)]*)\)/i';

    return preg_match($pattern, $condition, $m) ? enumValues($m[1]) : null;
}

/** The quoted strings in an IN list, with SQL's doubled quote undone. */
function enumValues(string $list): ?array
{
    preg_match_all("/'((?:[^']|'')*)'/", $list, $values);

    return array_map(fn($v) => str_replace("''", "'", $v), $values[1]) ?: null;
}

$tables = [
    ...parseMigrations(__DIR__ . '/migrations/users', 'users'),
    ...parseMigrations(__DIR__ . '/migrations/genshin_impact', 'genshin_impact'),
];
ksort($tables);

// A handler's table is read out of its source, and the fallback that looks for
// a bare `FROM x` also finds the word in a sentence. Only names the schema knows
// are tables survive.
foreach ($routes as &$route) {
    $route['tables'] = array_values(array_filter($route['tables'], fn($t) => isset($tables[$t])));
}
unset($route);

// ── Write it out ──────────────────────────────────────────────────────────────

$spec = [
    'generated' => 'php/generate-api-spec.php - do not edit by hand',
    // Which site this deployment serves. The route table is the same either
    // way; this only names the API in the document generated from it.
    'site' => currentSite(),
    'routes' => $routes,
    'models' => array_values($models),
    'shapes' => array_values($shapes),
    'tables' => array_values($tables),
];

file_put_contents($outPath, json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");

$declared = count(array_filter($routes, fn($route) => $route['responds'] !== null));

printf(
    "%s\n  %d routes (%d declaring a response), %d models, %d shapes, %d tables\n",
    realpath($outPath) ?: $outPath,
    count($routes),
    $declared,
    count($models),
    count($shapes),
    count($tables)
);
