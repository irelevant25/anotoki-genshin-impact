<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

function validateRequest(string $modelClass, bool $partial = false): callable
{
    return function (Request $request, RequestHandler $handler) use ($modelClass, $partial): Response {
        // Null when a request carries no body or no Content-Type, and an object
        // when the body was XML. validateBody() takes an array and nothing else,
        // so either one was a TypeError - a 500 - where the honest answer is a
        // 422 listing the fields that are missing.
        $body = $request->getParsedBody();
        if (!is_array($body)) {
            $body = [];
        }
        $errors = validateBody($modelClass, $body, $partial);

        if ($errors) {
            error_log('[validateRequest] Validation failed for ' . $modelClass . ': ' . json_encode($errors));
            return respondJson(new \Slim\Psr7\Response(), ['errors' => $errors], 422);
        }

        return $handler->handle($request);
    };
}