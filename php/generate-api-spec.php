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
    $chain = '';
    for ($i = $reflection->getEndLine() - 1, $end = min(count($lines), $i + 12); $i < $end; $i++) {
        $chain .= $lines[$i];
        if (str_contains($lines[$i], ';')) {
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
        'expanded' => $expanded,
        'payload' => $payload,
        'partial' => $partial,
        'auth' => str_contains($chain, 'requireAuth()') || $roles !== [],
        'roles' => $roles,
    ];
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

// ── Row shapes, from the schema files ─────────────────────────────────────────

/**
 * Pulls every CREATE TABLE out of a schema file.
 *
 * The interface name comes from the `-- name: Foo` line in the banner comment
 * above the table, which the schema already carries. A table with no such line
 * is still read; it just has no name of its own to be generated under.
 */
function parseSchema(string $path, string $database): array
{
    $sql = file_get_contents($path);
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

    preg_match_all("/'((?:[^']|'')*)'/", $m[1], $values);
    return array_map(fn($v) => str_replace("''", "'", $v), $values[1]) ?: null;
}

$tables = [
    ...parseSchema(__DIR__ . '/schema_pgsql_users.sql', 'users'),
    ...parseSchema(__DIR__ . '/schema_pgsql_genshin_impact.sql', 'genshin_impact'),
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
    'tables' => array_values($tables),
];

file_put_contents($outPath, json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");

printf(
    "%s\n  %d routes, %d models, %d tables\n",
    realpath($outPath) ?: $outPath,
    count($routes),
    count($models),
    count($tables)
);
