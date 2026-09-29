<?php

use Psr\Http\Message\ResponseInterface as Response;

/**
 * The origins allowed to call this API from a browser.
 *
 * The one source of truth for CORS — the middleware in index.php reads it, and
 * a request's Origin is echoed back only if it is on this list, so the allow
 * header is never a blanket "*" and never a reflected stranger. The list is
 * this deployment's own, from config/app.local.php: the site's address - the
 * dev server on :4200 while developing, where the pages and the API are two
 * origins - and whatever other origins it names. There is no built-in list;
 * the one there used to be named a production domain in every checkout.
 */
function corsAllowedOrigins(): array
{
    static $origins = null;
    if ($origins !== null) {
        return $origins;
    }

    $app = appConfig();

    return $origins = array_values(array_unique([$app['url'], ...$app['cors_origins']]));
}

/**
 * The whole API's answer while the site is not set up: 503, and where to go.
 *
 * Written straight out rather than through Slim, because nothing behind it
 * could run - there is no database to reach and no IAM to check a token
 * against - and none of it is worth the chance of trying. See config/local.php
 * for what "set up" means.
 *
 * Any origin may read it. The CORS allowlist is one of the things setup.php has
 * not written yet, so there is no list to consult, and the development frontend
 * on another port has to be able to read this answer to say "not set up" rather
 * than "cannot reach the API". It carries that sentence and nothing else, and
 * no request gets any further.
 */
function answerNotSetUp(): never
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Http-Method-Override');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    // Or the answer outlives the setup: a browser or a proxy holding on to it
    // would go on showing "not set up" to a site that is.
    header('Cache-Control: no-store');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'This site is not set up yet. Open ' . SETUP_PATH . ' to set it up.',
        'code' => 'not_set_up',
        'setup' => SETUP_PATH,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * A boolean in the one form the driver and PostgreSQL both accept.
 *
 * PDO binds a PHP `true` as '1', which Postgres reads as true - and a PHP
 * `false` as the empty string, which it refuses outright with "invalid input
 * syntax for type boolean". So a false never reaches a bound parameter as
 * itself, and the failure is at the moment of writing rather than anywhere it
 * could be mistaken for a rule.
 */
function userBool(bool $value): string
{
    return $value ? 'true' : 'false';
}

/**
 * The caller's address, as far as it can be known.
 *
 * REMOTE_ADDR only. X-Forwarded-For is a header the caller writes, so trusting
 * it would let anybody set their own address - and the feedback form's
 * per-address limit would be one header away from not being a limit. Behind a
 * proxy this records the proxy; the fix there is a list of trusted proxies,
 * not trusting the header.
 */
function requestIp(\Psr\Http\Message\ServerRequestInterface $request): ?string
{
    $ip = $request->getServerParams()['REMOTE_ADDR'] ?? null;

    return is_string($ip) && $ip !== '' ? substr($ip, 0, 45) : null;
}

/** The browser, trimmed to what a column holds. */
function requestUserAgent(\Psr\Http\Message\ServerRequestInterface $request): ?string
{
    $agent = trim($request->getHeaderLine('User-Agent'));

    return $agent === '' ? null : substr($agent, 0, 255);
}

/** The Origin to echo back, or null when the caller's is not allowed. */
function corsAllowOrigin(?string $origin): ?string
{
    return $origin !== null && in_array($origin, corsAllowedOrigins(), true) ? $origin : null;
}

/**
 * Validates $body against the constructor parameters of $class.
 * Returns an array of field => error message pairs; empty means valid.
 */
function validateBody(string $class, array $body, bool $partial = false): array
{
    $errors = [];
    $params = (new ReflectionClass($class))->getConstructor()->getParameters();

    $knownKeys = array_map(fn($p) => $p->getName(), $params);

    // A row goes out with `icon` and `icon_name` beside `icon_file_id`, and a
    // form sends back what it was given. They are not fields on the model and
    // nothing writes them, but they are not unknown either.
    foreach (array_values($knownKeys) as $key) {
        array_push($knownKeys, ...assetAliasesFor($key));
    }

    foreach (array_keys($body) as $key) {
        if (!in_array($key, $knownKeys, true)) {
            $errors[$key] = 'unknown field';
        }
    }

    foreach ($params as $param) {
        $name = $param->getName();
        $type = $param->getType();
        $value = $body[$name] ?? null;

        if ($partial && !array_key_exists($name, $body)) {
            continue;
        }

        $required = $type && !$type->allowsNull() && !$param->isDefaultValueAvailable();
        if ($required && ($value === null || $value === '')) {
            $errors[$name] = 'required';
            continue;
        }

        if ($value === null || !($type instanceof ReflectionNamedType)) {
            continue;
        }

        $expected = $type->getName();
        $valid = match ($expected) {
            'string' => is_string($value),
            'int' => is_int($value) || (is_string($value) && ctype_digit($value)),
            'float' => is_numeric($value),
            'bool' => is_bool($value),
            'array' => is_array($value),
            default => true,
        };

        if (!$valid) {
            $errors[$name] = "expected {$expected}, got " . gettype($value);
        }
    }

    return $errors;
}

function respondJson(Response $response, mixed $data, int $status = 200): Response
{
    $json = json_encode($data);
    $response = $response
        ->withStatus($status)
        ->withHeader('Content-Type', 'application/json');
    $response->getBody()->write($json);
    return $response;
}