<?php

/**
 * The small answers that are not a row and not worth a shape of their own
 * anywhere else.
 */

/** A bare acknowledgement. Most writes that return nothing else return this. */
class ApiMessage extends ResponseShape
{
    public function __construct(
        public readonly string $message,
        /** Some endpoints add a sentence explaining what did *not* happen. */
        public readonly ?string $note = null,
    ) {
    }
}
