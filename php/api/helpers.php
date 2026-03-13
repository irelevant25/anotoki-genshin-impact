<?php

use Psr\Http\Message\ResponseInterface as Response;

function setCorsHeaders(): void
{
    $allowedOrigins = [
        'http://localhost:4200',
        'https://yoursite.com',         // change this to your production domain
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Expose-Headers: X-Refresh-Token');
}

function handlePreflight(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
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
    $response->getBody()->write(json_encode($data));
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($status);
}