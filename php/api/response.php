<?php

/**
 * What a route answers with, said out loud.
 *
 * The route table already declares everything else about an endpoint - who may
 * call it, what a body must contain, which table it reads - and all of that is
 * read straight back out to generate the client and the OpenAPI document. The
 * one thing nothing declared was the response, so it was inferred from the
 * `DbQuery::from()` call in the handler and, where that was not enough, written
 * out by hand on the far side in TypeScript. Two places to keep in step, and
 * only one of them next to the code it describes.
 *
 *     ->add(responds('characters', list: true))     a list of `characters` rows
 *     ->add(responds('characters'))                 one of them
 *     ->add(responds(FeedbackPage::class))          a shape declared below
 *     ->add(responds(ApiMessage::class))
 *
 * A row response names its table, because the row is the table - every column,
 * including the id and the audit stamps a model does not carry. Anything else
 * names a ResponseShape, which is a constructor and nothing more: no behaviour,
 * no instantiation at runtime, just somewhere for the shape to be written down
 * in the same language and the same directory as the handler that returns it.
 */

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * A response that is not a table row.
 *
 * Declared exactly like a DbModel - promoted constructor parameters, read by
 * reflection - so the same machinery that turns models into request types turns
 * these into response types.
 *
 * PHP has no type for "array of what", so a `@var` docblock says it, and the
 * name in it is resolved in this order:
 *
 *   ResponseShape   another shape declared here
 *   DbModel         the model's own fields, as a `/full` body carries them -
 *                   id and the parent link optional, since a child being
 *                   edited may not have been saved yet
 *   table name      the row as it is read back, every column included
 *
 * The three never collide: a table is snake_case and a class is not.
 *
 * A shape may also carry `@merges <DbModel>`, for the children of a `/full`
 * read. registerFullResource() merges a child's own children in beside its
 * columns rather than nesting them under a key, so `@merges WeaponAscension`
 * plus a `costs` field describes what actually arrives.
 */
abstract class ResponseShape
{
}

/**
 * Declares the shape of a successful response.
 *
 * This is a declaration rather than a check: it passes the request straight
 * through, and nothing here inspects or rewrites what the handler returns.
 * Enforcing the shape would mean serialising every response through it, which
 * is a change to what the API sends rather than to what it says about itself.
 *
 * @param string $shape A table name, or a ResponseShape class.
 * @param bool   $list  True where the route answers with an array of them.
 */
function responds(string $shape, bool $list = false): callable
{
    return static fn(Request $request, RequestHandler $handler) => $handler->handle($request);
}
