<?php

class Affiliation extends DbModel
{
    public function __construct(
        public readonly string $name,
    ) {}
}
