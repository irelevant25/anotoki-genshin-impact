<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface;

/**
 * An answer decided deep inside the work of a request - a limit reached
 * inside a transaction, a visitor's row gone while a save waited for it -
 * thrown to where the answer is written: the default error handler in
 * api/index.php answers it as it is, `{"error": "...", "code": "..."}` (with
 * `params` when it has them) under its status and headers. Whoever began a
 * transaction rolls it back on the way out, as for any exception.
 *
 * Not a failure of the API: the handler writes no PHP log line and no trace
 * for it, and the error log writes its answer as it would any other a route
 * returns - when its rule takes the status (siteErrorLog()).
 */
final class ApiRefusal extends RuntimeException
{
    /**
     * @param array<string, string> $headers  e.g. ['Retry-After' => '60']
     * @param ?array<string, mixed> $params    what the frontend words the answer from
     */
    public function __construct(public readonly int $status, public readonly string $refusal, string $message, public readonly array $headers = [], public readonly ?array $params = null)
    {
        parent::__construct($message);
    }

    /** The body: genshin's `{"error", "code"}`, and `params` when there are any. */
    public function body(): array
    {
        $body = ['error' => $this->getMessage(), 'code' => $this->refusal];
        if ($this->params !== null) {
            $body['params'] = $this->params;
        }

        return $body;
    }
}

/**
 * The answer an ApiRefusal stands for: its status, its headers and body().
 * The default error handler (api/index.php) writes it this way, and so does
 * requireOwner(), which adds the headers every answer about somebody's own
 * data carries (ownerPrivate()).
 */
function apiRefusalResponse(ApiRefusal $refusal): Response
{
    $response = new \Slim\Psr7\Response($refusal->status);
    $response->getBody()->write(json_encode($refusal->body(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    foreach ($refusal->headers as $name => $value) {
        $response = $response->withHeader($name, $value);
    }

    return $response->withHeader('Content-Type', 'application/json');
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
    $response = $response->withStatus($status)->withHeader('Content-Type', 'application/json');
    $response->getBody()->write($json);
    return $response;
}

/**
 * The path a gate judges: the one the router will route on, never the one the
 * request arrived with.
 *
 * The request keeps its path percent-encoded, as the browser sent it; Slim's
 * router decodes it once (rawurldecode) and puts a slash in front when there
 * is none, and only then picks the route (RouteResolver::computeRoutingResults).
 * A gate that read the raw path would let `/%61pi/characters` past every
 * `/api/` check and still be routed to `/api/characters` - so every list of
 * this site's that a path is looked up in (TOKENLESS_PATHS, the links open
 * while the site is closed) is asked with this, which does exactly what the
 * router does. The anotoki library's gates read the path the same way.
 */
function gatePath(ServerRequestInterface $request): string
{
    $path = rawurldecode($request->getUri()->getPath());

    return $path === '' || $path[0] !== '/' ? '/' . $path : $path;
}

/**
 * Whether a list leaves a path open: an entry starting with `~` is a pattern
 * the decoded path must match whole (end it with D); any other is a path that
 * is open itself, with everything under it - not every path that merely
 * begins with the same letters, so /api/me does not open a future /api/media.
 *
 * @param list<string> $open
 */
function gatePathOpen(string $path, array $open): bool
{
    foreach ($open as $entry) {
        if (str_starts_with($entry, '~') ? preg_match($entry, $path) === 1 : $path === $entry || str_starts_with($path, rtrim($entry, '/') . '/')) {
            return true;
        }
    }

    return false;
}
