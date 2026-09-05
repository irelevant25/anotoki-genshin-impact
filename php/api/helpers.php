<?php

use Psr\Http\Message\ResponseInterface as Response;

/**
 * The origins allowed to call this API from a browser.
 *
 * The one source of truth for CORS — the middleware in index.php reads it, and
 * a request's Origin is echoed back only if it is on this list, so the allow
 * header is never a blanket "*" and never a reflected stranger. Override per
 * deployment with config/cors.local.php returning a list of origins.
 */
function corsAllowedOrigins(): array
{
    static $origins = null;
    if ($origins !== null) {
        return $origins;
    }

    $localFile = dirname(__DIR__) . '/config/cors.local.php';
    if (file_exists($localFile)) {
        $value = require $localFile;
        if (is_array($value)) {
            return $origins = $value;
        }
    }

    return $origins = [
        'http://localhost:4200',
        'https://anotoki.eu',
    ];
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