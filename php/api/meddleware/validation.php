<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

function validateRequest(string $modelClass, bool $partial = false): callable
{
    return function (Request $request, RequestHandler $handler) use ($modelClass, $partial): Response {
        $body = $request->getParsedBody();
        $errors = validateBody($modelClass, $body, $partial);

        if ($errors) {
            error_log('[validateRequest] Validation failed for ' . $modelClass . ': ' . json_encode($errors));
            return respondJson(new \Slim\Psr7\Response(), ['errors' => $errors], 422);
        }

        return $handler->handle($request);
    };
}