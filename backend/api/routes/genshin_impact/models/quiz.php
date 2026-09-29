<?php

class Quiz extends DbModel
{
    public function __construct(
        public readonly string $name,
    ) {}
}
